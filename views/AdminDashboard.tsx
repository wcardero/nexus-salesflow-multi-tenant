import React, { useState } from 'react';
import { MockDB, Role, User } from '../types';

interface AdminDashboardProps {
  db: MockDB;
  refreshDb: () => Promise<void>;
}

const StatCard: React.FC<{
  icon: string;
  label: string;
  value: string | number;
  change?: string;
  changeType?: 'positive' | 'negative' | 'stable';
  iconColor?: string;
}> = ({ icon, label, value, change, changeType = 'stable', iconColor = 'text-primary-600' }) => (
  <div className="flex flex-col gap-2 rounded-xl p-6 border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shadow-sm">
    <div className="flex items-center justify-between">
      <p className="text-slate-700 dark:text-slate-400 text-sm font-medium">{label}</p>
      <span className={`material-symbols-outlined p-1.5 rounded-lg ${iconColor}`}>{icon}</span>
    </div>
    <p className="text-slate-800 dark:text-slate-200 tracking-light text-2xl font-bold leading-tight">{value}</p>
    {change && (
      <div className="flex items-center gap-1 text-sm">
        <span
          className={`font-medium flex items-center ${
            changeType === 'positive' ? 'text-success-600' : changeType === 'negative' ? 'text-danger-600' : 'text-slate-600'
          }`}
        >
          {changeType !== 'stable' && (
            <span className="material-symbols-outlined text-sm">
              {changeType === 'positive' ? 'trending_up' : 'trending_down'}
            </span>
          )}
          {change}
        </span>
      </div>
    )}
  </div>
);

