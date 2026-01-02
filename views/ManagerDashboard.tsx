// views/ManagerDashboard.tsx
import React, { useState, Pick, useEffect } from 'react';
import { User, Store, MockDB, Role, Product, InventoryItem, Closing, ClosingStatus } from '../types';
import { formatCurrency, getCurrentExchangeRate, calculateProductPrices } from '../utils';

interface ManagerDashboardProps {
  user: User;
  store: Store;
  db: MockDB;
  setDb: React.Dispatch<React.SetStateAction<MockDB | null>>;
  refreshDb: () => Promise<void>;
}

type Tabs = 'closings' | 'inventory' | 'products' | 'gestores' | 'rate' | 'reports' | 'stock' | 'audit';

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ user, store, db, setDb, refreshDb }) => {
  const [activeTab, setActiveTab] = useState<Tabs>('closings');

  useEffect(() => {
    refreshDb();
  }, [activeTab]);

  // Handlers
  const handleValidateClosing = async (closingId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/closings/${closingId}/complete`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        await refreshDb();
        alert('Cierre validado exitosamente.');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error: any) {
      console.error('Error completing closing:', error);
      alert('Error al completar el cierre.');
    }
  };

  const handleSetExchangeRate = async (newRate: number, startDate: Date) => {
    try {
      const response = await fetch('http://localhost:3001/api/exchange-rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          rate: newRate,
          startDate: startDate.toISOString(),
          storeId: store.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error actualizando el tipo de cambio');
      }

      await refreshDb();
      alert(`Tipo de cambio actualizado a ${newRate} desde ${startDate.toLocaleDateString()}.`);
    } catch (error: any) {
      console.error('Error setting exchange rate:', error);
      alert(`Error: ${error.message}`);
    }
  };
  
  // Data filtered for the manager's store
  const storeGestores = db.users.filter(u => u.role === Role.GESTOR && u.storeId === store.id);
  const storeProducts = db.products.filter(p => p.storeId === store.id);
  const storeClosings = db.closings.filter(c => storeGestores.some(g => g.id === c.gestorId));
  const storeSales = db.sales.filter(s => storeGestores.some(g => g.id === s.gestorId));

  const renderContent = () => {
    switch (activeTab) {
      case 'closings':
        return <ClosingsView closings={storeClosings} users={db.users} onValidate={handleValidateClosing} />;
      case 'inventory':
        return <InventoryView db={db} setDb={setDb} store={store} refreshDb={refreshDb} />;
      case 'products':
        return <ProductsView db={db} setDb={setDb} store={store} refreshDb={refreshDb} />;
      case 'gestores':
        return <GestoresView db={db} setDb={setDb} store={store} refreshDb={refreshDb} />;
      case 'rate':
        return <ExchangeRateView store={store} onSetExchangeRate={handleSetExchangeRate} />;
      case 'reports':
        return <ReportsView sales={storeSales} gestores={storeGestores} />;
      case 'stock':
        return <StockView db={db} setDb={setDb} store={store} refreshDb={refreshDb} />;
      case 'audit':
        return <AuditLogsView db={db} store={store} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow w-full">
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <TabButton name="Cierres Pendientes" tab="closings" activeTab={activeTab} onClick={setActiveTab} />
          <TabButton name="Reportes" tab="reports" activeTab={activeTab} onClick={setActiveTab} />
          <TabButton name="Stock Inicial" tab="stock" activeTab={activeTab} onClick={setActiveTab} />
          <TabButton name="Asignar Inventario" tab="inventory" activeTab={activeTab} onClick={setActiveTab} />
          <TabButton name="Productos" tab="products" activeTab={activeTab} onClick={setActiveTab} />
          <TabButton name="Gestores" tab="gestores" activeTab={activeTab} onClick={setActiveTab} />
          <TabButton name="Tipo de Cambio" tab="rate" activeTab={activeTab} onClick={setActiveTab} />
          <TabButton name="Auditoría" tab="audit" activeTab={activeTab} onClick={setActiveTab} />
        </nav>
      </div>
      <div className="py-6">
        {renderContent()}
      </div>
    </div>
  );
};


// =======================================================================
// Sub-components for each tab
// =======================================================================

const TabButton: React.FC<{name: string, tab: Tabs, activeTab: Tabs, onClick: (tab: Tabs) => void}> = ({ name, tab, activeTab, onClick }) => (
  <button
    onClick={() => onClick(tab)}
    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm ${
      activeTab === tab
        ? 'border-sky-500 text-sky-600'
        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:hover:text-slate-200'
    }`}
  >
    {name}
  </button>
);

