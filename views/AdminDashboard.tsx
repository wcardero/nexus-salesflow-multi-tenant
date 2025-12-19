// views/AdminDashboard.tsx
import React, { useState } from 'react';
import { MockDB, Role, Store, User } from '../types';

interface AdminDashboardProps {
  db: MockDB;
  setDb: React.Dispatch<React.SetStateAction<MockDB>>;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ db, setDb }) => {
  const [newStoreName, setNewStoreName] = useState('');
  const [newManagerName, setNewManagerName] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>(db.stores[0]?.id || '');

  const handleCreateStore = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) {
      alert('El nombre de la tienda no puede estar vacío.');
      return;
    }

    const newStore: Store = {
      id: `store-${Date.now()}`,
      name: newStoreName,
      defaultCommissionRate: 0.1, // Default value
      exchangeRates: [ // Add a default exchange rate
        { id: `xr-${Date.now()}`, rate: 300, startDate: new Date() }
      ]
    };

    setDb(prevDb => ({
      ...prevDb,
      stores: [...prevDb.stores, newStore]
    }));
    setNewStoreName('');
    alert(`Tienda "${newStore.name}" creada exitosamente.`);
  };

  const handleCreateManager = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newManagerName.trim()) {
      alert('El nombre del manager no puede estar vacío.');
      return;
    }
    if (!selectedStoreId) {
      alert('Debe seleccionar una tienda.');
      return;
    }

    const newManager: User = {
      id: `user-manager-${Date.now()}`,
      name: newManagerName,
      role: Role.MANAGER,
      storeId: selectedStoreId,
    };

    setDb(prevDb => ({
      ...prevDb,
      users: [...prevDb.users, newManager]
    }));
    setNewManagerName('');
    alert(`Manager "${newManager.name}" asignado a la tienda seleccionada.`);
  };


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      {/* Columna de Gestión */}
      <div className="space-y-8">
        {/* Crear Tienda */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">Crear Nueva Tienda</h2>
          <form onSubmit={handleCreateStore} className="space-y-4">
            <div>
              <label htmlFor="storeName" className="block text-sm font-medium text-slate-600 dark:text-slate-400">Nombre de la Tienda</label>
              <input
                id="storeName"
                type="text"
                value={newStoreName}
                onChange={(e) => setNewStoreName(e.target.value)}
                className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                placeholder="Ej: Sucursal Central"
              />
            </div>
            <button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
              Crear Tienda
            </button>
          </form>
        </div>

        {/* Crear Manager */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">Crear y Asignar Manager</h2>
          <form onSubmit={handleCreateManager} className="space-y-4">
            <div>
              <label htmlFor="managerName" className="block text-sm font-medium text-slate-600 dark:text-slate-400">Nombre del Manager</label>
              <input
                id="managerName"
                type="text"
                value={newManagerName}
                onChange={(e) => setNewManagerName(e.target.value)}
                className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                placeholder="Ej: Juan Pérez"
              />
            </div>
            <div>
              <label htmlFor="storeId" className="block text-sm font-medium text-slate-600 dark:text-slate-400">Asignar a Tienda</label>
              <select
                id="storeId"
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              >
                <option value="" disabled>Seleccione una tienda</option>
                {db.stores.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
              Crear Manager
            </button>
          </form>
        </div>
      </div>

      {/* Columna de Visualización */}
      <div className="space-y-8">
         {/* Lista de Tiendas */}
         <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">Tiendas Existentes</h2>
            <ul className="space-y-2">
              {db.stores.map(store => (
                <li key={store.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">{store.name}</p>
                </li>
              ))}
            </ul>
        </div>

        {/* Lista de Managers */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">Managers y sus Tiendas</h2>
          <ul className="space-y-2">
            {db.users.filter(u => u.role === Role.MANAGER).map(manager => {
              const storeName = db.stores.find(s => s.id === manager.storeId)?.name || 'Sin tienda';
              return (
                <li key={manager.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                  <p className="font-semibold text-slate-700 dark:text-slate-300">{manager.name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{storeName}</p>
                </li>
              )
            })}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;