import React, { useState, useMemo } from 'react';
import { Role, User, Store, MockDB } from './types';
import { mockDB as initialDB } from './store';
import AdminDashboard from './views/AdminDashboard';
import ManagerDashboard from './views/ManagerDashboard';
import GestorDashboard from './views/GestorDashboard';
import { Layout } from './components/Layout';

const App: React.FC = () => {
  // El estado principal de la app es la base de datos completa.
  // Esto permite a los componentes hijos modificarla.
  const [db, setDb] = useState<MockDB>(initialDB);
  const [currentUser, setCurrentUser] = useState<User>(db.users[0]); // Default to Admin

  // Derivamos la tienda activa del usuario actual
  const activeStore = useMemo(() => {
    if (currentUser.storeId) {
      return db.stores.find(s => s.id === currentUser.storeId);
    }
    return undefined;
  }, [currentUser, db.stores]);

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
      users={db.users} 
      currentUser={currentUser} 
      setCurrentUser={setCurrentUser}
      storeName={activeStore?.name}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;