const AdminDashboard: React.FC<AdminDashboardProps> = ({ db, refreshDb }) => {
  const [newStoreName, setNewStoreName] = useState('');
  const [newManagerName, setNewManagerName] = useState('');
  const [newDirectorName, setNewDirectorName] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState<string>(db.stores[0]?.id || '');
  
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

  const handleCreateManager = async () => {
    if (!newManagerName.trim()) {
      alert('Por favor, ingrese un nombre para el manager.');
      return;
    }

    try {
      // First, create the user
      const userResponse = await fetch('http://localhost:3001/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: newManagerName.trim(),
          role: Role.MANAGER,
          storeId: selectedStoreId
        })
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(errorData.message || 'Error creando el manager');
      }

      const newUser = await userResponse.json();

      // Then update the store to add the manager to its managerIds
      const store = db.stores.find(s => s.id === selectedStoreId);
      if (store) {
        const updatedManagerIds = [...(store.managerIds || []), newUser.id];

        const updateStoreResponse = await fetch(`http://localhost:3001/api/stores/${selectedStoreId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            ...store,
            managerIds: updatedManagerIds
          })
        });

        if (!updateStoreResponse.ok) {
          const errorData = await updateStoreResponse.json();
          console.error('Error updating store with new manager:', errorData);
          // Continue anyway since the user was created
        }
      }

      setNewManagerName('');
      await refreshDb();
      alert(`Manager "${newUser.name}" creado exitosamente.`);
    } catch (error: any) {
      console.error('Error creating manager:', error);
      alert(`Error al crear el manager: ${error.message}`);
    }
  };

  const handleCreateDirector = async () => {
    if (!newDirectorName.trim()) {
      alert('Por favor, ingrese un nombre para el director.');
      return;
    }

    try {
      // First, create the user
      const userResponse = await fetch('http://localhost:3001/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: newDirectorName.trim(),
          role: Role.DIRECTOR,
          storeId: selectedStoreId
        })
      });

      if (!userResponse.ok) {
        const errorData = await userResponse.json();
        throw new Error(errorData.message || 'Error creando el director');
      }

      const newUser = await userResponse.json();

      // Then update the store to assign this user as the director
      const store = db.stores.find(s => s.id === selectedStoreId);
      if (store) {
        const updateStoreResponse = await fetch(`http://localhost:3001/api/stores/${selectedStoreId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            ...store,
            directorId: newUser.id
          })
        });

        if (!updateStoreResponse.ok) {
          const errorData = await updateStoreResponse.json();
          console.error('Error updating store with new director:', errorData);
          // Continue anyway since the user was created
        }
      }

      setNewDirectorName('');
      await refreshDb();
      alert(`Director "${newUser.name}" creado exitosamente.`);
    } catch (error: any) {
      console.error('Error creating director:', error);
      alert(`Error al crear el director: ${error.message}`);
    }
  };


  const totalStores = db.stores.length;
  const totalManagers = db.users.filter(u => u.role === Role.MANAGER).length;
  const totalDirectors = db.users.filter(u => u.role === Role.DIRECTOR).length;

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      {/* Page Heading */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-slate-800 dark:text-slate-200 text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
            Resumen del Sistema
          </h1>
          <p className="text-slate-600 dark:text-slate-400 text-base font-normal leading-normal">
            Bienvenido de nuevo. Aquí están las métricas de rendimiento de su sistema.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
            <span className="material-symbols-outlined text-[20px]">calendar_today</span>
            <span>Este Mes</span>
          </button>
          <button className="flex items-center gap-2 bg-primary-600 text-white rounded-lg px-4 py-2 text-sm font-bold shadow-md hover:bg-primary-700 transition-colors hover:shadow-lg">
            <span className="material-symbols-outlined text-[20px]">download</span>
            <span>Exportar Reporte</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="storefront" label="Tiendas Totales" value={totalStores} change="+5% vs el mes pasado" changeType="positive" />
        <StatCard icon="badge" label="Directores Activos" value={totalDirectors} change="Estable" changeType="stable" />
        <StatCard icon="badge" label="Managers Activos" value={totalManagers} change="Estable" changeType="stable" />
      </div>

      {/* Split Section: Quick Actions & Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="flex flex-col gap-6 p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shadow-sm">
          <div className="flex flex-col gap-1">
            <h3 className="text-slate-800 dark:text-slate-200 text-xl font-bold leading-tight">Acciones Rápidas</h3>
            <p className="text-slate-600 dark:text-slate-400 text-sm font-normal">Administre su jerarquía e inventario de manera eficiente.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             {/* Add Store */}
             <div className="flex flex-col items-start gap-3 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                <h4 className="text-slate-800 dark:text-slate-200 text-sm font-bold">Añadir Nueva Tienda</h4>
                <input type="text" placeholder="Nombre de la tienda" value={newStoreName} onChange={e => setNewStoreName(e.target.value)} className="w-full bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-sm"/>
                <button onClick={handleCreateStore} className="w-full bg-primary-600 text-white rounded-md py-2 text-sm font-bold hover:bg-primary-700 transition-colors">Añadir Tienda</button>
             </div>
             {/* Create Director */}
             <div className="flex flex-col items-start gap-3 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                <h4 className="text-slate-800 dark:text-slate-200 text-sm font-bold">Crear Director</h4>
                <input type="text" placeholder="Nombre del Director" value={newDirectorName} onChange={e => setNewDirectorName(e.target.value)} className="w-full bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-sm"/>
                <select value={selectedStoreId} onChange={e => setSelectedStoreId(e.target.value)} className="w-full bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-sm">
                  {db.stores.map(store => <option key={store.id} value={store.id}>{store.name}</option>)}
                </select>
                <button onClick={handleCreateDirector} className="w-full bg-primary-600 text-white rounded-md py-2 text-sm font-bold hover:bg-primary-700 transition-colors">Crear Director</button>
             </div>
             {/* Create Manager */}
             <div className="flex flex-col items-start gap-3 rounded-lg border border-slate-200 dark:border-slate-700 p-4">
                <h4 className="text-slate-800 dark:text-slate-200 text-sm font-bold">Crear Manager</h4>
                <input type="text" placeholder="Nombre del Manager" value={newManagerName} onChange={e => setNewManagerName(e.target.value)} className="w-full bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-sm"/>
                <select value={selectedStoreId} onChange={e => setSelectedStoreId(e.target.value)} className="w-full bg-slate-200 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md py-2 px-3 text-sm">
                  {db.stores.map(store => <option key={store.id} value={store.id}>{store.name}</option>)}
                </select>
                <button onClick={handleCreateManager} className="w-full bg-primary-600 text-white rounded-md py-2 text-sm font-bold hover:bg-primary-700 transition-colors">Crear Manager</button>
             </div>
          </div>
        </div>

        {/* Top Performing Stores Table */}
        <div className="flex flex-col gap-4 p-6 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center">
            <h3 className="text-slate-800 dark:text-slate-200 text-xl font-bold leading-tight">Tiendas y Directores</h3>
            <a className="text-sm text-primary-600 dark:text-primary-400 font-medium hover:underline" href="#">Ver Todas</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-600 dark:text-slate-400 uppercase bg-slate-100 dark:bg-slate-700">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg" scope="col">Nombre de la Tienda</th>
                  <th className="px-4 py-3" scope="col">Director</th>
                  <th className="px-4 py-3 text-right rounded-r-lg" scope="col">Managers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {db.stores.map(store => {
                  const director = db.users.find(u => u.id === store.directorId);
                  const managers = db.users.filter(u => store.managerIds?.includes(u.id));
                  return (
                    <tr key={store.id} className="hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800 dark:text-slate-200">{store.name}</td>
                      <td className="px-4 py-3 text-slate-600 dark:text-slate-400">{director?.name || 'N/A'}</td>
                      <td className="px-4 py-3 text-right font-bold text-slate-800 dark:text-slate-200">{managers.length}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

    </div>
  );
};

export default AdminDashboard;
