
import React, { useState, useMemo, useEffect } from 'react';
import { Role, User, Store } from './types';
import { mockDB } from './store';
import AdminDashboard from './views/AdminDashboard';
import ManagerDashboard from './views/ManagerDashboard';
import GestorDashboard from './views/GestorDashboard';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User>(mockDB.users[0]); // Default to Admin for demo
  const [activeStore, setActiveStore] = useState<Store | undefined>(mockDB.stores[0]);

  // Handle auto-switching store when user changes (Manager/Gestor)
  useEffect(() => {
    if (currentUser.storeId) {
      const store = mockDB.stores.find(s => s.id === currentUser.storeId);
      setActiveStore(store);
    }
  }, [currentUser]);

  const renderContent = () => {
    switch (currentUser.role) {
      case Role.ADMIN:
        return <AdminDashboard />;
      case Role.MANAGER:
        return <ManagerDashboard user={currentUser} store={activeStore!} />;
      case Role.GESTOR:
        return <GestorDashboard user={currentUser} store={activeStore!} />;
      default:
        return <div>Access Denied</div>;
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      {/* Simulation Header for Role Switching */}
      <header className="bg-slate-900 text-white px-4 py-2 flex justify-between items-center text-xs">
        <div className="flex gap-4 items-center">
          <span className="font-bold uppercase tracking-widest text-slate-400">Environment Simulator:</span>
          <div className="flex gap-2">
            {mockDB.users.map(u => (
              <button 
                key={u.id}
                onClick={() => setCurrentUser(u)}
                className={`px-3 py-1 rounded transition-colors ${currentUser.id === u.id ? 'bg-primary text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-300'}`}
              >
                {u.name} ({u.role})
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-sm">info</span>
          <span>Switching users mimics multi-tenant login states</span>
        </div>
      </header>

      {renderContent()}
    </div>
  );
};

export default App;
