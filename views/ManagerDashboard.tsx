// views/ManagerDashboard.tsx
import React, { useState } from 'react';
import { User, Store, MockDB, Role, Product, InventoryItem, Closing, ClosingStatus } from '../types';
import { formatCurrency } from '../utils';

interface ManagerDashboardProps {
  user: User;
  store: Store;
  db: MockDB;
  setDb: React.Dispatch<React.SetStateAction<MockDB>>;
}

type Tabs = 'closings' | 'inventory' | 'products' | 'gestores';

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ user, store, db, setDb }) => {
  const [activeTab, setActiveTab] = useState<Tabs>('closings');

  // Handlers
  const handleValidateClosing = (closingId: string) => {
    if (window.confirm('¿Confirmas que has recibido el dinero de este cierre? Esta acción no se puede deshacer.')) {
      setDb(prevDb => ({
        ...prevDb,
        closings: prevDb.closings.map(c => 
          c.id === closingId ? { ...c, status: ClosingStatus.COMPLETED, completedAt: new Date() } : c
        ),
      }));
    }
  };
  
  // Data filtered for the manager's store
  const storeGestores = db.users.filter(u => u.role === Role.GESTOR && u.storeId === store.id);
  const storeProducts = db.products.filter(p => p.storeId === store.id);
  const storeClosings = db.closings.filter(c => storeGestores.some(g => g.id === c.gestorId));

  const renderContent = () => {
    switch (activeTab) {
      case 'closings':
        return <ClosingsView closings={storeClosings} users={db.users} onValidate={handleValidateClosing} />;
      case 'inventory':
        return <InventoryView db={db} setDb={setDb} store={store} />;
      case 'products':
        return <ProductsView db={db} setDb={setDb} store={store} />;
      case 'gestores':
        return <GestoresView db={db} setDb={setDb} store={store} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow w-full">
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <TabButton name="Cierres Pendientes" tab="closings" activeTab={activeTab} onClick={setActiveTab} />
          <TabButton name="Asignar Inventario" tab="inventory" activeTab={activeTab} onClick={setActiveTab} />
          <TabButton name="Productos" tab="products" activeTab={activeTab} onClick={setActiveTab} />
          <TabButton name="Gestores" tab="gestores" activeTab={activeTab} onClick={setActiveTab} />
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


// --- GESTORES VIEW ---
const GestoresView: React.FC<Pick<ManagerDashboardProps, 'db' | 'setDb' | 'store'>> = ({ db, setDb, store }) => {
  const [name, setName] = useState('');
  const storeGestores = db.users.filter(u => u.role === Role.GESTOR && u.storeId === store.id);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const newGestor: User = { id: `user-g-${Date.now()}`, name, role: Role.GESTOR, storeId: store.id };
    setDb(prev => ({ ...prev, users: [...prev.users, newGestor] }));
    setName('');
  };
  return (
    <div>
      <h3 className="text-lg font-bold mb-4">Gestionar Gestores</h3>
      {/* Add form */}
      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre del nuevo gestor" className="flex-grow bg-slate-100 dark:bg-slate-700 border-slate-300 dark:border-slate-600 rounded-md shadow-sm p-2"/>
        <button type="submit" className="bg-sky-600 text-white font-bold py-2 px-4 rounded-md">Agregar</button>
      </form>
      {/* List */}
      <ul className="space-y-2">
        {storeGestores.map(g => <li key={g.id} className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md">{g.name}</li>)}
      </ul>
    </div>
  )
};

// --- PRODUCTS VIEW ---
const ProductsView: React.FC<Pick<ManagerDashboardProps, 'db' | 'setDb' | 'store'>> = ({ db, setDb, store }) => {
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [margin, setMargin] = useState('');
  const storeProducts = db.products.filter(p => p.storeId === store.id);

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !cost || !margin) return;
    const newProduct: Product = { id: `prod-${Date.now()}`, name, costUSD: parseFloat(cost), margin: parseFloat(margin) / 100, storeId: store.id };
    setDb(prev => ({ ...prev, products: [...prev.products, newProduct] }));
    setName(''); setCost(''); setMargin('');
  };
  return (
    <div>
      <h3 className="text-lg font-bold mb-4">Gestionar Productos</h3>
       <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6 items-end">
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre" className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border-slate-300 dark:border-slate-600"/>
          <input value={cost} onChange={e => setCost(e.target.value)} placeholder="Costo (USD)" type="number" className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border-slate-300 dark:border-slate-600"/>
          <input value={margin} onChange={e => setMargin(e.target.value)} placeholder="Margen (%)" type="number" className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border-slate-300 dark:border-slate-600"/>
          <button type="submit" className="bg-sky-600 text-white font-bold py-2 px-4 rounded-md">Agregar Producto</button>
      </form>
      <ul className="space-y-2">
        {storeProducts.map(p => <li key={p.id} className="p-3 bg-slate-50 dark:bg-slate-700/50 rounded-md">{p.name} - Costo: ${p.costUSD} - Margen: {p.margin*100}%</li>)}
      </ul>
    </div>
  )
};

// --- INVENTORY VIEW ---
const InventoryView: React.FC<Pick<ManagerDashboardProps, 'db' | 'setDb' | 'store'>> = ({ db, setDb, store }) => {
  const [productId, setProductId] = useState('');
  const [gestorId, setGestorId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const storeProducts = db.products.filter(p => p.storeId === store.id);
  const storeGestores = db.users.filter(u => u.role === Role.GESTOR && u.storeId === store.id);

  const handleAssign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || !gestorId || quantity < 1) return;
    const newItems: InventoryItem[] = Array.from({ length: quantity }, () => ({
      id: `inv-${Date.now()}-${Math.random()}`,
      productId,
      gestorId,
      assignedAt: new Date(),
      status: 'Available',
    }));
    setDb(prev => ({ ...prev, inventory: [...prev.inventory, ...newItems] }));
    alert(`${quantity} unidad(es) asignadas.`);
  };

  return(
    <div>
      <h3 className="text-lg font-bold mb-4">Asignar Inventario a Gestores</h3>
      <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-6 items-end">
        <select value={productId} onChange={e => setProductId(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border-slate-300 dark:border-slate-600"><option value="">Seleccionar producto</option>{storeProducts.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select value={gestorId} onChange={e => setGestorId(e.target.value)} className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border-slate-300 dark:border-slate-600"><option value="">Seleccionar gestor</option>{storeGestores.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select>
        <input value={quantity} onChange={e => setQuantity(parseInt(e.target.value))} type="number" min="1" placeholder="Cantidad" className="w-full bg-slate-100 dark:bg-slate-700 p-2 rounded-md border-slate-300 dark:border-slate-600"/>
        <button type="submit" className="bg-sky-600 text-white font-bold py-2 px-4 rounded-md">Asignar</button>
      </form>
       {/* Simple inventory list */}
       <h4 className="font-bold mt-6 mb-2">Inventario Total Asignado</h4>
       <ul className="space-y-2 text-sm">
        {db.inventory.filter(i => storeProducts.some(p => p.id === i.productId)).map(i => {
          const product = db.products.find(p=>p.id === i.productId)?.name;
          const gestor = db.users.find(u=>u.id === i.gestorId)?.name;
          return <li key={i.id} className="p-2 bg-slate-50 dark:bg-slate-700/50 rounded-md">1x <span className="font-semibold">{product}</span> asignado a <span className="font-semibold">{gestor}</span> ({i.status})</li>
        })}
       </ul>
    </div>
  )
};

export default ManagerDashboard;