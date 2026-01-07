// views/GestorDashboard.tsx
import React, { useState, useMemo } from 'react';
import { User, Store, MockDB, InventoryItem, Product, Role, Sale, ClosingStatus, Closing, AssignedInventory, InventoryConflict, InventoryGroup, ExchangeRate } from '../types';
import { calculateProductPrices, formatCurrency, getCurrentExchangeRate } from '../utils';
import SellModal from '../components/SellModal';
import DateRangeSelector from '../components/DateRangeSelector';
import ExportButton from '../components/ExportButton';
import ReportCard from '../components/ReportCard';
import { formatDate } from '../dateUtils';
import { exportToCSV, exportToPDF, exportToExcel } from '../exportUtils';

interface GestorDashboardProps {
  user: User;
  store: Store;
  db: MockDB;
  setDb: React.Dispatch<React.SetStateAction<MockDB | null>>;
  refreshDb: () => Promise<void>;
}

type Tabs = 'inventory' | 'sales' | 'reports';

const GestorDashboard: React.FC<GestorDashboardProps> = ({ user, store, db, setDb, refreshDb }) => {
  console.log('[GestorDashboard] Component mounted - user.id:', user.id);
  console.log('[GestorDashboard] Component mounted - user.name:', user.name);
  console.log('[GestorDashboard] Component mounted - user.role:', user.role);

  const [activeTab, setActiveTab] = useState<Tabs>('inventory');
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const storeProducts = db.products.filter(p => p.storeId === store.id);
  const productsById = useMemo(() => Object.fromEntries(db.products.map(p => [p.id, p])), [db.products]);
  const currentRate = getCurrentExchangeRate(store);

  const pendingInventory = useMemo(() => {
    const pending = db.assignedInventory.filter(ai => ai.gestorId === user.id && ai.status === 'Pending');
    console.log('[GestorDashboard] pendingInventory:', pending);
    console.log('[GestorDashboard] user.id:', user.id);
    console.log('[GestorDashboard] db.assignedInventory:', db.assignedInventory);
    return pending;
  }, [db.assignedInventory, user.id]);

  const handleConfirmInventory = async (assignedId: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/assigned-inventory/${assignedId}/confirm`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        await refreshDb();
        alert('Inventario confirmado exitosamente.');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error: any) {
      console.error('Error confirming inventory:', error);
      alert('Error al confirmar el inventario.');
    }
  };

  const handleRejectInventory = async (assignedId: string, reason: string) => {
    try {
      const response = await fetch(`http://localhost:3001/api/assigned-inventory/${assignedId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ reason })
      });

      if (response.ok) {
        await refreshDb();
        alert('Inventario rechazado. El manager será notificado.');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error: any) {
      console.error('Error rejecting inventory:', error);
      alert('Error al rechazar el inventario.');
    }
  };

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



  const groupedInventory = useMemo(() => {
    const groups: { [key: string]: InventoryGroup } = {};

    // PRIMERO filtrar por gestorId para que cada gestor solo vea sus asignaciones
    db.assignedInventory
      .filter(ai => ai.gestorId === user.id && ai.status === 'Confirmed')
      .forEach(ai => {
        // Key includes both productId and gestorId to separate assignments by gestor
        const key = `${ai.productId}-${ai.gestorId}`;
        if (!groups[key]) {
          groups[key] = { productId: ai.productId, quantity: 0, priceMN: ai.priceMN || 0, assignedAt: ai.assignedAt, assignedInventoryId: ai.id, items: [] };
        }
        groups[key].quantity += ai.quantity;

        for (let i = 0; i < ai.quantity; i++) {
          groups[key].items.push({
            id: `${ai.id}-${i}`,
            productId: ai.productId,
            gestorId: ai.gestorId,
            assignedAt: ai.assignedAt,
            status: 'Available'
          });
        }
      });

    console.log('[GestorDashboard] groupedInventory - groups:', groups);
    console.log('[GestorDashboard] groupedInventory - keys:', Object.keys(groups));
    return groups;
  }, [db.assignedInventory, user.id]);

  const gestorSales = useMemo(() => db.sales.filter(sale => sale.gestorId === user.id), [db.sales, user.id]);
  const gestorClosings = useMemo(() => db.closings.filter(c => c.gestorId === user.id), [db.closings, user.id]);

  const renderContent = () => {
    console.log('[GestorDashboard] renderContent called, activeTab:', activeTab);
    console.log('[GestorDashboard] groupedInventory keys:', Object.keys(groupedInventory));
    console.log('[GestorDashboard] groupedInventory:', groupedInventory);
    console.log('[GestorDashboard] db.products length:', db.products.length);
    
    // Si products no está cargado, mostrar estado de carga
    if (!db.products || db.products.length === 0) {
      console.log('[GestorDashboard] Products not loaded yet, showing loading...');
      return (
        <div className="flex items-center justify-center min-h-screen bg-slate-900 text-slate-200">
          <p>Cargando inventario...</p>
        </div>
      );
    }
    
    switch (activeTab) {
      case 'inventory':
        console.log('[GestorDashboard] Rendering inventory tab');
        return (
          <PendingInventoryView
            pendingInventory={pendingInventory}
            productsById={productsById}
            onConfirm={handleConfirmInventory}
            onReject={handleRejectInventory}
          />
        );
      case 'sales':
        console.log('[GestorDashboard] Rendering sales tab');
        return (
          <SalesView
            user={user}
            store={store}
            db={db}
            setDb={setDb}
            gestorInventory={gestorInventory.filter(item => item.status === 'Available')}
            gestorSalesSinceLastClosing={gestorSales.filter(sale => !gestorClosings.some(c => c.sales && c.sales.some(s => s.id === sale.id)))}
            productsById={productsById}
            currentRate={currentRate}
            groupedInventory={groupedInventory}
            refreshDb={refreshDb}
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
    <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg shadow-sm w-full">
      <div className="border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
        <nav className="-mb-px flex space-x-6 min-w-max" aria-label="Tabs">
          <TabButton name="Inventario Pendiente" tab="inventory" activeTab={activeTab} onClick={setActiveTab} />
          <TabButton name="Inventario y Ventas" tab="sales" activeTab={activeTab} onClick={setActiveTab} />
          <TabButton name="Mis Reportes" tab="reports" activeTab={activeTab} onClick={setActiveTab} />
        </nav>
      </div>
      <div className="py-4 md:py-6">
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
    className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
      activeTab === tab
        ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400'
        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'
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
  groupedInventory: { [key: string]: InventoryGroup };
  refreshDb: () => Promise<void>;
}

const SalesView: React.FC<SalesViewProps> = ({ user, store, db, setDb, gestorSalesSinceLastClosing, productsById, currentRate, groupedInventory, refreshDb }) => {
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<InventoryGroup | null>(null);

  const handleOpenSellModal = (group: InventoryGroup) => {
    setSelectedGroup(group);
    setIsSellModalOpen(true);
  };

  const handleCloseSellModal = () => {
    setSelectedGroup(null);
    setIsSellModalOpen(false);
  };

  const performSale = (quantity: number, group: InventoryGroup, product: Product, exchangeRate: ExchangeRate | undefined) => {
    const prices = calculateProductPrices(product, exchangeRate);

    const newSales: Sale[] = [];
    let updatedInventoryItems: InventoryItem[] = [];

    // Assuming a simple scenario where we sell from the beginning of the items array
    // In a real app, you might have a more complex inventory management (e.g., specific item IDs)
    for (let i = 0; i < quantity; i++) {
      const soldItem = group.items[i]; // Get the specific item to mark as sold

      const newSale: Sale = {
        id: `sale-${Date.now()}-${soldItem.id}`,
        inventoryItemId: soldItem.id,
        gestorId: user.id,
        soldAt: new Date(),
        exchangeRateUsed: exchangeRate?.rate || 0,
        costUSD: product.costUSD,
        margin: product.margin,
        ...prices
      };
      newSales.push(newSale);
      
      // Mark the specific inventory item as sold
      updatedInventoryItems.push({
        ...soldItem,
        status: 'Sold',
        saleId: newSale.id
      });
    }

    setDb(prevDb => {
      if (!prevDb) return prevDb;

      // Update the main inventory list
      const updatedGlobalInventory = prevDb.inventory.map(item => {
        const soldMatch = updatedInventoryItems.find(sold => sold.id === item.id);
        return soldMatch ? soldMatch : item;
      });

      return {
        ...prevDb,
        inventory: updatedGlobalInventory,
        sales: [...prevDb.sales, ...newSales]
      };
    });
  };

  const handleSell = async (quantity: number) => {
    if (!selectedGroup) {
      alert('Error: No se pudo completar la venta. Faltan datos.');
      return;
    }

    if (quantity > selectedGroup.quantity) {
      alert(`Solo tienes ${selectedGroup.quantity} unidades disponibles.`);
      return;
    }

    if (!window.confirm(`¿Vender ${quantity} unidad(es) de ${productsById[selectedGroup.productId]?.name} por ${formatCurrency(selectedGroup.priceMN * quantity)}?`)) {
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          assignedInventoryId: selectedGroup.assignedInventoryId,
          quantity
        })
      });

      if (response.ok) {
        await refreshDb();
        handleCloseSellModal();
        alert(`Venta exitosa: ${quantity} unidad(es) por ${formatCurrency(selectedGroup.priceMN * quantity)}`);
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error: any) {
      console.error('Error creating sale:', error);
      alert('Error al crear la venta.');
    }
  };
  
  const handleExecuteClosing = async () => {
    if (gestorSalesSinceLastClosing.length === 0) {
      alert('No hay ventas nuevas para cerrar.');
      return;
    }

    const totalBaseMN = gestorSalesSinceLastClosing.reduce((sum, sale) => sum + sale.baseMN, 0);
    const totalCommission = gestorSalesSinceLastClosing.reduce((sum, sale) => sum + sale.commission, 0);
    const totalFinalMN = gestorSalesSinceLastClosing.reduce((sum, sale) => sum + sale.finalMN, 0);

    const summary = `
      Resumen del Cierre:
      - Artículos Vendidos: ${gestorSalesSinceLastClosing.length}
      - Total Recaudado: ${formatCurrency(totalFinalMN)}
      - Tu Comisión: ${formatCurrency(totalCommission)}
      - Monto a Entregar: ${formatCurrency(totalBaseMN)}

      ¿Confirmas la ejecución del cierre?
    `;

    if (!window.confirm(summary)) {
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/closings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          saleIds: gestorSalesSinceLastClosing.map(s => s.id)
        })
      });

      if (response.ok) {
        await refreshDb();
        alert('Cierre ejecutado. El manager ha sido notificado.');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error: any) {
      console.error('Error creating closing:', error);
      alert('Error al crear el cierre.');
    }
  };

  const salesByProduct = useMemo(() => {
    const groups: { [key: string]: { quantity: number; total: number; gestorGain: number; storeGain: number } } = {};

    gestorSalesSinceLastClosing.forEach(sale => {
      const assignedInventory = db.assignedInventory.find(ai => ai.gestorId === user.id && sale.inventoryItemId.startsWith(ai.id));
      if (assignedInventory) {
        const key = assignedInventory.productId;
        if (!groups[key]) {
          groups[key] = { quantity: 0, total: 0, gestorGain: 0, storeGain: 0 };
        }
        groups[key].quantity += 1;
        groups[key].total += sale.finalMN;
        groups[key].gestorGain += sale.commission;
        groups[key].storeGain += sale.baseMN;
      }
    });

    return groups;
  }, [gestorSalesSinceLastClosing, db.assignedInventory, user.id]);

  const totalSalesAmount = (Object.values(salesByProduct) as Array<{ quantity: number; total: number; gestorGain: number; storeGain: number }>).reduce((sum: number, data) => sum + (data.total || 0), 0);
  const totalGestorGain = (Object.values(salesByProduct) as Array<{ quantity: number; total: number; gestorGain: number; storeGain: number }>).reduce((sum: number, data) => sum + (data.gestorGain || 0), 0);
  const totalStoreGain = (Object.values(salesByProduct) as Array<{ quantity: number; total: number; gestorGain: number; storeGain: number }>).reduce((sum: number, data) => sum + (data.storeGain || 0), 0);

  return (
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna de Inventario Asignado */}
        <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg shadow-sm">
          <h2 className="text-lg md:text-xl font-bold mb-4">Mi Inventario Disponible</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-100 dark:bg-slate-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-400 uppercase tracking-wider">Producto</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-400 uppercase tracking-wider">Precio de Venta</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-400 uppercase tracking-wider">% Comision Gestor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-400 uppercase tracking-wider">Cantidad</th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-slate-700 dark:text-slate-400 uppercase tracking-wider">Acción</th>
                </tr>
              </thead>
              <tbody className="bg-slate-50 dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                {(Object.entries(groupedInventory) as [string, InventoryGroup][]).map(([key, group]) => {
                  const product = productsById[group.productId];
                  if (!product) {
                    return null;
                  }
                  return (
                    <tr key={key}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">{product.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{formatCurrency(group.priceMN)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{((product.commissionRate || 0) * 100).toFixed(0)}%</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{group.quantity}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-center">
                        {group.items.length > 0 && (
                          <button
                            onClick={() => handleOpenSellModal(group)}
                            className="bg-success-700 hover:bg-success-800 dark:bg-success-600 dark:hover:bg-success-700 text-white font-bold py-1 px-3 rounded-md text-xs shadow-md transition-all"
                          >
                            Vender
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
                {Object.keys(groupedInventory).length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-slate-600">No tienes inventario asignado.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Ventas Realizadas */}
        {Object.keys(salesByProduct).length > 0 && (
          <div className="lg:col-span-2 bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg shadow-sm">
            <h2 className="text-lg md:text-xl font-bold mb-4">Ventas Realizadas</h2>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-100 dark:bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-400 uppercase tracking-wider">Producto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-700 dark:text-slate-400 uppercase tracking-wider">Cantidad</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-400 uppercase tracking-wider">Ganancia Gestor</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-400 uppercase tracking-wider">Ganancia Tienda</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-700 dark:text-slate-400 uppercase tracking-wider">Dinero Recaudado</th>
                  </tr>
                </thead>
                <tbody className="bg-slate-50 dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  {(Object.entries(salesByProduct) as [string, { quantity: number; total: number; gestorGain: number; storeGain: number }][]).map(([productId, data]) => {
                    const product = productsById[productId];
                    if (!product) return null;
                    return (
                      <tr key={productId}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">{product.name}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300">{data.quantity}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 text-right">{formatCurrency(data.gestorGain)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 text-right">{formatCurrency(data.storeGain)}</td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-600 dark:text-slate-300 text-right">{formatCurrency(data.total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
                <tfoot className="bg-slate-100 dark:bg-slate-700">
                  <tr>
                    <td colSpan={2} className="px-6 py-3 text-left text-sm font-bold text-slate-900 dark:text-slate-200">Total</td>
                    <td className="px-6 py-3 text-right text-sm font-bold text-success-600 dark:text-success-400">
                      {formatCurrency(totalGestorGain)}
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-bold text-primary-600 dark:text-primary-400">
                      {formatCurrency(totalStoreGain)}
                    </td>
                    <td className="px-6 py-3 text-right text-sm font-bold text-info-600 dark:text-info-400">
                      {formatCurrency(totalSalesAmount)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Columna de Cierre de Caja */}
        <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg shadow-sm h-fit">
          <h2 className="text-lg md:text-xl font-bold mb-4">Cierre de Caja</h2>
          <div className="space-y-4">
              <div className="p-4 bg-slate-100 dark:bg-slate-700/50 rounded-lg">
                  <h3 className="font-semibold text-slate-800 dark:text-slate-200">Ventas desde último cierre</h3>
                  <p className="text-2xl font-bold text-info-600 dark:text-info-400">{gestorSalesSinceLastClosing.length}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    Total recaudado: {formatCurrency(gestorSalesSinceLastClosing.reduce((sum, s) => sum + s.finalMN, 0))}
                  </p>
              </div>
            <button 
              onClick={handleExecuteClosing}
              disabled={gestorSalesSinceLastClosing.length === 0}
              className="w-full bg-info-700 hover:bg-info-800 dark:bg-info-600 dark:hover:bg-info-700 text-white font-bold py-2 px-4 rounded-md transition-all shadow-md hover:shadow-lg disabled:bg-slate-400 disabled:cursor-not-allowed disabled:shadow-none"
            >
              Ejecutar Cierre
            </button>
          </div>
        </div>
      </div>
      <SellModal
        isOpen={isSellModalOpen}
        onClose={handleCloseSellModal}
        onSell={handleSell}
        product={selectedGroup ? productsById[selectedGroup.productId] : null}
        inventoryGroup={selectedGroup}
      />
    </>
  );
};


// --- GESTOR REPORTS VIEW ---
interface GestorReportsViewProps {
  gestorSales: Sale[];
  gestorClosings: Closing[];
  products: Product[];
}

const GestorReportsView: React.FC<GestorReportsViewProps> = ({ gestorSales, gestorClosings, products }) => {
  const [dateRange, setDateRange] = useState({
    start: new Date(new Date().setDate(1)),
    end: new Date()
  });

  const filteredClosings = gestorClosings.filter(c => 
    c.status === ClosingStatus.COMPLETED &&
    c.completedAt &&
    c.completedAt >= dateRange.start &&
    c.completedAt <= dateRange.end
  );

  const totalClosings = filteredClosings.length;
  const totalCommissionEarned = filteredClosings.reduce((sum, c) => sum + c.totalCommission, 0);
  const totalRecaudado = filteredClosings.reduce((sum, c) => sum + c.totalFinalMN, 0);
  const totalEntregado = filteredClosings.reduce((sum, c) => sum + c.totalBaseMN, 0);

  const handleExportCSV = () => {
    const data = filteredClosings.map(c => ({
      Fecha: formatDate(new Date(c.completedAt!)),
      Ventas: c.sales.length,
      TotalRecaudado: c.totalFinalMN,
      MontoEntregado: c.totalBaseMN,
      MiComision: c.totalCommission
    }));
    exportToCSV(data, `reporte_gestor_${formatDate(new Date())}`);
  };

  const handleExportPDF = () => {
    const data = filteredClosings.map(c => ({
      Fecha: formatDate(new Date(c.completedAt!)),
      Ventas: c.sales.length,
      Total: c.totalFinalMN,
      Entregado: c.totalBaseMN,
      Comisión: c.totalCommission
    }));
    exportToPDF(data, 'Reporte de Cierres - Gestor', `reporte_gestor_${formatDate(new Date())}`);
  };

  const handleExportExcel = () => {
    const data = filteredClosings.map(c => ({
      Fecha: formatDate(new Date(c.completedAt!)),
      Ventas: c.sales.length,
      TotalRecaudado: c.totalFinalMN,
      MontoEntregado: c.totalBaseMN,
      MiComision: c.totalCommission
    }));
    exportToExcel(data, 'Cierres', `reporte_gestor_${formatDate(new Date())}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <DateRangeSelector value={dateRange} onChange={setDateRange} />
        <ExportButton
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
          onExportExcel={handleExportExcel}
          disabled={filteredClosings.length === 0}
          filename={`reporte_gestor_${formatDate(new Date())}`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ReportCard
          title="Cierres"
          value={totalClosings}
          icon="receipt_long"
        />
        <ReportCard
          title="Comisión Ganada"
          value={formatCurrency(totalCommissionEarned)}
          icon="payments"
        />
        <ReportCard
          title="Total Recaudado"
          value={formatCurrency(totalRecaudado)}
          icon="account_balance_wallet"
        />
      </div>

      <div>
        <h3 className="text-lg md:text-xl font-bold mb-4">Cierres Completados</h3>
        {filteredClosings.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">event_busy</span>
            <p className="text-slate-500 dark:text-slate-400">No hay cierres en el período seleccionado</p>
          </div>
        ) : (
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
                {filteredClosings.map(closing => (
                  <tr key={closing.id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">{formatDate(new Date(closing.completedAt!))}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300 text-right">{closing.sales.length}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300 text-right">{formatCurrency(closing.totalFinalMN)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300 text-right">{formatCurrency(closing.totalBaseMN)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300 text-right">{formatCurrency(closing.totalCommission)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

// --- PENDING INVENTORY VIEW (New functionality) ---
interface PendingInventoryViewProps {
  pendingInventory: AssignedInventory[];
  productsById: { [key: string]: Product };
  onConfirm: (id: string) => void;
  onReject: (id: string, reason: string) => void;
}

const PendingInventoryView: React.FC<PendingInventoryViewProps> = ({ pendingInventory, productsById, onConfirm, onReject }) => {
  const [rejecting, setRejecting] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  const handleReject = (id: string) => {
    if (!rejectionReason.trim()) {
      alert('Por favor, ingresa una razón para rechazar.');
      return;
    }
    onReject(id, rejectionReason);
    setRejecting(null);
    setRejectionReason('');
  };

  return (
    <div className="bg-warning-50 dark:bg-warning-900/20 p-4 md:p-6 rounded-lg shadow-sm mb-6 md:mb-8">
      <h2 className="text-lg md:text-xl font-bold mb-4 text-warning-800 dark:text-warning-200">
        Inventario Pendiente de Confirmación
      </h2>
      <p className="text-sm text-warning-700 dark:text-warning-300 mb-4">
        Por favor, verifica que los productos asignados se corresponden con lo que tienes en existencia.
      </p>
      {pendingInventory.length === 0 ? (
        <p className="text-sm text-warning-600 dark:text-warning-400">No hay inventario pendiente de confirmación.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-warning-200 dark:divide-warning-700">
            <thead>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-warning-900 dark:text-warning-200 uppercase">Producto</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-warning-900 dark:text-warning-200 uppercase">Cantidad</th>
                <th className="px-6 py-3 text-center text-xs font-medium text-warning-900 dark:text-warning-200 uppercase">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {pendingInventory.map(ai => {
                const product = productsById[ai.productId];
                if (!product) return null;
                return (
                  <tr key={ai.id}>
                    <td className="px-6 py-4">{product.name}</td>
                    <td className="px-6 py-4">{ai.quantity}</td>
                    <td className="px-6 py-4 text-center">
                      <button
                        onClick={() => onConfirm(ai.id)}
                        className="bg-success-700 hover:bg-success-800 dark:bg-success-600 dark:hover:bg-success-700 text-white font-bold py-1 px-3 rounded-md text-xs mr-2 shadow-md transition-all"
                      >
                        Aceptar
                      </button>
                      <button
                        onClick={() => setRejecting(ai.id)}
                        className="bg-danger-700 hover:bg-danger-800 dark:bg-danger-600 dark:hover:bg-danger-700 text-white font-bold py-1 px-3 rounded-md text-xs shadow-md transition-all"
                      >
                        Rechazar
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {rejecting && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-slate-800 p-6 rounded-lg shadow-xl w-full max-w-md">
            <h3 className="text-lg font-bold mb-4">Rechazar Inventario</h3>
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="Explica la razón del rechazo..."
              className="w-full h-32 p-3 border rounded-md dark:bg-slate-700 dark:border-slate-600 mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => { setRejecting(null); setRejectionReason(''); }}
                className="px-4 py-2 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-md"
              >
                Cancelar
              </button>
                <button
                  onClick={() => handleReject(rejecting)}
                  className="px-4 py-2 bg-danger-700 hover:bg-danger-800 dark:bg-danger-600 dark:hover:bg-danger-700 text-white rounded-md shadow-md transition-all"
                >
                  Confirmar Rechazo
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestorDashboard;