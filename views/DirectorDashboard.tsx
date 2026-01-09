import React, { useState, useEffect } from 'react';
import { MockDB, Role, User } from '../types';

interface DirectorDashboardProps {
  db: MockDB;
  refreshDb: () => Promise<void>;
  currentUser: User;
}

interface Metrics {
  totalSales: number;
  netProfit: number;
  numberOfSales: number;
  margin: number;
  isProfitable: boolean;
}

interface ManagerMetrics {
  id: string;
  name: string;
  numberOfSales: number;
  totalSales: number;
  profit: number;
  numberOfGestors: number;
}

interface DashboardData {
  period: string;
  metrics: Metrics;
  salesByDay: { [key: string]: number };
  managers: ManagerMetrics[];
}

const DirectorDashboard: React.FC<DirectorDashboardProps> = ({ db, refreshDb, currentUser }) => {
  const [period, setPeriod] = useState('7days');
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showManagersTab, setShowManagersTab] = useState(false);
  
  const [newManagerName, setNewManagerName] = useState('');
  const [newManagerPassword, setNewManagerPassword] = useState('');
  const [editingManager, setEditingManager] = useState<User | null>(null);
  const [editingManagerName, setEditingManagerName] = useState('');
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordChangeManager, setPasswordChangeManager] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchDashboardMetrics();
  }, [period]);

  const fetchDashboardMetrics = async () => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3001/api/director/metrics?period=${period}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Error fetching metrics');
      }

      const data = await response.json();
      setDashboardData(data);
    } catch (error: any) {
      console.error('Error fetching dashboard metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateManager = async () => {
    if (!newManagerName.trim() || !newManagerPassword.trim()) {
      alert('Por favor, ingrese un nombre de usuario y contraseña para el manager.');
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
          password: newManagerPassword,
          role: 'Manager',
          storeId: currentUser?.storeId
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error creando el manager');
      }

      setNewManagerName('');
      setNewManagerPassword('');
      await refreshDb();
      await fetchDashboardMetrics();
      alert('Manager creado exitosamente.');
    } catch (error: any) {
      console.error('Error creating manager:', error);
      alert(`Error al crear el manager: ${error.message}`);
    }
  };

  const handleUpdateManager = async () => {
    if (!editingManager || !editingManagerName.trim()) {
      alert('Por favor, ingrese un nombre de usuario para el manager.');
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
      await fetchDashboardMetrics();
      alert('Manager actualizado exitosamente.');
    } catch (error: any) {
      console.error('Error updating manager:', error);
      alert(`Error al actualizar el manager: ${error.message}`);
    }
  };

  const handleDeleteManager = async (managerId: string) => {
    const currentUserData = JSON.parse(localStorage.getItem('user') || '{}');
    const currentUserId = currentUserData.id;
    const token = localStorage.getItem('token');

    console.log('[handleDeleteManager] Attempting to delete manager:', { managerId, currentUserId, tokenExists: !!token });

    if (managerId === currentUserId) {
      alert('No puedes eliminar tu propia cuenta de director.');
      return;
    }

    if (!confirm('¿Estás seguro de que deseas eliminar este manager?')) {
      return;
    }

    try {
      const url = `http://localhost:3001/api/users/${managerId}`;
      console.log('[handleDeleteManager] Fetch URL:', url);

      const response = await fetch(url, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('[handleDeleteManager] Response status:', response.status);
      console.log('[handleDeleteManager] Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[handleDeleteManager] Error response:', errorData);
        throw new Error(errorData.message || 'Error eliminando el manager');
      }

      await refreshDb();
      await fetchDashboardMetrics();
      alert('Manager eliminado exitosamente.');
    } catch (error: any) {
      console.error('Error deleting manager:', error);
      alert(`Error al eliminar el manager: ${error.message}`);
    }
  };

  const handleChangePassword = async () => {
    if (!passwordChangeManager || !newPassword.trim()) {
      alert('Por favor, ingrese una nueva contraseña.');
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/users/${passwordChangeManager.id}/password`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          password: newPassword.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error cambiando contraseña');
      }

      setShowPasswordModal(false);
      setPasswordChangeManager(null);
      setNewPassword('');
      alert('Contraseña actualizada exitosamente.');
    } catch (error: any) {
      console.error('Error changing password:', error);
      alert(`Error al cambiar contraseña: ${error.message}`);
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

  const openPasswordModal = (manager: User) => {
    setPasswordChangeManager(manager);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPasswordChangeManager(null);
    setNewPassword('');
  };

  const formatCurrency = (amount: number) => {
    return `$${amount.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getPeriodLabel = () => {
    switch (period) {
      case 'today': return 'Hoy';
      case '7days': return 'Últimos 7 días';
      case '30days': return 'Últimos 30 días';
      default: return 'Últimos 7 días';
    }
  };

  if (loading && !dashboardData) {
    return (
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Panel de Director</h1>
        <p className="text-gray-500">Cargando métricas...</p>
      </div>
    );
  }

  const metrics = dashboardData?.metrics || { totalSales: 0, netProfit: 0, numberOfSales: 0, margin: 0, isProfitable: false };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Panel de Director</h1>

      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">Período:</label>
        <div className="flex gap-2">
          {[
            { value: 'today', label: 'Hoy' },
            { value: '7days', label: '7 días' },
            { value: '30days', label: '30 días' }
          ].map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-4 py-2 rounded ${period === p.value ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-6 p-4 border-2 rounded">
        <h2 className="text-lg font-semibold mb-3">Rentabilidad de la Tienda - {getPeriodLabel()}</h2>
        <p className="mb-4">
          {metrics.isProfitable ? '✅ Rentable' : '❌ No rentable'}
          {metrics.margin > 30 && ' - Margen excelente (> 30%)'}
          {metrics.margin >= 20 && metrics.margin <= 30 && ' - Margen bueno (20-30%)'}
          {metrics.margin < 20 && ' - Margen bajo (< 20%)'}
        </p>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-600">Ventas Totales</div>
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(metrics.totalSales)}</div>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-600">Ganancia</div>
            <div className="text-2xl font-bold text-green-600">{formatCurrency(metrics.netProfit)}</div>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-600">Número de Ventas</div>
            <div className="text-2xl font-bold text-purple-600">{metrics.numberOfSales}</div>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <div className="text-sm text-gray-600">Margen</div>
            <div className={`text-2xl font-bold ${metrics.margin > 20 ? 'text-green-600' : metrics.margin >= 10 ? 'text-yellow-600' : 'text-red-600'}`}>
              {metrics.margin.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Ventas por Día</h2>
          {dashboardData?.salesByDay && Object.keys(dashboardData.salesByDay).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(dashboardData.salesByDay || {}).slice(-7).reverse().map(([date, sales]) => (
                <div key={date} className="flex justify-between">
                  <span className="text-gray-600">{date}</span>
                  <span className="font-semibold">{formatCurrency(typeof sales === 'number' ? sales : 0)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No hay datos de ventas</p>
          )}
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-lg font-semibold mb-4">Ventas por Manager</h2>
          {dashboardData?.managers && dashboardData.managers.length > 0 ? (
            <div className="space-y-2">
              {dashboardData.managers.map(manager => (
                <div key={manager.id} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <span className="font-medium">{manager.name}</span>
                  <span className="font-semibold text-blue-600">{formatCurrency(manager.totalSales)}</span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No hay managers registrados</p>
          )}
        </div>
      </div>

      <div className="mb-6 p-4 border-2 rounded">
        <h2 className="text-lg font-semibold mb-3">Rendimiento de Managers - {getPeriodLabel()}</h2>
        <p className="mb-4">
          Mejor Manager: {dashboardData?.managers?.[0]?.name || 'N/A'}
          {' • '}
          Peor Manager: {dashboardData?.managers?.[dashboardData.managers.length - 1]?.name || 'N/A'}
        </p>

        <div className="bg-white rounded shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-right">Ventas Totales</th>
                <th className="px-4 py-3 text-right">Ganancia</th>
                <th className="px-4 py-3 text-right">Núm. Gestores</th>
              </tr>
            </thead>
            <tbody>
              {dashboardData?.managers?.map(manager => (
                <tr key={manager.id} className="border-t">
                  <td className="px-4 py-3">{manager.name}</td>
                  <td className="px-4 py-3 text-right">{formatCurrency(manager.totalSales)}</td>
                  <td className={`px-4 py-3 text-right font-semibold ${manager.profit > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(manager.profit)}
                  </td>
                  <td className="px-4 py-3 text-right">{manager.numberOfGestors}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex gap-4 mb-6">
        <button
          onClick={() => setShowManagersTab(!showManagersTab)}
          className="px-6 py-3 bg-gray-200 rounded font-medium"
        >
          {showManagersTab ? 'Ocultar' : 'Gestionar'} Managers
        </button>
      </div>

      {showManagersTab && (
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-4">Gestionar Managers</h2>

          <div className="mb-6 p-4 bg-gray-50 rounded">
            <h3 className="font-semibold mb-3">Crear Nuevo Manager</h3>
            <div className="flex gap-4">
              <input
                type="text"
                placeholder="Nombre de usuario"
                value={newManagerName}
                onChange={e => setNewManagerName(e.target.value)}
                className="flex-1 px-3 py-2 border rounded"
              />
              <input
                type="password"
                placeholder="Contraseña"
                value={newManagerPassword}
                onChange={e => setNewManagerPassword(e.target.value)}
                className="flex-1 px-3 py-2 border rounded"
              />
              <button
                onClick={handleCreateManager}
                className="px-6 py-2 bg-blue-500 text-white rounded font-medium"
              >
                Crear Manager
              </button>
            </div>
          </div>

          <div className="bg-white rounded shadow overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left">Nombre</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {db.users
                  .filter(user => user.role === Role.MANAGER && user.storeId === currentUser?.storeId)
                  .map(manager => (
                    <tr key={manager.id} className="border-t">
                      <td className="px-4 py-3">
                        {editingManager?.id === manager.id ? (
                          <input
                            type="text"
                            value={editingManagerName}
                            onChange={e => setEditingManagerName(e.target.value)}
                            className="px-2 py-1 border rounded w-full"
                          />
                        ) : (
                          manager.name
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {editingManager?.id === manager.id ? (
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={handleUpdateManager}
                              className="px-3 py-1 bg-green-500 text-white rounded text-sm"
                            >
                              Guardar
                            </button>
                            <button
                              onClick={cancelEditing}
                              className="px-3 py-1 bg-gray-500 text-white rounded text-sm"
                            >
                              Cancelar
                            </button>
                          </div>
                        ) : (
                          <div className="flex gap-2 justify-center">
                            <button
                              onClick={() => startEditing(manager)}
                              className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => openPasswordModal(manager)}
                              className="px-3 py-1 bg-yellow-500 text-white rounded text-sm"
                            >
                              Contraseña
                            </button>
                            <button
                              onClick={() => handleDeleteManager(manager.id)}
                              className="px-3 py-1 bg-red-500 text-white rounded text-sm"
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
          </div>
        </div>
      )}

      {showPasswordModal && passwordChangeManager && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Cambiar Contraseña - {passwordChangeManager.name}</h2>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Nueva Contraseña:</label>
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border rounded"
                placeholder="Ingrese nueva contraseña"
              />
            </div>
            <div className="flex gap-4">
              <button
                onClick={handleChangePassword}
                className="flex-1 px-6 py-2 bg-blue-500 text-white rounded font-medium"
              >
                Cambiar
              </button>
              <button
                onClick={closePasswordModal}
                className="flex-1 px-6 py-2 bg-gray-300 rounded font-medium"
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

export default DirectorDashboard;
