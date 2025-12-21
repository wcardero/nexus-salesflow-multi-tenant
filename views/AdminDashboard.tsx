// views/AdminDashboard.tsx
import React, { useState } from 'react';
import { MockDB, Role, Store, User } from '../types';

interface AdminDashboardProps {
  db: MockDB;
  setDb: React.Dispatch<React.SetStateAction<MockDB>>;
  currentUser: User; // Added currentUser prop
  refreshDb: () => Promise<void>; // Added refreshDb prop
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ db, setDb, currentUser, refreshDb }) => {
  const [newStoreName, setNewStoreName] = useState('');
  const [newManagerName, setNewManagerName] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>(db.stores[0]?.id || '');
  const [passwordChangeLoading, setPasswordChangeLoading] = useState(false);

  // State for password change form
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');

  // State for editing store name
  const [editingStoreId, setEditingStoreId] = useState<string | null>(null);
  const [editedStoreName, setEditedStoreName] = useState('');

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) {
      alert('El nombre de la tienda no puede estar vacío.');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/stores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newStoreName, defaultCommissionRate: 0.1 }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear la tienda.');
      }
      await refreshDb(); // Refresh after successful creation
      setNewStoreName('');
      alert(`Tienda "${newStoreName}" creada exitosamente.`);
    } catch (error: any) {
      console.error('Error creating store:', error);
      alert(`Error al crear la tienda: ${error.message}`);
    }
  };

  const handleUpdateStore = async (storeId: string) => {
    if (!editedStoreName.trim()) {
      alert('El nombre de la tienda no puede estar vacío.');
      return;
    }
    try {
      const response = await fetch(`http://localhost:3001/api/stores/${storeId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: editedStoreName }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al actualizar la tienda.');
      }
      await refreshDb();
      setEditingStoreId(null);
      setEditedStoreName('');
      alert(`Tienda actualizada exitosamente.`);
    } catch (error: any) {
      console.error('Error updating store:', error);
      alert(`Error al actualizar la tienda: ${error.message}`);
    }
  };

  const handleCancelEditStore = () => {
    setEditingStoreId(null);
    setEditedStoreName('');
  };


  const handleCreateManager = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newManagerName.trim()) {
      alert('El nombre del manager no puede estar vacío.');
      return;
    }
    if (!selectedStoreId) {
      alert('Debe seleccionar una tienda.');
      return;
    }
    // Generate a secure random password for the new manager
    const generatedPassword = Math.random().toString(36).substring(2, 10); // Simple 8-char alphanumeric
    try {
      const response = await fetch('http://localhost:3001/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          name: newManagerName, 
          password: generatedPassword, // Use generated password
          role: Role.MANAGER, 
          storeId: selectedStoreId 
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al crear el manager.');
      }
      await refreshDb(); // Refresh after successful creation
      setNewManagerName('');
      alert(`Manager "${newManagerName}" asignado a la tienda seleccionada con contraseña: ${generatedPassword}.`); // Alert the password
    } catch (error: any) {
      console.error('Error creating manager:', error);
      alert(`Error al crear el manager: ${error.message}`);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmNewPassword) {
      alert('La nueva contraseña y su confirmación no coinciden.');
      return;
    }
    if (!oldPassword || !newPassword) {
      alert('Todos los campos de contraseña son obligatorios.');
      return;
    }
    setPasswordChangeLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/users/${currentUser.id}/password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword, newPassword }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error al cambiar la contraseña.');
      }

      alert('Contraseña actualizada exitosamente.');
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
    } catch (error: any) {
      console.error('Error changing password:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setPasswordChangeLoading(false);
    }
  };


  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
      {/* Columna de Gestión */}
      <div className="space-y-8 lg:col-span-2">
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
                className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Ej: Sucursal Central"
              />
            </div>
            <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
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
                className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Ej: Juan Pérez"
              />
            </div>
            <div>
              <label htmlFor="storeId" className="block text-sm font-medium text-slate-600 dark:text-slate-400">Asignar a Tienda</label>
              <select
                id="storeId"
                value={selectedStoreId}
                onChange={(e) => setSelectedStoreId(e.target.value)}
                className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              >
                <option value="" disabled>Seleccione una tienda</option>
                {db.stores.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </div>
            <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
              Crear Manager
            </button>
          </form>
        </div>
      </div>

      {/* Columna de Visualización y Cambio de Contraseña */}
      <div className="space-y-8 lg:col-span-1">
         {/* Lista de Tiendas */}
         <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
            <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">Tiendas Existentes</h2>
            <ul className="space-y-2">
              {db.stores.map(store => (
                <li key={store.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">
                  {editingStoreId === store.id ? (
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={editedStoreName}
                        onChange={(e) => setEditedStoreName(e.target.value)}
                        className="flex-grow bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-1 px-2 text-sm"
                      />
                      <button onClick={() => handleUpdateStore(store.id)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-2 rounded-md text-xs">Guardar</button>
                      <button onClick={handleCancelEditStore} className="bg-slate-400 hover:bg-slate-500 text-white font-bold py-1 px-2 rounded-md text-xs">Cancelar</button>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <p className="font-semibold text-slate-700 dark:text-slate-300">{store.name}</p>
                      <button 
                        onClick={() => { setEditingStoreId(store.id); setEditedStoreName(store.name); }}
                        className="bg-primary-200 hover:bg-primary-300 text-primary-800 font-bold py-1 px-2 rounded-md text-xs"
                      >
                        Editar
                      </button>
                    </div>
                  )}
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

        {/* Cambiar Contraseña */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
          <h2 className="text-xl font-bold mb-4 text-slate-800 dark:text-slate-200">Cambiar Contraseña</h2>
          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label htmlFor="oldPassword" className="block text-sm font-medium text-slate-600 dark:text-slate-400">Contraseña Actual</label>
              <input
                id="oldPassword"
                type="password"
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                disabled={passwordChangeLoading}
              />
            </div>
            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-slate-600 dark:text-slate-400">Nueva Contraseña</label>
              <input
                id="newPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                disabled={passwordChangeLoading}
              />
            </div>
            <div>
              <label htmlFor="confirmNewPassword" className="block text-sm font-medium text-slate-600 dark:text-slate-400">Confirmar Nueva Contraseña</label>
              <input
                id="confirmNewPassword"
                type="password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                disabled={passwordChangeLoading}
              />
            </div>
            <button type="submit" className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed" disabled={passwordChangeLoading}>
              {passwordChangeLoading ? 'Cambiando...' : 'Cambiar Contraseña'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
