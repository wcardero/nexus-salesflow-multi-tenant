import React, { useState } from 'react';
import { MockDB, Role, User } from '../types';

interface DirectorDashboardProps {
  db: MockDB;
  refreshDb: () => Promise<void>;
}

const DirectorDashboard: React.FC<DirectorDashboardProps> = ({ db, refreshDb }) => {
  const [newManagerName, setNewManagerName] = useState('');
  const [newManagerPassword, setNewManagerPassword] = useState('');
  const [editingManager, setEditingManager] = useState<User | null>(null);
  const [editingManagerName, setEditingManagerName] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordChangeManager, setPasswordChangeManager] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  // Get the director's store
  const directorStore = db.stores.find(store =>
    db.users.some(user => user.id === store.directorId)
  );

  // Get managers for the director's store
  const storeManagers = directorStore
    ? db.users.filter(user =>
        user.role === Role.MANAGER &&
        user.storeId === directorStore.id
      )
    : [];

  const handleCreateManager = async () => {
    if (!newManagerName.trim() || !newManagerPassword.trim()) {
      alert('Por favor, ingrese un nombre y contraseña para el manager.');
      return;
    }

    if (!directorStore) {
      alert('No se encontró la tienda del director.');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: newManagerName.trim(),
          role: Role.MANAGER,
          storeId: directorStore.id,
          password: newManagerPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error creando el manager');
      }

      const newManager = await response.json();
      setNewManagerName('');
      setNewManagerPassword('');
      await refreshDb();
      alert(`Manager "${newManager.name}" creado exitosamente.`);
    } catch (error: any) {
      console.error('Error creating manager:', error);
      alert(`Error al crear el manager: ${error.message}`);
    }
  };

  const handleUpdateManager = async () => {
    if (!editingManager || !editingManagerName.trim()) {
      alert('Por favor, ingrese un nombre para el manager.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/users/${editingManager.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...editingManager,
          name: editingManagerName.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error actualizando el manager');
      }

      setEditingManager(null);
      setEditingManagerName('');
      await refreshDb();
      alert('Manager actualizado exitosamente.');
    } catch (error: any) {
      console.error('Error updating manager:', error);
      alert(`Error al actualizar el manager: ${error.message}`);
    }
  };

  const handleDeleteManager = async (managerId: string) => {
    // Prevent director from deleting their own account
    const currentUserId = JSON.parse(localStorage.getItem('user') || '{}').id;
    if (managerId === currentUserId) {
      alert('No puedes eliminar tu propia cuenta de director.');
      return;
    }

    if (!confirm('¿Estás seguro de que deseas eliminar este manager?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/users/${managerId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error eliminando el manager');
      }

      await refreshDb();
      alert('Manager eliminado exitosamente.');
    } catch (error: any) {
      console.error('Error deleting manager:', error);
      alert(`Error al eliminar el manager: ${error.message}`);
    }
  };

  const startEditing = (manager: User) => {
    setEditingManager(manager);
    setEditingManagerName(manager.name);
  };

  const cancelEditing = () => {
    setEditingManager(null);
    setEditingManagerName('');
  };

  const openPasswordChangeModal = (manager: User) => {
    setPasswordChangeManager(manager);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordChangeManager(null);
    setNewPassword('');
  };

  const handleChangePassword = async () => {
    if (!passwordChangeManager || !newPassword.trim()) {
      alert('Por favor, ingrese una nueva contraseña.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/users/${passwordChangeManager.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: passwordChangeManager.name,
          role: passwordChangeManager.role,
          storeId: passwordChangeManager.storeId,
          password: newPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error actualizando la contraseña');
      }

      closePasswordModal();
      alert('Contraseña actualizada exitosamente.');
    } catch (error: any) {
      console.error('Error changing password:', error);
      alert(`Error al actualizar la contraseña: ${error.message}`);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-gray-800 dark:text-gray-200 text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
          Panel de Director
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-base font-normal leading-normal">
          Gestione los managers de su tienda.
        </p>
      </div>

      {/* Create Manager Section */}
      <div className="flex flex-col gap-6 p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex flex-col gap-1">
          <h3 className="text-gray-800 dark:text-gray-200 text-xl font-bold leading-tight">Crear Nuevo Manager</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-normal">Agregue un nuevo manager a su tienda.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Nombre</label>
            <input 
              type="text" 
              placeholder="Nombre del manager" 
              value={newManagerName} 
              onChange={e => setNewManagerName(e.target.value)} 
              className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Contraseña</label>
            <input 
              type="password" 
              placeholder="Contraseña" 
              value={newManagerPassword} 
              onChange={e => setNewManagerPassword(e.target.value)} 
              className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button 
            onClick={handleCreateManager} 
            className="bg-primary text-white rounded-md py-2 px-4 text-sm font-bold hover:bg-blue-600 transition-colors"
          >
            Crear Manager
          </button>
        </div>
      </div>

      {/* Edit Manager Section (if editing) */}
      {editingManager && (
        <div className="flex flex-col gap-6 p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <div className="flex flex-col gap-1">
            <h3 className="text-gray-800 dark:text-gray-200 text-xl font-bold leading-tight">Editar Manager</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm font-normal">Modifique la información del manager.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text" 
              placeholder="Nombre del manager" 
              value={editingManagerName} 
              onChange={e => setEditingManagerName(e.target.value)} 
              className="flex-1 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm"
            />
            <div className="flex gap-2">
              <button 
                onClick={handleUpdateManager} 
                className="bg-primary text-white rounded-md py-2 px-4 text-sm font-bold hover:bg-blue-600 transition-colors"
              >
                Guardar Cambios
              </button>
              <button 
                onClick={cancelEditing} 
                className="bg-gray-500 text-white rounded-md py-2 px-4 text-sm font-bold hover:bg-gray-600 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Managers List */}
      <div className="flex flex-col gap-4 p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center">
          <h3 className="text-gray-800 dark:text-gray-200 text-xl font-bold leading-tight">Managers de la Tienda</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-normal">{storeManagers.length} managers</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-600 dark:text-gray-400 uppercase bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 rounded-l-lg" scope="col">Nombre</th>
                <th className="px-4 py-3 rounded-r-lg" scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {storeManagers.map(manager => (
                <tr key={manager.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{manager.name}</td>
                  <td className="px-4 py-3 flex gap-2">
                    <button
                      onClick={() => startEditing(manager)}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => openPasswordChangeModal(manager)}
                      className="text-green-600 hover:text-green-800 font-medium text-sm"
                    >
                      Cambiar Contraseña
                    </button>
                    <button
                      onClick={() => handleDeleteManager(manager.id)}
                      className="text-red-600 hover:text-red-800 font-medium text-sm"
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && passwordChangeManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">
              Cambiar Contraseña - {passwordChangeManager.name}
            </h3>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                Nueva Contraseña
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm"
                placeholder="Ingrese nueva contraseña"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={closePasswordModal}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
              >
                Cancelar
              </button>
              <button
                onClick={handleChangePassword}
                className="px-4 py-2 text-sm font-medium text-white bg-primary hover:bg-blue-600 rounded-md"
              >
                Guardar Contraseña
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DirectorDashboard;