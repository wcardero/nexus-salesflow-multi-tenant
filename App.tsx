import React, { useState, useMemo, useEffect } from 'react';
import { Role, User, Store, MockDB } from './types';
import AdminDashboard from './views/AdminDashboard';
import ManagerDashboard from './views/ManagerDashboard';
import GestorDashboard from './views/GestorDashboard';
import Login from './views/Login';
import { Layout } from './components/Layout';
import DirectorDashboard from './views/DirectorDashboard';
import ManagerManagement from './views/ManagerManagement';
import StoreManagement from './views/StoreManagement';
import UserManagement from './views/UserManagement';

const normalizeRole = (role: Role | string): Role => {
  if (typeof role === 'string') {
    const roleLower = role.trim().toLowerCase();
    if (roleLower.includes('admin')) return Role.ADMIN;
    if (roleLower.includes('director')) return Role.DIRECTOR;
    if (roleLower.includes('manager')) return Role.MANAGER;
    if (roleLower.includes('gestor')) return Role.GESTOR;
  }
  return role as Role;
};

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

      if (!token) {
        // If there's no token, don't show an error, just return
        // The user will be redirected to login via the rendering logic
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
        'inventory-conflicts',
        'audit-logs',
      ];

      const resources =
        effectiveRole === Role.ADMIN
          ? ['users', ...baseResources]
          : effectiveRole === Role.MANAGER || effectiveRole === Role.DIRECTOR
            ? ['users', ...baseResources]
            : ['users', 'stores', 'products', 'inventory', 'product-stock', 'assigned-inventory', 'sales', 'closings', 'audit-logs'];

      const results: [string, any][] = [];
      for (const resource of resources) {
        try {
          const res = await fetch(`http://localhost:3001/api/${resource}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });
          if (!res.ok) {
            console.error(`refreshDb: Error fetching ${resource}:`, res.status, res.statusText);
            let errorData;
            try {
              errorData = await res.json();
            } catch (e) {
              errorData = res.statusText;
            }
            console.error(`refreshDb: Error data for ${resource}:`, errorData);
            if (res.status === 401) {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/';
            }
            throw new Error(`HTTP error for ${resource}! status: ${res.status}`);
          }
          const data = await res.json();
          results.push([resource, data] as const);
        } catch (err) {
          console.error(`refreshDb: Failed to fetch ${resource}:`, err);
          throw err;
        }
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
        inventoryConflicts: dataMap['inventory-conflicts'] ?? [],
        sales: dataMap['sales'] ?? [],
        closings: dataMap['closings'] ?? [],
        auditLogs: dataMap['audit-logs'] ?? [],
      };

        // Dates are transmitted as strings, so we need to convert them back to Date objects
        data.stores.forEach(s => {
          if (s.exchangeRates && Array.isArray(s.exchangeRates)) {
            s.exchangeRates.forEach(xr => {
              xr.startDate = new Date(xr.startDate);
              if(xr.endDate) xr.endDate = new Date(xr.endDate);
            });
          }
        });
        data.assignedInventory.forEach(i => i.assignedAt = new Date(i.assignedAt));

        data.inventoryConflicts.forEach(c => {
          c.createdat = new Date(c.createdat);
          if (c.resolvedat) c.resolvedat = new Date(c.resolvedat);
        });

        data.sales.forEach(s => s.soldAt = new Date(s.soldAt));

        // Convert dates in closings and their sales
        data.closings.forEach(c => {
          c.initiatedAt = new Date(c.initiatedAt);
          if (c.completedAt) c.completedAt = new Date(c.completedAt);
          if (c.sales && Array.isArray(c.sales)) {
            c.sales.forEach(s => s.soldAt = new Date(s.soldAt));
          }
        });

      // Update current user from fresh database data to avoid stale cache issues
      const storedUserJson = localStorage.getItem('user');
      if (storedUserJson) {
        const storedUser: User = JSON.parse(storedUserJson);
        const freshUser = data.users.find(u => u.id === storedUser.id);
        if (freshUser) {
          setCurrentUser(freshUser);
          localStorage.setItem('user', JSON.stringify(freshUser));
        } else {
        }
      }

      setDb(data);
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
             // Token is valid, load full database
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
    setCurrentView('dashboard');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };
  
   if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
        <p>Loading...</p>
      </div>
    );
  }

   if (!currentUser) {
      return <Login onLogin={handleLogin} />;
    }

  if (!db) {
    // If database is still null after auth check, show loading or error
    if (error) {
      return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
          <p className="text-danger-600 dark:text-danger-400 mb-4">Error: {error}</p>
          <button
            onClick={handleLogout}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-md"
          >
            Volver al login
          </button>
        </div>
      );
    }
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
        <p>Loading database...</p>
      </div>
    );
  }

  const renderContent = () => {
    const role = normalizeRole(currentUser.role);

    switch (currentView) {
      case 'dashboard':
        switch (role) {
          case Role.ADMIN:
            return <AdminDashboard db={db} refreshDb={refreshDb} />;
          case Role.DIRECTOR:
            if (!activeStore) return <div>Error: Director sin tienda asignada.</div>;
            return <DirectorDashboard db={db} refreshDb={refreshDb} currentUser={currentUser} />;
           case Role.MANAGER:
             if (!activeStore) return <div>Error: Manager sin tienda asignada.</div>;
             return <ManagerDashboard user={currentUser} store={activeStore} db={db} setDb={setDb} refreshDb={refreshDb} currentView={currentView} />;
          case Role.GESTOR:
            if (!activeStore) return <div>Error: Gestor sin tienda asignada.</div>;
            return <GestorDashboard user={currentUser} store={activeStore} db={db} setDb={setDb} refreshDb={refreshDb} />;
          default:
            return (
              <div className="p-4">
                Acceso denegado. Rol no reconocido. Rol actual: {currentUser.role}
              </div>
            );
        }
      case 'stores':
        switch (role) {
          case Role.ADMIN:
            return <StoreManagement db={db} refreshDb={refreshDb} />;
          default:
            return <div className="p-4">Acceso denegado. Rol no reconocido.</div>;
        }
      case 'users':
        switch (role) {
          case Role.ADMIN:
            return <UserManagement db={db} refreshDb={refreshDb} />;
          default:
            return <div className="p-4">Acceso denegado. Rol no reconocido.</div>;
        }
        case 'managers':
          switch (role) {
            case Role.DIRECTOR:
              return <ManagerManagement db={db} currentUser={currentUser} refreshDb={refreshDb} />;
            case Role.ADMIN:
              return <UserManagement db={db} setDb={setDb} currentView={currentView} />;
            default:
              return <div className="p-4">Acceso denegado. Rol no reconocido.</div>;
          }
       case 'report-ventas':
         switch (role) {
           case Role.MANAGER:
             if (!activeStore) return <div>Error: Manager sin tienda asignada.</div>;
             return <ManagerDashboard user={currentUser} store={activeStore} db={db} setDb={setDb} refreshDb={refreshDb} currentView={currentView} />;
           default:
             return <div className="p-4">Acceso denegado. Rol no reconocido.</div>;
         }
       case 'report-cierres':
         switch (role) {
           case Role.MANAGER:
             if (!activeStore) return <div>Error: Manager sin tienda asignada.</div>;
             return <ManagerDashboard user={currentUser} store={activeStore} db={db} setDb={setDb} refreshDb={refreshDb} currentView={currentView} />;
           default:
             return <div className="p-4">Acceso denegado. Rol no reconocido.</div>;
         }
       default:
        return <div>Vista no encontrada</div>;
    }
  };

  return (
    <Layout
      currentUser={currentUser}
      onLogout={handleLogout}
      storeName={activeStore?.name}
      store={activeStore}
      onNavigate={handleNavigate}
      currentView={currentView}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
