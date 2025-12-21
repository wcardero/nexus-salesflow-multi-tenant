import React, { useState } from 'react';
import { MockDB, Role } from '../types';

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
}> = ({ icon, label, value, change, changeType = 'stable', iconColor = 'text-primary' }) => (
  <div className="flex flex-col gap-2 rounded-xl p-6 border border-[#dbe0e6] dark:border-gray-700 bg-white dark:bg-[#1a2632] shadow-sm">
    <div className="flex items-center justify-between">
      <p className="text-[#617589] dark:text-gray-400 text-sm font-medium">{label}</p>
      <span className={`material-symbols-outlined p-1.5 rounded-lg ${iconColor}`}>{icon}</span>
    </div>
    <p className="text-[#111418] dark:text-white tracking-light text-2xl font-bold leading-tight">{value}</p>
    {change && (
      <div className="flex items-center gap-1 text-sm">
        <span
          className={`font-medium flex items-center ${
            changeType === 'positive' ? 'text-[#078838]' : changeType === 'negative' ? 'text-red-600' : 'text-[#617589]'
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
  const [selectedStoreId, setSelectedStoreId] = useState<string>(db.stores[0]?.id || '');
  
  const handleCreateStore = async () => {
    // Logic from the old component
    alert(`Creando tienda: ${newStoreName}`);
    await refreshDb();
  };
  
  const handleCreateManager = async () => {
    // Logic from the old component
    alert(`Creando manager: ${newManagerName} para la tienda ${selectedStoreId}`);
    await refreshDb();
  };

  const totalStores = db.stores.length;
  const totalManagers = db.users.filter(u => u.role === Role.MANAGER).length;

  return (
    <div className="max-w-5xl mx-auto flex flex-col gap-8">
      {/* Page Heading */}
      <div className="flex flex-wrap justify-between items-end gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-gray-800 dark:text-gray-200 text-3xl md:text-4xl font-black leading-tight tracking-[-0.033em]">
            Resumen del Sistema
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-base font-normal leading-normal">
            Bienvenido de nuevo. Aquí están las métricas de rendimiento de su sistema.
          </p>
        </div>
        <div className="flex gap-2">
          <button className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <span className="material-symbols-outlined text-[20px]">calendar_today</span>
            <span>Este Mes</span>
          </button>
          <button className="flex items-center gap-2 bg-primary text-white rounded-lg px-4 py-2 text-sm font-bold shadow-md hover:bg-blue-600 transition-colors">
            <span className="material-symbols-outlined text-[20px]">download</span>
            <span>Exportar Reporte</span>
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="storefront" label="Tiendas Totales" value={totalStores} change="+5% vs el mes pasado" changeType="positive" />
        <StatCard icon="badge" label="Managers Activos" value={totalManagers} change="Estable" changeType="stable" />
        <StatCard icon="payments" label="Ventas Consolidadas" value="$124,500" change="+12% vs el mes pasado" changeType="positive" />
        <StatCard icon="pending_actions" label="Cierres Pendientes" value="3" change="Acción Requerida" changeType="stable" iconColor="text-orange-500 bg-orange-50 dark:bg-orange-900/20" />
      </div>

      {/* Split Section: Quick Actions & Top Performers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <div className="flex flex-col gap-6 p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
          <div className="flex flex-col gap-1">
            <h3 className="text-gray-800 dark:text-gray-200 text-xl font-bold leading-tight">Acciones Rápidas</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm font-normal">Administre su jerarquía e inventario de manera eficiente.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
             {/* Add Store */}
             <div className="flex flex-col items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h4 className="text-gray-800 dark:text-gray-200 text-sm font-bold">Añadir Nueva Tienda</h4>
                <input type="text" placeholder="Nombre de la tienda" value={newStoreName} onChange={e => setNewStoreName(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm"/>
                <button onClick={handleCreateStore} className="w-full bg-primary text-white rounded-md py-2 text-sm font-bold hover:bg-blue-600 transition-colors">Añadir Tienda</button>
             </div>
             {/* Create Manager */}
             <div className="flex flex-col items-start gap-3 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
                <h4 className="text-gray-800 dark:text-gray-200 text-sm font-bold">Crear Manager</h4>
                <input type="text" placeholder="Nombre del Manager" value={newManagerName} onChange={e => setNewManagerName(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm"/>
                <select value={selectedStoreId} onChange={e => setSelectedStoreId(e.target.value)} className="w-full bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded-md py-2 px-3 text-sm">
                  {db.stores.map(store => <option key={store.id} value={store.id}>{store.name}</option>)}
                </select>
                <button onClick={handleCreateManager} className="w-full bg-primary text-white rounded-md py-2 text-sm font-bold hover:bg-blue-600 transition-colors">Crear Manager</button>
             </div>
          </div>
        </div>

        {/* Top Performing Stores Table */}
        <div className="flex flex-col gap-4 p-6 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
          <div className="flex justify-between items-center">
            <h3 className="text-gray-800 dark:text-gray-200 text-xl font-bold leading-tight">Tiendas con Mejor Desempeño</h3>
            <a className="text-sm text-primary font-medium hover:underline" href="#">Ver Todas</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-600 dark:text-gray-400 uppercase bg-gray-100 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg" scope="col">Nombre de la Tienda</th>
                  <th className="px-4 py-3" scope="col">Manager</th>
                  <th className="px-4 py-3 text-right rounded-r-lg" scope="col">Ventas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">Downtown Flagship</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Sarah Jenkins</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800 dark:text-gray-200">$45,200</td>
                </tr>
                <tr className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-800 dark:text-gray-200">North Hills Mall</td>
                  <td className="px-4 py-3 text-gray-600 dark:text-gray-400">Michael Chen</td>
                  <td className="px-4 py-3 text-right font-bold text-gray-800 dark:text-gray-200">$38,150</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
