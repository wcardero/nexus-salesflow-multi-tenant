import React, { useState } from 'react';
import { MockDB, Store } from '../types';
import Button from '../components/Button';

interface StoreManagementProps {
  db: MockDB;
  refreshDb: () => Promise<void>;
}

const StoreManagement: React.FC<StoreManagementProps> = ({ db, refreshDb }) => {
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [newStoreName, setNewStoreName] = useState('');
  const [editingStoreName, setEditingStoreName] = useState('');

  const handleCreateStore = async () => {
    if (!newStoreName.trim()) {
      alert('Por favor, ingrese un nombre para la tienda.');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/stores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: newStoreName.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error creando la tienda');
      }

      const newStore = await response.json();
      setNewStoreName('');
      await refreshDb();
      alert(`Tienda "${newStore.name}" creada exitosamente.`);
    } catch (error: any) {
      console.error('Error creating store:', error);
      alert(`Error al crear la tienda: ${error.message}`);
    }
  };

  const handleUpdateStore = async () => {
    if (!editingStore || !editingStoreName.trim()) {
      alert('Por favor, ingrese un nombre para la tienda.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/stores/${editingStore.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          ...editingStore,
          name: editingStoreName.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error actualizando la tienda');
      }

      await refreshDb();
      setEditingStore(null);
      setEditingStoreName('');
      alert('Tienda actualizada exitosamente.');
    } catch (error: any) {
      console.error('Error updating store:', error);
      alert(`Error al actualizar la tienda: ${error.message}`);
    }
  };

  const handleDeleteStore = async (storeId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar esta tienda?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/stores/${storeId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error eliminando la tienda');
      }

      await refreshDb();
      alert('Tienda eliminada exitosamente.');
    } catch (error: any) {
      console.error('Error deleting store:', error);
      alert(`Error al eliminar la tienda: ${error.message}`);
    }
  };

  const startEditing = (store: Store) => {
    setEditingStore(store);
    setEditingStoreName(store.name);
  };

  const cancelEditing = () => {
    setEditingStore(null);
    setEditingStoreName('');
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8 p-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-gray-800 dark:text-gray-200 text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
          Gestión de Tiendas
        </h1>
        <p className="text-gray-600 dark:text-gray-400 text-base font-normal leading-normal">
          Administre las tiendas del sistema: cree nuevas, edite o elimine existentes.
        </p>
      </div>

      {/* Create Store Section */}
      <div className="flex flex-col gap-6 p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
        <div className="flex flex-col gap-1">
          <h3 className="text-gray-800 dark:text-gray-200 text-xl font-bold leading-tight">Crear Nueva Tienda</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-normal">Agregue una nueva tienda al sistema.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <input 
            type="text" 
            placeholder="Nombre de la tienda" 
            value={newStoreName} 
            onChange={e => setNewStoreName(e.target.value)} 
            className="flex-1 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm"
          />
          <Button variant="primary" onClick={handleCreateStore} size="md">
            Crear Tienda
          </Button>
        </div>
      </div>

      {/* Edit Store Section (if editing) */}
      {editingStore && (
        <div className="flex flex-col gap-6 p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <div className="flex flex-col gap-1">
            <h3 className="text-gray-800 dark:text-gray-200 text-xl font-bold leading-tight">Editar Tienda</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm font-normal">Modifique la información de la tienda.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <input 
              type="text" 
              placeholder="Nombre de la tienda" 
              value={editingStoreName} 
              onChange={e => setEditingStoreName(e.target.value)} 
              className="flex-1 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm"
            />
            <div className="flex gap-2">
              <Button variant="primary" onClick={handleUpdateStore} size="md">
                Guardar Cambios
              </Button>
              <Button variant="neutral" onClick={cancelEditing} size="md">
                Cancelar
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Stores List */}
      <div className="flex flex-col gap-4 p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center">
          <h3 className="text-gray-800 dark:text-gray-200 text-xl font-bold leading-tight">Tiendas Existentes</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-normal">{db.stores.length} tiendas</p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="text-xs text-gray-600 dark:text-gray-400 uppercase bg-gray-100 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 rounded-l-lg" scope="col">Nombre</th>
                <th className="px-4 py-3" scope="col">Directores</th>
                <th className="px-4 py-3" scope="col">Managers</th>
                <th className="px-4 py-3 rounded-r-lg" scope="col">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
              {db.stores.map(store => {
                const director = db.users.find(u => u.id === store.directorId);
                const managers = db.users.filter(u => store.managerIds?.includes(u.id));
                return (
                  <tr key={store.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">{store.name}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{director?.name || 'Sin director'}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{managers.length} managers</td>
                    <td className="px-4 py-3 flex gap-2">
                      <button 
                        onClick={() => startEditing(store)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleDeleteStore(store.id)}
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
    </div>
  );
};

export default StoreManagement;