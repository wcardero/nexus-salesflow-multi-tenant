import React, { useState, useMemo, useEffect } from 'react';
import { Role, User, Store, MockDB } from './types';
import AdminDashboard from './views/AdminDashboard';
import ManagerDashboard from './views/ManagerDashboard';
import GestorDashboard from './views/GestorDashboard';
import Login from './views/Login';
import { Layout } from './components/Layout';
import DirectorDashboard from './views/DirectorDashboard';
import StoreManagement from './views/StoreManagement';
import UserManagement from './views/UserManagement';

const App: React.FC = () => {
  const [db, setDb] = useState<MockDB | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true); // New state to track auth check
  const [currentView, setCurrentView] = useState('dashboard');

  const handleNavigate = (view: string) => {
    setCurrentView(view);
  };

  const refreshDb = async (roleOverride?: Role) => {
    try {
      // Get the token from localStorage or wherever it's stored
      const token = localStorage.getItem('token');
      console.log('refreshDb: token =', token ? 'EXISTS' : 'NULL');

      if (!token) {
        // If there's no token, don't show an error, just return
        // The user will be redirected to login via the rendering logic
        console.log('refreshDb: No token found, returning early');
        return;
      }

      const effectiveRole = roleOverride ?? currentUser?.role ?? null;

      const baseResources = [
        'stores',
        'products',
        'inventory',
        'product-stock',
        'assigned-inventory',
        'sales',
        'closings',
        'audit-logs',
      ];

      const resources =
        effectiveRole === Role.ADMIN
          ? ['users', ...baseResources]
          : baseResources;

      console.log('refreshDb: fetching resources:', resources);
      const results: [string, any][] = [];
      for (const resource of resources) {
        console.log(`refreshDb: fetching ${resource}...`);
        const res = await fetch(`http://localhost:3001/api/${resource}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!res.ok) {
          console.error(`refreshDb: Error fetching ${resource}:`, res.status, res.statusText);
          if (res.status === 401) {
            // Token expired or invalid, redirect to login
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
          }
          throw new Error(`HTTP error for ${resource}! status: ${res.status}`);
        }
        const data = await res.json();
        results.push([resource, data] as const);
        console.log(`refreshDb: ${resource} fetched successfully`);
      }

      const dataMap = Object.fromEntries(results as any) as Record<string, any>;

      // Assemble the database object
      const data: MockDB = {
        users: dataMap['users'] ?? [],
        stores: dataMap['stores'] ?? [],
        products: dataMap['products'] ?? [],
        inventory: dataMap['inventory'] ?? [],
        productStock: dataMap['product-stock'] ?? [],
        assignedInventory: dataMap['assigned-inventory'] ?? [],
        sales: dataMap['sales'] ?? [],
        closings: dataMap['closings'] ?? [],
        auditLogs: dataMap['audit-logs'] ?? [],
      };

      // Dates are transmitted as strings, so we need to convert them back to Date objects
      data.stores.forEach(s => s.exchangeRates.forEach(xr => {
          xr.startDate = new Date(xr.startDate);
          if(xr.endDate) xr.endDate = new Date(xr.endDate);
      }));
      data.inventory.forEach(i => i.assignedAt = new Date(i.assignedAt));
      data.assignedInventory.forEach(i => i.assignedAt = new Date(i.assignedAt));
      data.sales.forEach(s => s.soldAt = new Date(s.soldAt));
      data.closings.forEach(c => {
          c.initiatedAt = new Date(c.initiatedAt);
          if(c.completedAt) c.completedAt = new Date(c.completedAt);
      });
      data.auditLogs.forEach(log => log.timestamp = new Date(log.timestamp));

      setDb(data);
      console.log('refreshDb: data loaded successfully');
    } catch (err: any) {
      console.error('refreshDb: error:', err);
      setError(`Failed to fetch data: ${err.message}`);
      console.error(err);
    }
  };

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const token = localStorage.getItem('token');
      const userJson = localStorage.getItem('user');

      if (token && userJson) {
        // If there's a token, try to load the database
        try {
          const user: User = JSON.parse(userJson);
          setCurrentUser(user);
          // Verify token is still valid by making a simple request that all roles can access
          const response = await fetch('http://localhost:3001/api/stores', {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          if (response.ok) {
            // Token is valid, load the full database
            await refreshDb(user.role);
          } else {
            // Token is invalid/expired, remove it and show login
            handleLogout();
          }
        } catch (err) {
          // Network error or other issue, remove token and show login
          handleLogout();
        }
      }
      setCheckingAuth(false);
    };

    checkAuthAndLoadData();
  }, []);

  const activeStore = useMemo(() => {
    if (currentUser?.storeId && db) {
      return db.stores.find(s => s.id === currentUser.storeId);
    }
    return undefined;
  }, [currentUser, db]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem('user', JSON.stringify(user));
    refreshDb(user.role); // Refresh data after login, especially if a new user was created
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setDb(null);
    // Clear the token from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };
  
  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <p>Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  if (!db) {
    // If database is still null after auth check, load empty data for Login component
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <p>Loading database...</p>
      </div>
    );
  }

  const renderContent = () => {
    const roleString = (currentUser.role as any)?.toString?.() || '';
    const raw = roleString.trim().toLowerCase();
    const normalizedRole = raw.includes('admin')
      ? 'admin'
      : raw.includes('director')
      ? 'director'
      : raw.includes('manager')
      ? 'manager'
      : raw.includes('gestor')
      ? 'gestor'
      : raw;

    switch (currentView) {
      case 'dashboard':
        switch (normalizedRole) {
          case 'admin':
            return <AdminDashboard db={db} refreshDb={refreshDb} />;
          case 'director':
            if (!activeStore) return <div>Error: Director sin tienda asignada.</div>;
            return <DirectorDashboard />;
          case 'manager':
            if (!activeStore) return <div>Error: Manager sin tienda asignada.</div>;
            return <ManagerDashboard user={currentUser} store={activeStore} db={db} setDb={setDb} />;
          case 'gestor':
            if (!activeStore) return <div>Error: Gestor sin tienda asignada.</div>;
            return <GestorDashboard user={currentUser} store={activeStore} db={db} setDb={setDb} />;
          default:
            return (
              <div className="p-4">
                Acceso denegado. Rol no reconocido. Rol actual: {roleString || 'desconocido'}
              </div>
            );
        }
      case 'stores':
        switch (normalizedRole) {
          case 'admin':
            return <StoreManagement db={db} refreshDb={refreshDb} />;
          default:
            return <div className="p-4">Acceso denegado. Rol no reconocido.</div>;
        }
      case 'users':
        switch (normalizedRole) {
          case 'admin':
            return <UserManagement db={db} refreshDb={refreshDb} />;
          default:
            return <div className="p-4">Acceso denegado. Rol no reconocido.</div>;
        }
      case 'managers':
        switch (normalizedRole) {
          case 'director':
            return <DirectorDashboard db={db} refreshDb={refreshDb} />;
          default:
            return <div className="p-4">Acceso denegado. Rol no reconocido.</div>;
        }
      // Add other cases for other views here
      default:
        return <div>Vista no encontrada</div>;
    }
  };

  return (
    <Layout 
      currentUser={currentUser} 
      onLogout={handleLogout}
      storeName={activeStore?.name}
      onNavigate={handleNavigate}
      currentView={currentView}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
