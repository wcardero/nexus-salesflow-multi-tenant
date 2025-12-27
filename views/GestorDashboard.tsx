// views/GestorDashboard.tsx
import React, { useState, useMemo } from 'react';
import { User, Store, MockDB, InventoryItem, Product, Role, Sale, ClosingStatus, Closing, AssignedInventory, InventoryConflict } from '../types';
import { calculateProductPrices, formatCurrency, getCurrentExchangeRate } from '../utils';

interface GestorDashboardProps {
  user: User;
  store: Store;
  db: MockDB;
  setDb: React.Dispatch<React.SetStateAction<MockDB | null>>;
}

type Tabs = 'sales' | 'reports';

const GestorDashboard: React.FC<GestorDashboardProps> = ({ user, store, db, setDb }) => {
  const [activeTab, setActiveTab] = useState<Tabs>('sales');

  const storeProducts = db.products.filter(p => p.storeId === store.id);
  const productsById = Object.fromEntries(db.products.map(p => [p.id, p]));
  const currentRate = getCurrentExchangeRate(store);

  // Data filtered for the current gestor from assigned inventory (Confirmed status only)
  const gestorInventory = useMemo(() => {
    const assigned = db.assignedInventory.filter(ai => ai.gestorId === user.id && ai.status === 'Confirmed');
    const items: InventoryItem[] = [];

    assigned.forEach(ai => {
      for (let i = 0; i < ai.quantity; i++) {
        items.push({
          id: `${ai.id}-${i}`,
          productId: ai.productId,
          gestorId: ai.gestorId,
          assignedAt: ai.assignedAt,
          status: 'Available'
        });
      }
    });

    return items;
  }, [db.assignedInventory, user.id]);

  const gestorSales = useMemo(() => db.sales.filter(sale => sale.gestorId === user.id), [db.sales, user.id]);
  const gestorClosings = useMemo(() => db.closings.filter(c => c.gestorId === user.id), [db.closings, user.id]);

  const renderContent = () => {
    switch (activeTab) {
      case 'sales':
        return (
          <SalesView
            user={user}
            store={store}
            db={db}
            setDb={setDb}
            gestorInventory={gestorInventory.filter(item => item.status === 'Available')}
            gestorSalesSinceLastClosing={gestorSales.filter(sale => !gestorClosings.some(c => c.sales.some(s => s.id === sale.id)))}
            productsById={productsById}
            currentRate={currentRate}
          />
        );
      case 'reports':
        return (
          <GestorReportsView
            gestorSales={gestorSales}
            gestorClosings={gestorClosings}
            products={storeProducts}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow w-full">
      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-6" aria-label="Tabs">
          <TabButton name="Inventario y Ventas" tab="sales" activeTab={activeTab} onClick={setActiveTab} />
          <TabButton name="Mis Reportes" tab="reports" activeTab={activeTab} onClick={setActiveTab} />
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

// --- SALES VIEW (Existing functionality) ---
interface SalesViewProps extends GestorDashboardProps {
  gestorInventory: InventoryItem[];
  gestorSalesSinceLastClosing: Sale[];
  productsById: { [key: string]: Product };
  currentRate: ReturnType<typeof getCurrentExchangeRate>;
}

const SalesView: React.FC<SalesViewProps> = ({ user, store, db, setDb, gestorInventory, gestorSalesSinceLastClosing, productsById, currentRate }) => {
  const handleSellItem = (inventoryItem: InventoryItem) => {
    if (!currentRate) {
      alert('Error: No hay un tipo de cambio activo para esta tienda.');
      return;
    }
    const product = productsById[inventoryItem.productId];
    const prices = calculateProductPrices(product, currentRate, store.defaultCommissionRate);
    
    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      inventoryItemId: inventoryItem.id,
      gestorId: user.id,
      soldAt: new Date(),
      exchangeRateUsed: currentRate.rate,
      costUSD: product.costUSD,
      margin: product.margin,
      ...prices
    };

    setDb(prevDb => {
      if (!prevDb) return prevDb;
      const updatedInventory = prevDb.inventory.map(item =>
        item.id === inventoryItem.id ? { ...item, status: 'Sold' as 'Available' | 'Sold', saleId: newSale.id } : item
      );
      return {
        ...prevDb,
        inventory: updatedInventory,
        sales: [...prevDb.sales, newSale]
      };
    });
  };

  const handleExecuteClosing = () => {
    if (gestorSalesSinceLastClosing.length === 0) {
      alert('No hay ventas nuevas para cerrar.');
      return;
    }

    const totalBaseMN = gestorSalesSinceLastClosing.reduce((sum, sale) => sum + sale.baseMN, 0);
    const totalCommission = gestorSalesSinceLastClosing.reduce((sum, sale) => sum + sale.commission, 0);
    const totalFinalMN = gestorSalesSinceLastClosing.reduce((sum, sale) => sum + sale.finalMN, 0);

    const newClosing: Closing = {
      id: `closing-${Date.now()}`,
      gestorId: user.id,
      initiatedAt: new Date(),
      status: ClosingStatus.PENDING,
      sales: gestorSalesSinceLastClosing,
      totalBaseMN,
      totalCommission,
      totalFinalMN,
    };
    
    // Simple summary for user confirmation
    const summary = `
      Resumen del Cierre:
      - Artículos Vendidos: ${gestorSalesSinceLastClosing.length}
      - Total Recaudado: ${formatCurrency(totalFinalMN)}
      - Tu Comisión: ${formatCurrency(totalCommission)}
      - Monto a Entregar: ${formatCurrency(totalBaseMN)}

      ¿Confirmas la ejecución del cierre?
    `;

    if (window.confirm(summary)) {
      setDb(prevDb => {
        if (!prevDb) return prevDb;
        return {
          ...prevDb,
          closings: [...prevDb.closings, newClosing],
        };
      });
      alert('Cierre ejecutado. El manager ha sido notificado.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      {/* Columna de Inventario Asignado */}
      <div className="lg:col-span-2 bg-white dark:bg-slate-800 p-6 rounded-lg shadow">
        <h2 className="text-xl font-bold mb-4">Mi Inventario Disponible</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Precio de Venta</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {gestorInventory.map(item => {
                const product = productsById[item.productId];
                if (!product || !currentRate) return null;
                const prices = calculateProductPrices(product, currentRate, store.defaultCommissionRate);
                return (
                  <tr key={item.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">{product.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">{formatCurrency(prices.finalMN)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        onClick={() => handleSellItem(item)}
                        className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 rounded-md text-xs transition-colors"
                      >
                        Vender
                      </button>
                    </td>
                  </tr>
                );
              })}
              {gestorInventory.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-sm text-slate-500">No tienes inventario asignado.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Columna de Cierre de Caja */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow h-fit">
        <h2 className="text-xl font-bold mb-4">Cierre de Caja</h2>
        <div className="space-y-4">
            <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                <h3 className="font-semibold text-slate-800 dark:text-slate-200">Ventas desde último cierre</h3>
                <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">{gestorSalesSinceLastClosing.length}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Total a entregar: {formatCurrency(gestorSalesSinceLastClosing.reduce((sum, s) => sum + s.baseMN, 0))}
                </p>
            </div>
          <button 
            onClick={handleExecuteClosing}
            disabled={gestorSalesSinceLastClosing.length === 0}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            Ejecutar Cierre
          </button>
        </div>
      </div>
    </div>
  );
};


// --- GESTOR REPORTS VIEW ---
interface GestorReportsViewProps {
  gestorSales: Sale[];
  gestorClosings: Closing[];
  products: Product[];
}

const GestorReportsView: React.FC<GestorReportsViewProps> = ({ gestorSales, gestorClosings, products }) => {
  const completedClosings = gestorClosings.filter(c => c.status === ClosingStatus.COMPLETED);
  
  const totalSalesCount = gestorSales.length;
  const totalCommissionEarned = completedClosings.reduce((sum, c) => sum + c.totalCommission, 0);

  // Map product IDs to names
  const productsById = Object.fromEntries(products.map(p => [p.id, p.name]));

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-xl font-bold mb-4">Resumen General</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg shadow">
            <p className="text-sm text-slate-500 dark:text-slate-400">Total de Ventas Realizadas</p>
            <p className="text-3xl font-bold text-sky-600 dark:text-sky-400">{totalSalesCount}</p>
          </div>
          <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg shadow">
            <p className="text-sm text-slate-500 dark:text-slate-400">Mi Comisión Total Acumulada</p>
            <p className="text-3xl font-bold text-green-600 dark:text-green-400">{formatCurrency(totalCommissionEarned)}</p>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-xl font-bold mb-4">Historial de Cierres Completados</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Ventas</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Total Recaudado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Monto Entregado</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Mi Comisión</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {completedClosings.length > 0 ? completedClosings.map(closing => (
                <tr key={closing.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">{new Date(closing.completedAt!).toLocaleDateString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300 text-right">{closing.sales.length}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300 text-right">{formatCurrency(closing.totalFinalMN)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300 text-right">{formatCurrency(closing.totalBaseMN)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300 text-right">{formatCurrency(closing.totalCommission)}</td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-slate-500">No hay cierres completados.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default GestorDashboard;