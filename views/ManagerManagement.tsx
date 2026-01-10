import React, { useState, useEffect } from '"'"'"'react'"'"';
import { MockDB, Role, User } from '"'"''"../types'"'"';

interface ManagerManagementProps {
  db: MockDB;
  refreshDb: () => Promise<void>;
  currentUser: User;
}

const ManagerManagement: React.FC<ManagerManagementProps> = ({ db, refreshDb, currentUser }) => {
  const [newManagerName, setNewManagerName] = useState('"'"''");
  const [newManagerPassword, setNewManagerPassword] = useState('"'"'"');
  const [editingManager, setEditingManager] = useState<User | null>(null);
  const [editingManagerName, setEditingManagerName] = useState('"'"'"');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordChangeManager, setPasswordChangeManager] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('"'"'"');

  const [managers, setManagers] = useState<User[]>([]);

  useEffect(() => {
    if (currentUser?.storeId) {
      const storeManagers = db.users.filter(user =>
        user.role === Role.MANAGER && user.storeId === currentUser.storeId
      );
      setManagers(storeManagers);
    }
  }, [db, currentUser]);

  const handleCreateManager = async () => {
    if (!newManagerName.trim() || !newManagerPassword.trim()) {
      alert('"'"'Por favor, ingrese un nombre de usuario y contraseña para el manager.'"'"');
      return;
    }

    try {
      const response = await fetch('"'"'http://localhost:3001/api/users'"'"', {
        method: '"'"'POST'"'"',
        headers: {
          '"'"'Content-Type'"'"': '"'"'application/json'"'"',
          '"'"'Authorization'"'"': '"'"'Bearer '"'"' + localStorage.getItem('"'"'token'"'"')
        },
        body: JSON.stringify({
          name: newManagerName.trim(),
          password: newManagerPassword,
          role: '"'"'Manager'"'"',
          storeId: currentUser?.storeId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '"'"'Error creando el manager'"'"');
      }

      setNewManagerName('"'"'"');
      setNewManagerPassword('"'"'"');
      await refreshDb();
      alert('"'"'Manager creado exitosamente.'"'"');
    } catch (error: any) {
      console.error('"'"'Error creating manager:'"'"', error);
      alert('"'"'Error al crear el manager: '"'"' + error.message);
    }
  };

  const handleUpdateManager = async () => {
    if (!editingManager || !editingManagerName.trim()) {
      alert('"'"'Por favor, ingrese un nombre de usuario para el manager.'"'"');
      return;
    }

    try {
      const response = await fetch('"'"'http://localhost:3001/api/users/'"'"' + editingManager.id, {
        method: '"'"'PUT'"'"',
        headers: {
          '"'"'Content-Type'"'"': '"'"'application/json'"'"',
          '"'"'Authorization'"'"': '"'"'Bearer '"'"' + localStorage.getItem('"'"'token'"'"')
        },
        body: JSON.stringify({
          name: editingManagerName.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '"'"'Error actualizando el manager.'"'"');
      }

      setEditingManager(null);
      setEditingManagerName('"'"'"');
      await refreshDb();
      alert('"'"'Manager actualizado exitosamente.'"'"');
    } catch (error: any) {
      console.error('"'"'Error updating manager:'"'"', error);
      alert('"'"'Error al actualizar el manager: '"'"' + error.message);
    }
  };

  const handleDeleteManager = async (managerId: string) => {
    const currentUserData = JSON.parse(localStorage.getItem('"'"'user'"'"') || '"'"{}'"'"');
    const currentUserId = currentUserData.id;
    const token = localStorage.getItem('"'"'token'"'"');

    if (managerId === currentUserId) {
      alert('"'"'No puedes eliminar tu propia cuenta de director.'"'"');
      return;
    }

    if (!confirm('"'"'¿Estás seguro de que deseas eliminar este manager?'"'"')) {
      return;
    }

    try {
      const url = '"'"'http://localhost:3001/api/users/'"'"' + managerId;
      const response = await fetch(url, {
        method: '"'"'DELETE'"'"',
        headers: {
          '"'"'Authorization'"'"': '"'"'Bearer '"'"' + token
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '"'"'Error eliminando el manager.'"'"');
      }

      await refreshDb();
      alert('"'"'Manager eliminado exitosamente.'"'"');
    } catch (error: any) {
      console.error('"'"'Error deleting manager:'"'"', error);
      alert('"'"'Error al eliminar el manager: '"'"' + error.message);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordChangeManager || !newPassword.trim()) {
      alert('"'"'Por favor, ingrese una nueva contraseña.'"'"');
      return;
    }

    try {
      const response = await fetch('"'"'http://localhost:3001/api/users/'"'"' + passwordChangeManager.id + '"''"/password'"'"', {
        method: '"'"'PUT'"'"',
        headers: {
          '"'"'Content-Type'"'"': '"'"'application/json'"'"',
          '"'"'Authorization'"'"': '"'"'Bearer '"'"' + localStorage.getItem('"'"'token'"'"')
        },
        body: JSON.stringify({
          password: newPassword.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || '"'"'Error cambiando contraseña.'"'"');
      }

      setShowPasswordModal(false);
      setPasswordChangeManager(null);
      setNewPassword('"'"'"');
      alert('"'"'Contraseña actualizada exitosamente.'"'"');
    } catch (error: any) {
      console.error('"'"'Error changing password:'"'"', error);
      alert('"'"'Error al cambiar contraseña: '"'"' + error.message);
    }
  };

  const startEditing = (manager: User) => {
    setEditingManager(manager);
    setEditingManagerName(manager.name);
  };

  const cancelEditing = () => {
    setEditingManager(null);
    setEditingManagerName('"'"'"');
  };

  const openPasswordModal = (manager: User) => {
    setPasswordChangeManager(manager);
    setNewPassword('"'"'"');
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordChangeManager(null);
    setNewPassword('"'"'"');
  };

  return (
    <div className='"'"'p-8'"'"'>
      <h1 className='"'"'text-2xl font-bold mb-6 text-gray-900 dark:text-white'"'"'>Gestionar Managers</h1>

      <div className='"'"'mb-6 p-4 bg-white dark:bg-gray-800 rounded shadow-lg'"'"'>
        <h2 className='"'"'text-xl font-bold mb-4 text-gray-900 dark:text-white'"'"'>Crear Nuevo Manager</h2>
        <div className='"'"'flex gap-4'"'"'>
          <input
            type='"'"'text'"'"'
            placeholder='"'"'Nombre de usuario'"'"'
            value={newManagerName}
            onChange={e => setNewManagerName(e.target.value)}
            className='"'"'flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded'"'"'
          />
          <input
            type='"'"'password'"'"'
            placeholder='"'"'Contraseña'"'"'
            value={newManagerPassword}
            onChange={e => setNewManagerPassword(e.target.value)}
            className='"'"'flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded'"'"'
          />
          <button
            onClick={handleCreateManager}
            className='"'"'px-6 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded font-medium'"'"'
          >
            Crear Manager
          </button>
        </div>
      </div>

      <div className='"'"'bg-white dark:bg-gray-800 p-6 rounded shadow-lg'"'"'>
        <h2 className='"'"'text-xl font-bold mb-4 text-gray-900 dark:text-white'"'"'>Lista de Managers</h2>
        {managers.length > 0 ? (
          <table className='"'"'w-full'"'"'>
            <thead className='"'"'bg-gray-100 dark:bg-gray-600'"'"'>
              <tr>
                <th className='"'"'px-4 py-3 text-left text-gray-900 dark:text-white'"'"'>Nombre</th>
                <th className='"'"'px-4 py-3 text-center text-gray-900 dark:text-white'"'"'>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {managers.map(manager => (
                <tr key={manager.id} className='"'"'border-t border-gray-200 dark:border-gray-600'"'"'>
                  <td className='"'"'px-4 py-3 text-gray-900 dark:text-white'"'"'>
                    {editingManager?.id === manager.id ? (
                      <input
                        type='"'"'text'"'"'
                        value={editingManagerName}
                        onChange={e => setEditingManagerName(e.target.value)}
                        className='"'"'px-2 py-1 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded w-full'"'"'
                      />
                    ) : (
                      manager.name
                    )}
                  </td>
                  <td className='"'"'px-4 py-3 text-center'"'"'>
                    {editingManager?.id === manager.id ? (
                      <div className='"'"'flex gap-2 justify-center'"'"'>
                        <button
                          onClick={handleUpdateManager}
                          className='"'"'px-3 py-1 bg-green-500 dark:bg-green-600 text-white rounded text-sm'"'"'
                        >
                          Guardar
                        </button>
                        <button
                          onClick={cancelEditing}
                          className='"'"'px-3 py-1 bg-gray-500 dark:bg-gray-600 text-white rounded text-sm'"'"'
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className='"'"'flex gap-2 justify-center'"'"'>
                        <button
                          onClick={() => startEditing(manager)}
                          className='"'"'px-3 py-1 bg-blue-500 dark:bg-blue-600 text-white rounded text-sm'"'"'
                        >
                          Editar
                        </button>
                        <button
                          onClick={() => openPasswordModal(manager)}
                          className='"'"'px-3 py-1 bg-yellow-500 dark:bg-yellow-600 text-white rounded text-sm'"'"'
                        >
                          Contraseña
                        </button>
                        <button
                          onClick={() => handleDeleteManager(manager.id)}
                          className='"'"'px-3 py-1 bg-red-500 dark:bg-red-600 text-white rounded text-sm'"'"'
                        >
                          Eliminar
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <p className='"'"'text-gray-500 dark:text-gray-400 text-center py-8'"'"'>No hay managers registrados</p>
        )}
      </div>

      {showPasswordModal && passwordChangeManager && (
        <div className='"'"'fixed inset-0 bg-black bg-opacity-50 dark:bg-opacity-70 flex items-center justify-center z-50'"'"'>
          <div className='"'"'bg-white dark:bg-gray-800 p-6 rounded shadow-lg max-w-md w-full'"'"'>
            <h2 className='"'"'text-xl font-bold mb-4 text-gray-900 dark:text-white'"'"'>Cambiar Contraseña - {passwordChangeManager.name}</h2>
            <div className='"'"'mb-4'"'"'>
              <label className='"'"'block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2'"'"'>Nueva Contraseña:</label>
              <input
                type='"'"'password'"'"'
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className='"'"'w-full px-3 py-2 border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded'"'"'
                placeholder='"'"'Ingrese nueva contraseña'"'"'
              />
            </div>
            <div className='"'"'flex gap-4'"'"'>
              <button
                onClick={handleChangePassword}
                className='"'"'flex-1 px-6 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded font-medium'"'"'
              >
                Cambiar
              </button>
              <button
                onClick={closePasswordModal}
                className='"'"'flex-1 px-6 py-2 bg-gray-300 dark:bg-gray-600 text-gray-900 dark:text-white rounded font-medium'"'"'
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerManagement;