// --- REPORTS VIEW ---
const ReportsView: React.FC<{sales: MockDB['sales'], gestores: User[]}> = ({ sales, gestores }) => {
  
  const salesByGestor = gestores.map(gestor => {
    const gestorSales = sales.filter(s => s.gestorId === gestor.id);
    const totalSales = gestorSales.length;
    const totalFinalMN = gestorSales.reduce((sum, s) => sum + s.finalMN, 0);
    const totalBaseMN = gestorSales.reduce((sum, s) => sum + s.baseMN, 0);
    const totalCommission = gestorSales.reduce((sum, s) => sum + s.commission, 0);

    return {
      gestorName: gestor.name,
      totalSales,
      totalFinalMN,
      totalBaseMN,
      totalCommission,
    };
  });

  return (
    <div>
      <h3 className="text-lg font-bold mb-4">Reporte de Ventas por Gestor</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Gestor</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Ventas</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Total Vendido</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Base a Pagar</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Comisión Gestor</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {salesByGestor.map(report => (
              <tr key={report.gestorName}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">{report.gestorName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300 text-right">{report.totalSales}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300 text-right">{formatCurrency(report.totalFinalMN)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300 text-right">{formatCurrency(report.totalBaseMN)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300 text-right">{formatCurrency(report.totalCommission)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};


// --- CIERRES VIEW ---
const ClosingsView: React.FC<{closings: Closing[], users: User[], onValidate: (id: string) => void}> = ({ closings, users, onValidate }) => {
  const pendingClosings = closings.filter(c => c.status === ClosingStatus.PENDING);
  const usersById = Object.fromEntries(users.map(u => [u.id, u]));
  return (
    <div>
      <h3 className="text-lg font-bold mb-4">Cierres Pendientes de Validación</h3>
      <div className="space-y-4">
        {pendingClosings.length > 0 ? pendingClosings.map(c => (
          <div key={c.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex justify-between items-center">
            <div>
              <p className="font-semibold">{usersById[c.gestorId]?.name || 'Usuario desconocido'}</p>
              <p className="text-sm text-slate-500">Iniciado: {new Date(c.initiatedAt).toLocaleString()}</p>
              <p className="font-bold text-sky-600 dark:text-sky-400 mt-1">Monto a Recibir: {formatCurrency(c.totalBaseMN)}</p>
            </div>
            <button onClick={() => onValidate(c.id)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-md">
              Validar Recepción
            </button>
          </div>
        )) : <p className="text-slate-500">No hay cierres pendientes.</p>}
      </div>
    </div>
  );
};

// --- EXCHANGE RATE VIEW ---
const ExchangeRateView: React.FC<{ store: Store; onSetExchangeRate: (rate: number, startDate: Date) => void }> = ({ store, onSetExchangeRate }) => {
  const [newRate, setNewRate] = useState<string>('');
  const [effectiveDate, setEffectiveDate] = useState<string>(new Date().toISOString().split('T')[0]); // Default to today

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(newRate);
    if (isNaN(rate) || rate <= 0) {
      alert('Por favor, introduce un tipo de cambio válido y positivo.');
      return;
    }
    onSetExchangeRate(rate, new Date(effectiveDate));
    setNewRate('');
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-4">Configurar Tipo de Cambio (USD a MN)</h3>
      <form onSubmit={handleSubmit} className="space-y-4 mb-8">
        <div>
          <label htmlFor="newRate" className="block text-sm font-medium text-slate-600 dark:text-slate-400">Nuevo Tipo de Cambio (MN por USD)</label>
          <input
            id="newRate"
            type="number"
            step="0.01"
            value={newRate}
            onChange={(e) => setNewRate(e.target.value)}
            className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
            placeholder="Ej: 300.50"
          />
        </div>
        <div>
          <label htmlFor="effectiveDate" className="block text-sm font-medium text-slate-600 dark:text-slate-400">Fecha de Vigencia (desde)</label>
          <input
            id="effectiveDate"
            type="date"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
          />
        </div>
        <button type="submit" className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-md transition-colors">
          Actualizar Tipo de Cambio
        </button>
      </form>

      <h4 className="font-bold text-lg mb-3">Historial de Tipos de Cambio</h4>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tasa</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vigente Desde</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vigente Hasta</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {(store.exchangeRates || []).sort((a,b) => b.startDate.getTime() - a.startDate.getTime()).map(xr => (
              <tr key={xr.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">{xr.rate}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{new Date(xr.startDate).toLocaleDateString()}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                  {xr.endDate ? new Date(xr.endDate).toLocaleDateString() : 'Actualmente vigente'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- GESTORES VIEW ---
const GestoresView: React.FC<Pick<ManagerDashboardProps, 'db' | 'setDb' | 'store' | 'refreshDb'>> = ({ db, setDb, store, refreshDb }) => {
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [editingGestor, setEditingGestor] = useState<User | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingPassword, setEditingPassword] = useState('');
  const storeGestores = db.users.filter(u => u.role === Role.GESTOR && u.storeId === store.id);

  const isGestorHasInventory = (gestorId: string): boolean => {
    return db.assignedInventory.some(ai => ai.gestorId === gestorId);
  };

  const handleAddGestor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !password.trim()) {
      alert('Por favor, complete todos los campos.');
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
          name: name.trim(),
          password: password,
          role: Role.GESTOR
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error creando el gestor');
      }

      await refreshDb();
      setName('');
      setPassword('');
      alert('Gestor creado exitosamente.');
    } catch (error: any) {
      console.error('Error creating gestor:', error);
      alert(`Error al crear el gestor: ${error.message}`);
    }
  };

  const handleEdit = (gestor: User) => {
    if (isGestorHasInventory(gestor.id)) {
      alert('El gestor no puede ser editado ni eliminado porque tiene inventario asignado.');
      return;
    }
    setEditingGestor(gestor);
    setEditingName(gestor.name);
    setEditingPassword('');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGestor || !editingName.trim()) return;

    try {
      const response = await fetch(`http://localhost:3001/api/users/${editingGestor.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: editingName.trim()
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error actualizando el gestor');
      }

      await refreshDb();
      setEditingGestor(null);
      setEditingName('');
      setEditingPassword('');
      alert('Gestor actualizado exitosamente.');
    } catch (error: any) {
      console.error('Error updating gestor:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleDelete = async (gestorId: string) => {
    if (isGestorHasInventory(gestorId)) {
      alert('El gestor no puede ser editado ni eliminado porque tiene inventario asignado.');
      return;
    }

    if (!confirm('¿Estás seguro de que deseas eliminar este gestor?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/users/${gestorId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error eliminando el gestor');
      }

      await refreshDb();
      alert('Gestor eliminado exitosamente.');
    } catch (error: any) {
      console.error('Error deleting gestor:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const cancelEdit = () => {
    setEditingGestor(null);
    setEditingName('');
    setEditingPassword('');
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-4">Gestionar Gestores</h3>

      {/* Edit Gestor Modal */}
      {editingGestor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Editar Gestor</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Nombre de usuario</label>
                <input
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border-slate-300 dark:border-slate-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Nueva contraseña (opcional)</label>
                <input
                  type="password"
                  value={editingPassword}
                  onChange={e => setEditingPassword(e.target.value)}
                  placeholder="Dejar vacío para no cambiar"
                  className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border-slate-300 dark:border-slate-600"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={cancelEdit} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add form */}
      <form onSubmit={handleAddGestor} className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-6">
        <input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Nombre de usuario del nuevo gestor"
          className="w-full bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md shadow-sm p-2"
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Contraseña"
          className="w-full bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md shadow-sm p-2"
        />
        <button type="submit" className="md:col-span-2 bg-sky-600 text-white font-bold py-2 px-4 rounded-md">Agregar</button>
      </form>
      {/* List */}
      <div className="space-y-2">
        {storeGestores.map(g => {
          const hasInventory = isGestorHasInventory(g.id);
          return (
            <li key={g.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md flex justify-between items-center">
              <div>
                <span className="font-medium text-slate-900 dark:text-slate-200">{g.name}</span>
                {hasInventory && (
                  <span className="ml-2 text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-md">
                    Tiene inventario asignado
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(g)}
                  disabled={hasInventory}
                  className="text-blue-600 hover:text-blue-800 font-medium text-sm disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(g.id)}
                  disabled={hasInventory}
                  className="text-red-600 hover:text-red-800 font-medium text-sm disabled:text-slate-400 disabled:cursor-not-allowed"
                >
                  Eliminar
                </button>
              </div>
            </li>
          );
        })}
      </div>
    </div>
  )
};

// --- PRODUCTS VIEW ---
const ProductsView: React.FC<Pick<ManagerDashboardProps, 'db' | 'setDb' | 'store' | 'refreshDb'>> = ({ db, setDb, store, refreshDb }) => {
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [margin, setMargin] = useState('');
  const [commission, setCommission] = useState('');
  const [currency, setCurrency] = useState<'USD' | 'MN'>('USD');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingName, setEditingName] = useState('');
  const [editingCost, setEditingCost] = useState('');
  const [editingMargin, setEditingMargin] = useState('');
  const [editingCommission, setEditingCommission] = useState('');
  const [editingCurrency, setEditingCurrency] = useState<'USD' | 'MN'>('USD');

  const storeProducts = db.products.filter(p => p.storeId === store.id);
  const currentExchangeRate = getCurrentExchangeRate(store);

  const isProductAssignedToGestor = (productId: string): boolean => {
    return db.assignedInventory.some(ai => ai.productId === productId);
  };

  const hasProductsInUSD = storeProducts.some(p => p.currency === 'USD');

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !cost || !margin) return;

    if (currency === 'USD' && !currentExchangeRate) {
      alert('No hay un tipo de cambio vigente. Por favor, configure un tipo de cambio antes de agregar productos con costo en USD.');
      return;
    }

    const parsedMargin = parseFloat(margin) / 100;
    let priceMN: number;
    let gestorCommissionMN: number;

    if (!commission.trim()) {
      alert('La comisión es obligatoria.');
      return;
    }

    const commissionRate = parseFloat(commission) / 100;
 
    if (currency === 'MN') {
      const costMN = parseFloat(cost);
      const baseMN = costMN * (1 + parsedMargin);
      gestorCommissionMN = baseMN * commissionRate;
      priceMN = baseMN + gestorCommissionMN;
    } else {
      const costUSD = parseFloat(cost);
      const saleUSD = costUSD * (1 + parsedMargin);
      const baseMN = saleUSD * currentExchangeRate!.rate;
      gestorCommissionMN = baseMN * commissionRate;
      priceMN = baseMN + gestorCommissionMN;
    }
 
    const newProduct: Omit<Product, 'id'> = {
      name,
      costUSD: currency === 'USD' ? parseFloat(cost) : undefined,
      costMN: currency === 'MN' ? parseFloat(cost) : undefined,
      margin: parsedMargin,
      commissionRate,
      storeId: store.id,
      currency,
      priceMN,
      gestorCommissionMN
    };

    try {
      const response = await fetch('http://localhost:3001/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(newProduct),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error creando el producto');
      }

      const createdProduct = await response.json();
      alert('Producto creado exitosamente.');
      setName(''); setCost(''); setMargin(''); setCommission('');
      await refreshDb();
    } catch (error: any) {
      console.error('Error creating product:', error);
      alert(`Error al crear el producto: ${error.message}`);
    }
  };



  const handleEdit = (product: Product) => {
    if (isProductAssignedToGestor(product.id)) {
      alert('El producto no puede ser editado ni eliminado porque se encuentra asignado a un gestor.');
      return;
    }
    setEditingProduct(product);
    setEditingName(product.name);
    setEditingCurrency(product.currency || 'USD');
    setEditingCost((product.currency === 'MN' ? product.costMN : product.costUSD)?.toString() || '');
    setEditingMargin((product.margin * 100).toString());
    setEditingCommission(product.commissionRate !== undefined ? (product.commissionRate * 100).toString() : '');
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct || !editingName.trim() || !editingCost || !editingMargin) return;

    try {
      const response = await fetch(`http://localhost:3001/api/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          name: editingName.trim(),
          costUSD: editingCurrency === 'USD' ? parseFloat(editingCost) : undefined,
          costMN: editingCurrency === 'MN' ? parseFloat(editingCost) : undefined,
          margin: parseFloat(editingMargin) / 100,
          commissionRate: editingCommission.trim() ? parseFloat(editingCommission) / 100 : undefined,
          currency: editingCurrency
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error actualizando el producto');
      }

      await refreshDb();
      setEditingProduct(null);
      setEditingName('');
      setEditingCost('');
      setEditingMargin('');
      setEditingCommission('');
      setEditingCurrency('USD');
      alert('Producto actualizado exitosamente.');
    } catch (error: any) {
      console.error('Error updating product:', error);
      alert(`Error al actualizar el producto: ${error.message}`);
    }
  };

  const handleDelete = async (productId: string) => {
    if (isProductAssignedToGestor(productId)) {
      alert('El producto no puede ser editado ni eliminado porque se encuentra asignado a un gestor.');
      return;
    }

    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/products/${productId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error eliminando el producto');
      }

      alert('Producto eliminado exitosamente.');
      await refreshDb();
    } catch (error: any) {
      console.error('Error deleting product:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setEditingName('');
    setEditingCost('');
    setEditingMargin('');
    setEditingCommission('');
    setEditingCurrency('USD');
  };

  const isAssigned = (productId: string): boolean => {
    return db.assignedInventory.some(ai => ai.productId === productId);
  };

  return (
    <div>
      <h3 className="text-lg font-bold mb-4">Gestionar Productos</h3>
       {!currentExchangeRate && (
        <div className="mb-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-md">
          <p className="text-amber-800 dark:text-amber-200 text-sm font-medium">
            ⚠️ No hay un tipo de cambio vigente. Configure uno en la pestaña "Tipo de Cambio".
          </p>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Editar Producto</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Moneda</label>
                <select
                  value={editingCurrency}
                  onChange={e => setEditingCurrency(e.target.value as 'USD' | 'MN')}
                  className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border-slate-300 dark:border-slate-600"
                >
                  <option value="USD">USD</option>
                  <option value="MN">MN</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Nombre</label>
                <input
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border-slate-300 dark:border-slate-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Costo ({editingCurrency})
                </label>
                <input
                  value={editingCost}
                  onChange={e => setEditingCost(e.target.value)}
                  type="number"
                  placeholder={`Costo (${editingCurrency})`}
                  className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border-slate-300 dark:border-slate-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Margen (%)</label>
                <input
                  value={editingMargin}
                  onChange={e => setEditingMargin(e.target.value)}
                  type="number"
                  className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border-slate-300 dark:border-slate-600"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                  Comisión gestor %
                </label>
                <input
                  value={editingCommission}
                  onChange={e => setEditingCommission(e.target.value)}
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="Dejar vacío para usar por defecto"
                  className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border-slate-300 dark:border-slate-600"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={cancelEdit} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700">
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-6 items-end">
          <select value={currency} onChange={e => setCurrency(e.target.value as 'USD' | 'MN')} className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border-slate-300 dark:border-slate-600">
            <option value="USD">USD</option>
            <option value="MN">MN</option>
          </select>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre" className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border-slate-300 dark:border-slate-600"/>
          {currency === 'USD' ? (
            <input value={cost} onChange={e => setCost(e.target.value)} placeholder="Costo (USD)" type="number" className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border-slate-300 dark:border-slate-600"/>
          ) : (
            <input value={cost} onChange={e => setCost(e.target.value)} placeholder="Costo (MN)" type="number" className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border-slate-300 dark:border-slate-600"/>
          )}
          <input value={margin} onChange={e => setMargin(e.target.value)} placeholder="Margen (%)" type="number" className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border-slate-300 dark:border-slate-600"/>
          <input
            value={commission}
            onChange={e => setCommission(e.target.value)}
            placeholder="Comisión gestor %"
            type="number"
            min="0"
            max="100"
            step="0.1"
            className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border-slate-300 dark:border-slate-600"
          />
          <button type="submit" disabled={!currentExchangeRate} className="bg-sky-600 hover:bg-sky-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white font-bold py-2 px-4 rounded-md">Agregar Producto</button>
        </form>
      <ul className="space-y-2">
        {storeProducts.map(p => {
          const prices = calculateProductPrices(p, currentExchangeRate);
          const commissionLabel = p.commissionRate !== undefined ? `${(p.commissionRate * 100).toFixed(1)}%` : 'N/A';
          const assigned = isAssigned(p.id);

          return (
            <li key={p.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md flex flex-col gap-1">
              <div className="flex justify-between items-start">
                <div>
                  <span className="font-medium text-slate-900 dark:text-slate-200">{p.name}</span>
                  <span className="ml-2 text-xs px-2 py-0.5 bg-slate-100 dark:bg-slate-600/30 text-slate-600 dark:text-slate-300 rounded-md">
                    {p.currency || 'USD'}
                  </span>
                  {assigned && (
                    <span className="ml-2 text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-md">
                      Asignado a gestor
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Costo: {p.currency === 'MN' ? `${formatCurrency(p.costMN || 0)}` : `$${p.costUSD}`} | Margen: {(p.margin*100).toFixed(1)}% | Comisión gestor: {commissionLabel}
                  </div>
                  {p.priceMN ? (
                    <div className="text-base font-bold text-sky-600 dark:text-sky-400">
                      Precio: {formatCurrency(p.priceMN)}
                    </div>
                  ) : currentExchangeRate && (
                    <div className="text-base font-bold text-sky-600 dark:text-sky-400">
                      Precio: {formatCurrency(prices.finalMN)}
                    </div>
                  )}
                  <div className="flex gap-2 justify-end mt-2">
                    <button
                      onClick={() => handleEdit(p)}
                      disabled={assigned}
                      className="text-blue-600 hover:text-blue-800 font-medium text-sm disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(p.id)}
                      disabled={assigned}
                      className="text-red-600 hover:text-red-800 font-medium text-sm disabled:text-slate-400 disabled:cursor-not-allowed"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  )
};

// --- STOCK VIEW ---
const StockView: React.FC<Pick<ManagerDashboardProps, 'db' | 'setDb' | 'store' | 'refreshDb'>> = ({ db, setDb, store, refreshDb }) => {
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(0);
  const [editingStock, setEditingStock] = useState<any | null>(null);
  const [editingQuantity, setEditingQuantity] = useState(0);
  const storeProducts = db.products.filter(p => p.storeId === store.id);

  const handleSetStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || quantity < 0) return;

    try {
      const response = await fetch('http://localhost:3001/api/product-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          productId,
          storeId: store.id,
          quantity: parseInt(quantity.toString())
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error setting product stock');
      }

      await refreshDb();
      alert('Stock actualizado exitosamente.');
      setQuantity(0);
    } catch (error: any) {
      console.error('Error setting stock:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleEditStock = (stock: any) => {
    setEditingStock(stock);
    setEditingQuantity(stock.quantity);
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStock || editingQuantity < 0) return;

    try {
      const response = await fetch('http://localhost:3001/api/product-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          productId: editingStock.productId,
          storeId: store.id,
          quantity: editingQuantity
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error actualizando stock');
      }

      await refreshDb();
      setEditingStock(null);
      setEditingQuantity(0);
      alert('Stock actualizado exitosamente.');
    } catch (error: any) {
      console.error('Error updating stock:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const handleDeleteStock = async (stockId: string, productId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro de stock?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/product-stock/${stockId}?productId=${productId}&storeId=${store.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error eliminando stock');
      }

      await refreshDb();
      alert('Stock eliminado exitosamente.');
    } catch (error: any) {
      console.error('Error deleting stock:', error);
      alert(`Error: ${error.message}`);
    }
  };

  const cancelEditStock = () => {
    setEditingStock(null);
    setEditingQuantity(0);
  };

  const isStockAssignedToGestor = (stockId: string): boolean => {
    const stock = db.productStock.find(s => s.id === stockId);
    if (!stock) return false;

    return db.assignedInventory.some(ai => ai.productId === stock.productId);
  };

  // Get current stock for this store
  const storeStock = db.productStock.filter(stock => stock.storeId === store.id);

  return (
    <div>
      <h3 className="text-lg font-bold mb-4">Gestión de Stock Inicial</h3>

      {/* Edit Stock Modal */}
      {editingStock && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200 mb-4">Editar Stock</h3>
            <form onSubmit={handleUpdateStock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Producto</label>
                <input
                  value={db.products.find(p => p.id === editingStock.productId)?.name || ''}
                  disabled
                  className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border-slate-300 dark:border-slate-600 opacity-60"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Cantidad</label>
                <input
                  value={editingQuantity}
                  onChange={e => setEditingQuantity(parseInt(e.target.value) || 0)}
                  type="number"
                  min="0"
                  className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border-slate-300 dark:border-slate-600"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button type="button" onClick={cancelEditStock} className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600">
                  Cancelar
                </button>
                <button type="submit" className="px-4 py-2 text-sm font-medium text-white bg-sky-600 rounded-md hover:bg-sky-700">
                  Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <form onSubmit={handleSetStock} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 items-end">
        <select
          value={productId}
          onChange={e => setProductId(e.target.value)}
          className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border-slate-300 dark:border-slate-600"
        >
          <option value="">Seleccionar producto</option>
          {storeProducts.map(p => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
        <input
          value={quantity}
          onChange={e => setQuantity(parseInt(e.target.value) || 0)}
          type="number"
          min="0"
          placeholder="Cantidad"
          className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border-slate-300 dark:border-slate-600"
        />
        <button type="submit" className="bg-sky-600 text-white font-bold py-2 px-4 rounded-md">Actualizar Stock</button>
      </form>

      {/* Current stock list */}
      <h4 className="font-bold mt-6 mb-2">Stock Actual</h4>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cantidad Disponible</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {storeStock.length > 0 ? storeStock.map(stock => {
              const product = db.products.find(p => p.id === stock.productId);
              const isAssigned = isStockAssignedToGestor(stock.id);
              return (
                <tr key={stock.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                      <span>{product?.name || 'Producto desconocido'}</span>
                      {isAssigned && (
                        <span className="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-md">
                          Asignado a gestor
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                    {stock.quantity}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditStock(stock)}
                        className="text-blue-600 hover:text-blue-800 font-medium text-sm"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteStock(stock.id, stock.productId)}
                        className="text-red-600 hover:text-red-800 font-medium text-sm"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={3} className="px-6 py-4 text-center text-sm text-slate-500">No hay stock registrado.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- INVENTORY VIEW ---
const InventoryView: React.FC<Pick<ManagerDashboardProps, 'db' | 'setDb' | 'store' | 'refreshDb'>> = ({ db, setDb, store, refreshDb }) => {
  const [productId, setProductId] = useState('');
  const [gestorId, setGestorId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const storeProducts = db.products.filter(p => p.storeId === store.id);
  const storeGestores = db.users.filter(u => u.role === Role.GESTOR && u.storeId === store.id);

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();

    const errors = [];
    if (!productId) {
      errors.push('Debe seleccionar un producto');
    }
    if (!gestorId) {
      errors.push('Debe seleccionar un gestor');
    }
    if (!quantity || quantity < 1) {
      errors.push('La cantidad debe ser mayor a 0');
    }

    if (errors.length > 0) {
      alert('Por favor, complete todos los campos correctamente:\n- ' + errors.join('\n- '));
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/assigned-inventory', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          productId,
          gestorId,
          quantity: parseInt(quantity.toString())
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Error assigning inventory');
      }

      await refreshDb();
      alert(`${quantity} unidad(es) asignadas.`);
      setQuantity(1);
    } catch (error: any) {
      console.error('Error assigning inventory:', error);
      alert(`Error: ${error.message}`);
    }
  };

  // Get assigned inventory for this store
  const assignedInventory = db.assignedInventory.filter(ai =>
    storeGestores.some(g => g.id === ai.gestorId)
  );

  // Group confirmed inventory by product, gestor, and price
  interface InventoryGroup {
    product: Product | undefined;
    gestor: User | undefined;
    quantity: number;
    priceMN?: number;
  }

  const groupedAssignedInventory = React.useMemo(() => {
    const groups: { [key: string]: InventoryGroup } = {};

    db.assignedInventory
      .filter(ai => storeGestores.some(g => g.id === ai.gestorId) && ai.status === 'Confirmed')
      .forEach(ai => {
        const key = `${ai.productId}-${ai.gestorId}-${ai.priceMN || 'pending'}`;
        if (!groups[key]) {
          const product = db.products.find(p => p.id === ai.productId);
          const gestor = db.users.find(u => u.id === ai.gestorId);
          groups[key] = { product, gestor, quantity: 0, priceMN: ai.priceMN };
        }
        groups[key].quantity += ai.quantity;
      });

    return groups;
  }, [db.assignedInventory, storeGestores, db.products, db.users]);

  return(
    <div>
      <h3 className="text-lg font-bold mb-4">Asignar Inventario a Gestores</h3>
      <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6 items-end">
        <select value={productId} onChange={e => setProductId(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border-slate-300 dark:border-slate-600"><option value="">Seleccionar producto</option>{storeProducts.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select value={gestorId} onChange={e => setGestorId(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border-slate-300 dark:border-slate-600"><option value="">Seleccionar gestor</option>{storeGestores.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select>
        <input value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} type="number" min="1" placeholder="Cantidad" className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border-slate-300 dark:border-slate-600"/>
        <button type="submit" className="bg-sky-600 text-white font-bold py-2 px-4 rounded-md">Asignar</button>
       </form>
       {/* Pending inventory list */}
       <h4 className="font-bold mt-6 mb-2">Inventario Pendiente de Aceptación</h4>
       <div className="overflow-x-auto mb-6">
         <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
           <thead className="bg-slate-50 dark:bg-slate-700">
             <tr>
               <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Producto</th>
               <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Gestor</th>
               <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cantidad</th>
               <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Estado</th>
             </tr>
           </thead>
           <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {assignedInventory.filter(ai => ai.status === 'Pending').length > 0 ? assignedInventory.filter(ai => ai.status === 'Pending').map(ai => {
                const product = db.products.find(p => p.id === ai.productId);
                const gestor = db.users.find(u => u.id === ai.gestorId);
                return (
                  <tr key={ai.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">
                      {product?.name || 'Producto desconocido'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                      {gestor?.name || 'Gestor desconocido'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                      {ai.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-amber-600 dark:text-amber-400">
                      Pendiente
                    </td>
                  </tr>
                );
              }) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-slate-500">No hay inventario pendiente.</td>
                </tr>
              )}
           </tbody>
         </table>
       </div>

       {/* Confirmed inventory grouped by price */}
       <h4 className="font-bold mt-6 mb-2">Inventario Confirmado (Agrupado por Precio)</h4>
       <div className="overflow-x-auto">
         <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
           <thead className="bg-slate-50 dark:bg-slate-700">
             <tr>
               <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Producto</th>
               <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Gestor</th>
               <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Precio</th>
               <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cantidad Total</th>
             </tr>
           </thead>
           <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {Object.keys(groupedAssignedInventory).length > 0 ? (Object.values(groupedAssignedInventory) as InventoryGroup[]).map((group, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">
                    {group.product?.name || 'Producto desconocido'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                    {group.gestor?.name || 'Gestor desconocido'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                    {group.priceMN ? formatCurrency(group.priceMN) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                    {group.quantity}
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-center text-sm text-slate-500">No hay inventario confirmado.</td>
                </tr>
              )}
           </tbody>
         </table>
       </div>
    </div>
  )
};

// --- AUDIT LOGS VIEW ---
const AuditLogsView: React.FC<{db: MockDB, store: Store}> = ({ db, store }) => {
  // Filter audit logs for the current store
  const storeAuditLogs = db.auditLogs
    .filter(log => log.storeId === store.id)
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()); // Sort by newest first

  // Get user names for display
  const userNames = Object.fromEntries(db.users.map(u => [u.id, u.name]));

  return (
    <div>
      <h3 className="text-lg font-bold mb-4">Registro de Auditoría</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Usuario</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Acción</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Entidad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Detalles</th>
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {storeAuditLogs.length > 0 ? storeAuditLogs.map(log => (
              <tr key={log.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                  {new Date(log.timestamp).toLocaleString()}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">
                  {userNames[log.userId] || 'Usuario desconocido'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                  {log.action}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                  {log.entityType}
                </td>
                <td className="px-6 py-4 text-sm text-slate-500 dark:text-slate-300 max-w-xs">
                  {log.entityId ? `ID: ${log.entityId}` : 'N/A'}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-slate-500">No hay registros de auditoría.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ManagerDashboard;