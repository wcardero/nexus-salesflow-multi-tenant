import React, { useState } from 'react';
import { MockDB, User, Role } from '../types';

interface UserManagementProps {
  db: MockDB;
  refreshDb: () => Promise<void>;
}

const UserManagement: React.FC<UserManagementProps> = ({ db, refreshDb }) => {
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editingUserName, setEditingUserName] = useState('');
  const [editingUserRole, setEditingUserRole] = useState<Role>(Role.MANAGER);
  const [editingUserStoreId, setEditingUserStoreId] = useState('');
  const [newUser, setNewUser] = useState({
    name: '',
    role: Role.MANAGER as Role,
    storeId: '',
    password: ''
  });
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordChangeUser, setPasswordChangeUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const handleCreateUser = async () => {
    if (!newUser.name.trim() || !newUser.password.trim()) {
      alert('Por favor, complete todos los campos obligatorios.');
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
          name: newUser.name.trim(),
          role: newUser.role,
          storeId: newUser.storeId || null,
          password: newUser.password
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error creando el usuario');
      }

      const createdUser = await response.json();
      setNewUser({
        name: '',
        role: Role.MANAGER,
        storeId: '',
        password: ''
      });
      await refreshDb();
      alert(`Usuario "${createdUser.name}" creado exitosamente.`);
    } catch (error: any) {
      console.error('Error creating user:', error);
      alert(`Error al crear el usuario: ${error.message}`);
    }
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !editingUserName.trim()) {
      alert('Por favor, complete todos los campos obligatorios.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...editingUser,
          name: editingUserName.trim(),
          role: editingUserRole,
          storeId: editingUserStoreId || null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error actualizando el usuario');
      }

      await refreshDb();
      setEditingUser(null);
      setEditingUserName('');
      alert('Usuario actualizado exitosamente.');
    } catch (error: any) {
      console.error('Error updating user:', error);
      alert(`Error al actualizar el usuario: ${error.message}`);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    // Prevent admin from deleting their own account
    let currentUserData;
    try {
      currentUserData = JSON.parse(localStorage.getItem('user') || '{}');
    } catch (e) {
      console.error('Error parsing current user data:', e);
      currentUserData = {};
    }

    if (userId === currentUserData.id) {
      alert('No puedes eliminar tu propia cuenta de administrador.');
      return;
    }

    if (!confirm('¿Estás seguro de que deseas eliminar este usuario?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Delete user error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      await refreshDb();
      alert('Usuario eliminado exitosamente.');
    } catch (error: any) {
      console.error('Error deleting user:', error);
      alert(`Error al eliminar el usuario: ${error.message}`);
    }
  };

  const startEditing = (user: User) => {
    setEditingUser(user);
    setEditingUserName(user.name);
    setEditingUserRole(user.role);
    setEditingUserStoreId(user.storeId || '');
  };

  const cancelEditing = () => {
    setEditingUser(null);
    setEditingUserName('');
  };

  const openPasswordChangeModal = (user: User) => {
    setPasswordChangeUser(user);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordChangeUser(null);
    setNewPassword('');
  };

  const handleChangePassword = async () => {
    if (!passwordChangeUser || !newPassword.trim()) {
      alert('Por favor, ingrese una nueva contraseña.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/users/${passwordChangeUser.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          password: newPassword
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Password change error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      closePasswordModal();
      await refreshDb();
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
          Gestión de Usuarios
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-base font-normal leading-normal">
          Administre los usuarios del sistema: cree nuevos, edite o elimine existentes, y cambie contraseñas.
        </p>
      </div>

      {/* Create User Section */}
      <div className="flex flex-col gap-6 p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex flex-col gap-1">
          <h3 className="text-gray-800 dark:text-gray-200 text-xl font-bold leading-tight">Crear Nuevo Usuario</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-normal">Agregue un nuevo usuario al sistema.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Nombre</label>
            <input 
              type="text" 
              placeholder="Nombre del usuario" 
              value={newUser.name} 
              onChange={e => setNewUser({...newUser, name: e.target.value})} 
              className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Rol</label>
            <select
              value={newUser.role}
              onChange={e => setNewUser({...newUser, role: e.target.value as Role})}
              className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm"
            >
              <option value={Role.DIRECTOR}>Director</option>
              <option value={Role.MANAGER}>Manager</option>
              <option value={Role.GESTOR}>Gestor</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Tienda</label>
            <select
              value={newUser.storeId}
              onChange={e => setNewUser({...newUser, storeId: e.target.value})}
              className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm"
            >
              <option value="">Sin tienda</option>
              {db.stores.map(store => (
                <option key={store.id} value={store.id}>{store.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Contraseña</label>
            <input 
              type="password" 
              placeholder="Contraseña" 
              value={newUser.password} 
              onChange={e => setNewUser({...newUser, password: e.target.value})} 
              className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm"
            />
          </div>
        </div>
        <div className="flex justify-end">
          <button 
            onClick={handleCreateUser} 
            className="bg-primary text-white rounded-md py-2 px-4 text-sm font-bold hover:bg-blue-600 transition-colors"
          >
            Crear Usuario
          </button>
        </div>
      </div>

      {/* Edit User Section (if editing) */}
      {editingUser && (
        <div className="flex flex-col gap-6 p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <div className="flex flex-col gap-1">
            <h3 className="text-gray-800 dark:text-gray-200 text-xl font-bold leading-tight">Editar Usuario</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm font-normal">Modifique la información del usuario.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Nombre</label>
              <input 
                type="text" 
                placeholder="Nombre del usuario" 
                value={editingUserName} 
                onChange={e => setEditingUserName(e.target.value)} 
                className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Rol</label>
              <select
                value={editingUserRole}
                onChange={e => setEditingUserRole(e.target.value as Role)}
                className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm"
              >
                <option value={Role.DIRECTOR}>Director</option>
                <option value={Role.MANAGER}>Manager</option>
                <option value={Role.GESTOR}>Gestor</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Tienda</label>
              <select
                value={editingUserStoreId}
                onChange={e => setEditingUserStoreId(e.target.value)}
                className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm"
              >
                <option value="">Sin tienda</option>
                {db.stores.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button 
              onClick={handleUpdateUser} 
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
      )}

      {/* Users List */}
      <div className="flex flex-col gap-4 p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center">
          <h3 className="text-gray-800 dark:text-gray-200 text-xl font-bold leading-tight">Usuarios Existentes</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-normal">{db.users.length} usuarios</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-600 dark:text-gray-400 uppercase bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 rounded-l-lg" scope="col">Nombre</th>
                <th className="px-4 py-3" scope="col">Rol</th>
                <th className="px-4 py-3" scope="col">Tienda</th>
                <th className="px-4 py-3 rounded-r-lg" scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {db.users.map(user => {
                const store = db.stores.find(s => s.id === user.storeId);
                return (
                  <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{user.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{user.role}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{store?.name || 'N/A'}</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button 
                        onClick={() => startEditing(user)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => openPasswordChangeModal(user)}
                        className="text-green-600 hover:text-green-800 font-medium text-sm"
                      >
                        Cambiar Contraseña
                      </button>
                      <button 
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-800 font-medium text-sm"
                      >
                        Eliminar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Change Password Modal */}
      {showPasswordModal && passwordChangeUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">
              Cambiar Contraseña - {passwordChangeUser.name}
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

export default UserManagement;