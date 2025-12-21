import React, { useState, useMemo, useEffect } from 'react';
import { Role, User, Store, MockDB } from './types';
import AdminDashboard from './views/AdminDashboard';
import ManagerDashboard from './views/ManagerDashboard';
import GestorDashboard from './views/GestorDashboard';
import Login from './views/Login';
import { Layout } from './components/Layout';
import DirectorDashboard from './views/DirectorDashboard';

const App: React.FC = () => {
  const [db, setDb] = useState<MockDB | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true); // New state to track auth check

  const refreshDb = async () => {
    try {
      // Get the token from localStorage or wherever it's stored
      const token = localStorage.getItem('token');

      if (!token) {
        // If there's no token, don't show an error, just return
        // The user will be redirected to login via the rendering logic
        return;
      }

      const resources = ['users', 'stores', 'products', 'inventory', 'product-stock', 'assigned-inventory', 'sales', 'closings', 'audit-logs'];
      const promises = resources.map(resource =>
        fetch(`http://localhost:3001/api/${resource}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).then(res => {
          if (!res.ok) {
            if (res.status === 401 || res.status === 403) {
              // Token might be expired, redirect to login
              localStorage.removeItem('token');
              window.location.href = '/';
            }
            throw new Error(`HTTP error for ${resource}! status: ${res.status}`);
          }
          return res.json();
        })
      );

      const [users, stores, products, inventory, productStock, assignedInventory, sales, closings, auditLogs] = await Promise.all(promises);

      // Assemble the database object
      const data: MockDB = { users, stores, products, inventory, productStock, assignedInventory, sales, closings, auditLogs };

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
    } catch (err: any) {
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
          const user = JSON.parse(userJson);
          setCurrentUser(user);
          // Verify token is still valid by making a simple request
          const response = await fetch('http://localhost:3001/api/users', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            // Token is valid, load the full database
            await refreshDb();
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
    refreshDb(); // Refresh data after login, especially if a new user was created
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
    switch (currentUser.role) {
      case Role.ADMIN:
        return <AdminDashboard db={db} refreshDb={refreshDb} />;
      case Role.DIRECTOR:
        if (!activeStore) return <div>Error: Director sin tienda asignada.</div>;
        return <DirectorDashboard />;
      case Role.MANAGER:
        if (!activeStore) return <div>Error: Manager sin tienda asignada.</div>;
        return <ManagerDashboard user={currentUser} store={activeStore} db={db} refreshDb={refreshDb} />;
      case Role.GESTOR:
        if (!activeStore) return <div>Error: Gestor sin tienda asignada.</div>;
        return <GestorDashboard user={currentUser} store={activeStore} db={db} />;
      default:
        return <div className="p-4">Acceso denegado. Rol no reconocido.</div>;
    }
  };

  return (
    <Layout 
      currentUser={currentUser} 
      onLogout={handleLogout}
      storeName={activeStore?.name}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
