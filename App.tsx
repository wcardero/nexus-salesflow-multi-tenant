import React, { useState, useMemo } from 'react';
import { Role, User, Store, MockDB } from './types';
import { mockDB as initialDB } from './store';
import AdminDashboard from './views/AdminDashboard';
import ManagerDashboard from './views/ManagerDashboard';
import GestorDashboard from './views/GestorDashboard';
import Login from './views/Login';
import { Layout } from './components/Layout';

const App: React.FC = () => {
  const [db, setDb] = useState<MockDB>(initialDB);
  const [currentUser, setCurrentUser] = useState<User | null>(null); // Logged out by default

  const activeStore = useMemo(() => {
    if (currentUser?.storeId) {
      return db.stores.find(s => s.id === currentUser.storeId);
    }
    return undefined;
  }, [currentUser, db.stores]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
  };

  const handleLogout = () => {
    setCurrentUser(null);
  };

  if (!currentUser) {
    return <Login db={db} onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (currentUser.role) {
      case Role.ADMIN:
        return <AdminDashboard db={db} setDb={setDb} />;
      case Role.MANAGER:
        if (!activeStore) return <div>Error: Manager sin tienda asignada.</div>;
        return <ManagerDashboard user={currentUser} store={activeStore} db={db} setDb={setDb} />;
      case Role.GESTOR:
        if (!activeStore) return <div>Error: Gestor sin tienda asignada.</div>;
        return <GestorDashboard user={currentUser} store={activeStore} db={db} setDb={setDb} />;
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