import React, { useState, useMemo, useEffect } from 'react';
import { Role, User, Store, MockDB } from './types';
import AdminDashboard from './views/AdminDashboard';
import ManagerDashboard from './views/ManagerDashboard';
import GestorDashboard from './views/GestorDashboard';
import Login from './views/Login';
import { Layout } from './components/Layout';

const App: React.FC = () => {
  const [db, setDb] = useState<MockDB | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refreshDb = async () => {
    try {
      const resources = ['users', 'stores', 'products', 'inventory', 'sales', 'closings'];
      const promises = resources.map(resource => 
        fetch(`http://localhost:3001/api/${resource}`).then(res => {
          if (!res.ok) {
            throw new Error(`HTTP error for ${resource}! status: ${res.status}`);
          }
          return res.json();
        })
      );
      
      const [users, stores, products, inventory, sales, closings] = await Promise.all(promises);

      // Assemble the database object
      const data: MockDB = { users, stores, products, inventory, sales, closings };

      // Dates are transmitted as strings, so we need to convert them back to Date objects
      data.stores.forEach(s => s.exchangeRates.forEach(xr => {
          xr.startDate = new Date(xr.startDate);
          if(xr.endDate) xr.endDate = new Date(xr.endDate);
      }));
      data.inventory.forEach(i => i.assignedAt = new Date(i.assignedAt));
      data.sales.forEach(s => s.soldAt = new Date(s.soldAt));
      data.closings.forEach(c => {
          c.initiatedAt = new Date(c.initiatedAt);
          if(c.completedAt) c.completedAt = new Date(c.completedAt);
      });

      setDb(data);
    } catch (err: any) {
      setError(`Failed to fetch data: ${err.message}`);
      console.error(err);
    }
  };

  useEffect(() => {
    refreshDb();
  }, []);

  const activeStore = useMemo(() => {
    if (currentUser?.storeId && db) {
      return db.stores.find(s => s.id === currentUser.storeId);
    }
    return undefined;
  }, [currentUser, db]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    refreshDb(); // Refresh data after login, especially if a new user was created
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };
  
  // Placeholder for mutations
  const handleSetDb = (newDbState: React.SetStateAction<MockDB>) => {
      // In a real app, this would trigger a POST/PUT request to the backend.
      // For now, we'll just optimistically update the UI.
      // @ts-ignore
      setDb(newDbState);
      console.warn("setDb is a placeholder. Data mutations are not sent to the backend in this version.");
  }


  if (!db) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        {error ? <p className="text-red-500">{error}</p> : <p>Loading database...</p>}
      </div>
    );
  }

  if (!currentUser) {
    return <Login db={db} onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (currentUser.role) {
      case Role.ADMIN:
        return <AdminDashboard db={db} setDb={handleSetDb} />;
      case Role.MANAGER:
        if (!activeStore) return <div>Error: Manager sin tienda asignada.</div>;
        return <ManagerDashboard user={currentUser} store={activeStore} db={db} setDb={handleSetDb} />;
      case Role.GESTOR:
        if (!activeStore) return <div>Error: Gestor sin tienda asignada.</div>;
        return <GestorDashboard user={currentUser} store={activeStore} db={db} setDb={handleSetDb} />;
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