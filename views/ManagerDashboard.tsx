// views/ManagerDashboard.tsx
import React, { useState, Pick, useEffect, useMemo } from 'react';
import { User, Store, MockDB, Role, Product, InventoryItem, Closing, ClosingStatus, InventoryConflict, AssignedInventory } from '../types';
import { formatCurrency, getCurrentExchangeRate, calculateProductPrices } from '../utils';
import DateRangeSelector from '../components/DateRangeSelector';
import ExportButton from '../components/ExportButton';
import ReportCard from '../components/ReportCard';
import Button from '../components/Button';
import { formatDate, getPresetRanges, formatDateTime, formatAccountingDate } from '../dateUtils';
import { exportToCSV, exportToPDF, exportToExcel } from '../exportUtils';
import { addDays } from 'date-fns';

interface ManagerDashboardProps {
  user: User;
  store: Store;
  db: MockDB;
  setDb: React.Dispatch<React.SetStateAction<MockDB | null>>;
  refreshDb: () => Promise<void>;
  currentView?: string;
}

type Tabs = 'closings' | 'inventory' | 'products' | 'gestores' | 'rate' | 'reports' | 'stock' | 'conflicts' | 'reporte-ventas' | 'reporte-cierres';

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ user, store, db, setDb, refreshDb, currentView }) => {
  const [activeTab, setActiveTab] = useState<Tabs>('closings');
  const [isValidatingClosing, setIsValidatingClosing] = useState<string | null>(null);

  useEffect(() => {
    refreshDb();
  }, [activeTab]);

  useEffect(() => {
    if (currentView === 'dashboard') {
      setActiveTab('closings');
    } else if (currentView === 'report-ventas') {
      setActiveTab('reports');
    } else if (currentView === 'report-cierres') {
      setActiveTab('reporte-cierres');
    }
  }, [currentView]);

  // Handlers
  const handleValidateClosing = async (closingId: string) => {
    setIsValidatingClosing(closingId);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/closings/${closingId}/complete`, {
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
    } finally {
      setIsValidatingClosing(null);
    }
  };

  const handleSetExchangeRate = async (newRate: number, startDate: Date) => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/exchange-rates`, {
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
        return <ClosingsView closings={storeClosings} users={db.users} onValidate={handleValidateClosing} validatingId={isValidatingClosing} />;
      case 'inventory':
        return <InventoryView db={db} setDb={setDb} store={store} refreshDb={refreshDb} />;
      case 'products':
        return <ProductsView db={db} setDb={setDb} store={store} refreshDb={refreshDb} />;
        case 'gestores':
         return <GestoresView db={db} setDb={setDb} store={store} refreshDb={refreshDb} />;
        case 'rate':
         return <ExchangeRateView store={store} onSetExchangeRate={handleSetExchangeRate} />;
        case 'reports':
         return <ReportsView sales={storeSales} gestores={storeGestores} products={storeProducts} assignedInventory={db.assignedInventory} />;
        case 'stock':
         return <StockView db={db} setDb={setDb} store={store} refreshDb={refreshDb} />;
        case 'conflicts':
         return <ConflictsView conflicts={db.inventoryConflicts} products={db.products} refreshDb={refreshDb} />;
        case 'reporte-cierres':
         return <ClosingsReportView closings={storeClosings} users={db.users} products={storeProducts} assignedInventory={db.assignedInventory} />;
        default:
        return null;
    }
  };

  const showTabs = !currentView || currentView === 'dashboard';
  
  return (
    <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg shadow w-full">
      {showTabs && (
        <div className="border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
          <nav className="-mb-px flex space-x-4 md:space-x-6 min-w-max" aria-label="Tabs">
             <TabButton name="Cierres Pendientes" tab="closings" activeTab={activeTab} onClick={setActiveTab} />
             <TabButton name="Conflictos" tab="conflicts" activeTab={activeTab} onClick={setActiveTab} />
             <TabButton name="Stock Inicial" tab="stock" activeTab={activeTab} onClick={setActiveTab} />
            <TabButton name="Asignar Inventario" tab="inventory" activeTab={activeTab} onClick={setActiveTab} />
            <TabButton name="Productos" tab="products" activeTab={activeTab} onClick={setActiveTab} />
            <TabButton name="Gestores" tab="gestores" activeTab={activeTab} onClick={setActiveTab} />
            <TabButton name="Tipo de Cambio" tab="rate" activeTab={activeTab} onClick={setActiveTab} />
          </nav>
        </div>
      )}
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

// --- REPORTS VIEW ---
interface ReportsViewProps {
  sales: MockDB['sales'];
  gestores: User[];
  products: Product[];
  assignedInventory: AssignedInventory[];
}

const ReportsView: React.FC<ReportsViewProps> = ({ sales, gestores, products, assignedInventory }) => {
  const presets = getPresetRanges();
  const [dateRange, setDateRange] = useState({
    start: presets.esteMes.start,
    end: presets.esteMes.end
  });


  const salesInPeriod = useMemo(() => {
    const isValidDate = (d: any) => d instanceof Date && !isNaN(d.getTime());
    const filtered = sales.filter(s => {
      const targetDate = isValidDate(s.accountingDate) ? s.accountingDate as Date : s.soldAt;
      const isInRange = targetDate.getTime() >= dateRange.start.getTime() && targetDate.getTime() <= dateRange.end.getTime();
      return isInRange;
    });
    return filtered;
  }, [sales, dateRange]);

  const previousPeriodSales = useMemo(() => {
    const daysDiff = Math.ceil((dateRange.end.getTime() - dateRange.start.getTime()) / (1000 * 60 * 60 * 24));
    const previousStart = addDays(dateRange.start, -daysDiff);
    const previousEnd = dateRange.start;
    return sales.filter(s => s.soldAt >= previousStart && s.soldAt < previousEnd);
  }, [sales, dateRange]);

  const totalSales = salesInPeriod.length;
  const totalFinalMN = salesInPeriod.reduce((sum, s) => sum + s.finalMN, 0);
  const totalCommission = salesInPeriod.reduce((sum, s) => sum + s.commission, 0);

  const previousTotalSales = previousPeriodSales.length;
  const previousTotalFinalMN = previousPeriodSales.reduce((sum, s) => sum + s.finalMN, 0);

  const growthRate = {
    sales: previousTotalSales > 0 ? ((totalSales - previousTotalSales) / previousTotalSales) * 100 : 0,
    amount: previousTotalFinalMN > 0 ? ((totalFinalMN - previousTotalFinalMN) / previousTotalFinalMN) * 100 : 0
  };

  const salesByGestor = useMemo(() => {
    const result = gestores.map(gestor => {
      const gestorSalesInPeriod = salesInPeriod.filter(s => s.gestorId === gestor.id);
      const totalSalesCount = gestorSalesInPeriod.length;
      const totalFinalMNGestor = gestorSalesInPeriod.reduce((sum, s) => sum + s.finalMN, 0);
      const totalBaseMNGestor = gestorSalesInPeriod.reduce((sum, s) => sum + s.baseMN + (s.transferSurchargeAmount || 0), 0);
      const totalCommissionGestor = gestorSalesInPeriod.reduce((sum, s) => sum + s.commission, 0);

      return {
        gestorName: gestor.name,
        totalSales: totalSalesCount,
        totalFinalMN: totalFinalMNGestor,
        totalBaseMN: totalBaseMNGestor,
        totalCommission: totalCommissionGestor,
      };
    }).sort((a, b) => b.totalFinalMN - a.totalFinalMN);

    return result;
  }, [gestores, salesInPeriod]);

  const productsByQuantity = useMemo(() => {
    const productSales: Record<string, { quantity: number; totalAmount: number }> = {};
    const productsById = Object.fromEntries(products.map(p => [p.id, p.name]));

    salesInPeriod.forEach(sale => {
      const assignedInv = assignedInventory.find(ai => sale.inventoryItemId.startsWith(ai.id));
      if (assignedInv && sale.productId) {
        if (!productSales[sale.productId]) {
          productSales[sale.productId] = { quantity: 0, totalAmount: 0 };
        }
        productSales[sale.productId].quantity += 1;
        productSales[sale.productId].totalAmount += sale.finalMN;
      }
    });

    return Object.entries(productSales)
      .map(([productId, data]) => ({
        productId,
        productName: productsById[productId] || 'Producto desconocido',
        quantity: data.quantity,
        totalAmount: data.totalAmount
      }))
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 10);
  }, [salesInPeriod, assignedInventory, products]);

  const topGestors = salesByGestor.slice(0, 5);

  const getPeriodLabel = () => {
    return `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`;
  };

  const handleExportCSV = () => {
    const data = salesByGestor.map(g => ({
      Gestor: g.gestorName,
      Ventas: g.totalSales,
      TotalVendido: g.totalFinalMN,
      BaseAPagar: g.totalBaseMN,
      Comision: g.totalCommission
    }));
    exportToCSV(data, `reporte_manager_${getPeriodLabel()}`);
  };

  const handleExportPDF = () => {
    const data = salesByGestor.map(g => ({
      Gestor: g.gestorName,
      Ventas: g.totalSales,
      Total: g.totalFinalMN,
      Base: g.totalBaseMN,
      Comisión: g.totalCommission
    }));
    exportToPDF(data, `Reporte de Ventas por Gestor (${getPeriodLabel()})`, `reporte_manager_${getPeriodLabel()}`);
  };

  const handleExportExcel = () => {
    const data = salesByGestor.map(g => ({
      Gestor: g.gestorName,
      Ventas: g.totalSales,
      TotalVendido: g.totalFinalMN,
      BaseAPagar: g.totalBaseMN,
      Comision: g.totalCommission
    }));
    exportToExcel(data, 'Ventas por Gestor', `reporte_manager_${getPeriodLabel()}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <DateRangeSelector value={dateRange} onChange={setDateRange} />
        <ExportButton
          onExportCSV={handleExportCSV}
          onExportPDF={handleExportPDF}
          onExportExcel={handleExportExcel}
          disabled={salesInPeriod.length === 0}
          filename={`reporte_manager_${formatDate(new Date())}`}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <ReportCard
          title="Ventas"
          value={totalSales}
          icon="shopping_cart"
          trend={{
            value: Math.round(growthRate.sales),
            positive: growthRate.sales >= 0,
            label: 'Período anterior'
          }}
        />
        <ReportCard
          title="Total Vendido"
          value={formatCurrency(totalFinalMN)}
          icon="payments"
          trend={{
            value: Math.round(growthRate.amount),
            positive: growthRate.amount >= 0,
            label: 'Período anterior'
          }}
        />
        <ReportCard
          title="Comisión Total"
          value={formatCurrency(totalCommission)}
          icon="account_balance"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-amber-600">emoji_events</span>
            Top Gestores
          </h3>
          <div className="space-y-3">
            {topGestors.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No hay datos en el período seleccionado</p>
            ) : (
              topGestors.map((gestor, index) => (
                <div key={gestor.gestorName} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white text-sm ${
                      index === 0 ? 'bg-amber-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-amber-700' : 'bg-slate-300'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{gestor.gestorName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{gestor.totalSales} ventas</p>
                    </div>
                  </div>
                  <p className="font-bold text-primary-600 dark:text-primary-400">{formatCurrency(gestor.totalFinalMN)}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-blue-600">inventory_2</span>
            Productos Más Vendidos
          </h3>
          <div className="space-y-3">
            {productsByQuantity.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No hay datos en el período seleccionado</p>
            ) : (
              productsByQuantity.map((product, index) => (
                <div key={product.productId} className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <span className="material-symbols-outlined text-blue-600 text-sm">inventory</span>
                    </div>
                    <div>
                      <p className="font-medium text-slate-900 dark:text-white">{product.productName}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{product.quantity} vendidos</p>
                    </div>
                  </div>
                  <p className="font-bold text-success-600 dark:text-success-400">{formatCurrency(product.totalAmount)}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-lg font-bold mb-4">Ventas por Gestor Detallado</h3>
        {salesByGestor.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg">
            <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">trending_down</span>
            <p className="text-slate-500 dark:text-slate-400">No hay ventas en el período seleccionado</p>
          </div>
        ) : (
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
              <tfoot className="bg-slate-50 dark:bg-slate-700">
                <tr>
                  <td className="px-6 py-4 text-left text-sm font-bold text-slate-900 dark:text-white">TOTAL</td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white">{totalSales}</td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-info-600 dark:text-info-400">{formatCurrency(totalFinalMN)}</td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-primary-600 dark:text-primary-400">{formatCurrency(totalFinalMN - totalCommission)}</td>
                  <td className="px-6 py-4 text-right text-sm font-bold text-success-600 dark:text-success-400">{formatCurrency(totalCommission)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};


// --- CIERRES VIEW ---
const ClosingsView: React.FC<{closings: Closing[], users: User[], onValidate: (id: string) => void, validatingId: string | null}> = ({ closings, users, onValidate, validatingId }) => {
  const pendingClosings = closings.filter(c => c.status === ClosingStatus.PENDING);
  const usersById = Object.fromEntries(users.map(u => [u.id, u]));


  return (
    <div>
      <h3 className="text-base md:text-lg font-bold mb-4">Cierres Pendientes de Validación</h3>
      <div className="space-y-4">
        {pendingClosings.length > 0 ? pendingClosings.map(c => (
          <div key={c.id} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-lg flex justify-between items-center">
            <div>
              <p className="font-semibold">{usersById[c.gestorId]?.name || 'Usuario desconocido'}</p>
              <p className="text-sm text-slate-500">Iniciado: {new Date(c.initiatedAt).toLocaleString()}</p>
              <p className="font-bold text-info-600 dark:text-info-400 mt-1">Monto a Recibir: {formatCurrency(c.totalBaseMN)}</p>
            </div>
            <Button onClick={() => onValidate(c.id)} isLoading={validatingId === c.id} disabled={validatingId !== null} variant="primary" size="sm">
              Validar Recepción
            </Button>
          </div>
        )) : <p className="text-slate-500">No hay cierres pendientes.</p>}
      </div>
    </div>
  );
};

// --- EXCHANGE RATE VIEW ---
const ExchangeRateView: React.FC<{ store: Store; onSetExchangeRate: (rate: number, startDate: Date) => void }> = ({ store, onSetExchangeRate }) => {
  const [newRate, setNewRate] = useState<string>('');
  const today = new Date();
  const [effectiveDate, setEffectiveDate] = useState<string>(`${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`); // Default to today
  const [isUpdatingRate, setIsUpdatingRate] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const rate = parseFloat(newRate);
    if (isNaN(rate) || rate <= 0) {
      alert('Por favor, introduce un tipo de cambio válido y positivo.');
      return;
    }
    setIsUpdatingRate(true);
    try {
      await onSetExchangeRate(rate, new Date(effectiveDate));
      setNewRate('');
    } finally {
      setIsUpdatingRate(false);
    }
  };

  return (
    <div>
      <h3 className="text-base md:text-lg font-bold mb-4">Configurar Tipo de Cambio (USD a MN)</h3>
      <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4 mb-6 md:mb-8">
        <div>
          <label htmlFor="newRate" className="block text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400">Nuevo Tipo de Cambio (MN por USD)</label>
          <input
            id="newRate"
            type="number"
            step="0.01"
            value={newRate}
            onChange={(e) => setNewRate(e.target.value)}
            className="mt-1 block w-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 text-xs md:text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
            placeholder="Ej: 300.50"
          />
        </div>
        <div>
          <label htmlFor="effectiveDate" className="block text-xs md:text-sm font-medium text-slate-600 dark:text-slate-400">Fecha de Vigencia (desde)</label>
          <input
            id="effectiveDate"
            type="date"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            className="mt-1 block w-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 text-xs md:text-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500"
          />
        </div>
        <Button type="submit" variant="primary" fullWidth isLoading={isUpdatingRate} disabled={isUpdatingRate} className="text-xs md:text-sm">
          Actualizar Tipo de Cambio
        </Button>
      </form>

      <h4 className="font-bold text-base md:text-lg mb-2 md:mb-3">Historial de Tipos de Cambio</h4>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Tasa</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vigente Desde</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Vigente Hasta</th>
            </tr>
          </thead>
          <tbody className="bg-slate-50 dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
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
  const [isAddingGestor, setIsAddingGestor] = useState(false);
  const [isUpdatingGestor, setIsUpdatingGestor] = useState(false);
  const [isDeletingGestor, setIsDeletingGestor] = useState<string | null>(null);
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

    setIsAddingGestor(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users`, {
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
    } finally {
      setIsAddingGestor(false);
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

    setIsUpdatingGestor(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${editingGestor.id}`, {
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
    } finally {
      setIsUpdatingGestor(false);
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

    setIsDeletingGestor(gestorId);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/users/${gestorId}`, {
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
    } finally {
      setIsDeletingGestor(null);
    }
  };

  const cancelEdit = () => {
    setEditingGestor(null);
    setEditingName('');
    setEditingPassword('');
  };

  return (
    <div>
      <h3 className="text-base md:text-lg font-bold mb-4">Gestionar Gestores</h3>

      {/* Edit Gestor Modal */}
      {editingGestor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">Editar Gestor</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Nombre de usuario</label>
                <input
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  className="w-full bg-slate-200 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Nueva contraseña (opcional)</label>
                <input
                  type="password"
                  value={editingPassword}
                  onChange={e => setEditingPassword(e.target.value)}
                  placeholder="Dejar vacío para no cambiar"
                  className="w-full bg-slate-200 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600 text-sm"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="neutral" onClick={cancelEdit} disabled={isUpdatingGestor}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" isLoading={isUpdatingGestor} disabled={isUpdatingGestor}>
                  Guardar Cambios
                </Button>
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
          className="w-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm p-2 text-sm"
        />
        <input
          type="password"
          value={password}
          onChange={e => setPassword(e.target.value)}
          placeholder="Contraseña"
          className="w-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm p-2 text-sm"
        />
        <Button type="submit" variant="primary" size="md" isLoading={isAddingGestor} disabled={isAddingGestor} className="md:col-span-2">Agregar</Button>
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
                  <span className="ml-2 text-xs px-2 py-0.5 bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 rounded-md">
                    Tiene inventario asignado
                  </span>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="neutral"
                  size="xs"
                  onClick={() => handleEdit(g)}
                  disabled={hasInventory || isDeletingGestor !== null}
                >
                  Editar
                </Button>
                <Button
                  variant="danger"
                  size="xs"
                  onClick={() => handleDelete(g.id)}
                  isLoading={isDeletingGestor === g.id}
                  disabled={hasInventory || isDeletingGestor !== null}
                >
                  Eliminar
                </Button>
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
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isUpdatingProduct, setIsUpdatingProduct] = useState(false);
  const [isDeletingProduct, setIsDeletingProduct] = useState<string | null>(null);

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

    setIsAddingProduct(true);
    const parsedMargin = parseFloat(margin) / 100;
    let priceMN: number;
    let gestorCommissionMN: number;

    const SYSTEM_DEFAULT_COMMISSION = 0;
    const commissionRate = commission.trim() ? parseFloat(commission) / 100 : SYSTEM_DEFAULT_COMMISSION;
 
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
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products`, {
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
    } finally {
      setIsAddingProduct(false);
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

    setIsUpdatingProduct(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${editingProduct.id}`, {
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
          commissionRate: editingCommission.trim() ? parseFloat(editingCommission) / 100 : 0,
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
    } finally {
      setIsUpdatingProduct(false);
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

    setIsDeletingProduct(productId);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/products/${productId}`, {
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
    } finally {
      setIsDeletingProduct(null);
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
      <h3 className="text-base md:text-lg font-bold mb-4">Gestionar Productos</h3>
       {currency === 'USD' && !currentExchangeRate && (
        <div className="mb-4 p-3 bg-warning-50 dark:bg-warning-900/20 border border-warning-200 dark:border-warning-800 rounded-md">
          <p className="text-warning-800 dark:text-warning-200 text-sm font-medium">
            ⚠️ No hay un tipo de cambio vigente. Configure uno en la pestaña "Tipo de Cambio" para agregar productos en USD.
          </p>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">Editar Producto</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Moneda</label>
                <select
                  value={editingCurrency}
                  onChange={e => setEditingCurrency(e.target.value as 'USD' | 'MN')}
                  className="w-full bg-slate-200 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600 text-sm"
                >
                  <option value="USD">USD</option>
                  <option value="MN">MN</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Nombre</label>
                <input
                  value={editingName}
                  onChange={e => setEditingName(e.target.value)}
                  className="w-full bg-slate-200 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Costo ({editingCurrency})
                </label>
                <input
                  value={editingCost}
                  onChange={e => setEditingCost(e.target.value)}
                  type="number"
                  placeholder={`Costo (${editingCurrency})`}
                  className="w-full bg-slate-200 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Margen (%)</label>
                <input
                  value={editingMargin}
                  onChange={e => setEditingMargin(e.target.value)}
                  type="number"
                  className="w-full bg-slate-200 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">
                  Comisión gestor %
                </label>
                <input
                  value={editingCommission}
                  onChange={e => setEditingCommission(e.target.value)}
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  placeholder="Comisión gestor % (default: 0%)"
                  className="w-full bg-slate-200 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600 text-sm"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="neutral" onClick={cancelEdit} disabled={isUpdatingProduct}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" isLoading={isUpdatingProduct} disabled={isUpdatingProduct}>
                  Guardar Cambios
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

        <form onSubmit={handleAdd} className="grid grid-cols-1 md:grid-cols-6 gap-3 mb-6 items-end">
          <select value={currency} onChange={e => setCurrency(e.target.value as 'USD' | 'MN')} className="w-full bg-slate-200 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600 text-sm">
            <option value="USD">USD</option>
            <option value="MN">MN</option>
          </select>
          <input value={name} onChange={e => setName(e.target.value)} placeholder="Nombre" className="w-full bg-slate-200 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600 text-sm"/>
          {currency === 'USD' ? (
            <input value={cost} onChange={e => setCost(e.target.value)} placeholder="Costo (USD)" type="number" className="w-full bg-slate-200 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600 text-sm"/>
          ) : (
            <input value={cost} onChange={e => setCost(e.target.value)} placeholder="Costo (MN)" type="number" className="w-full bg-slate-200 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600 text-sm"/>
          )}
          <input value={margin} onChange={e => setMargin(e.target.value)} placeholder="Margen (%)" type="number" className="w-full bg-slate-200 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600 text-sm"/>
          <input
            value={commission}
            onChange={e => setCommission(e.target.value)}
            placeholder="Comisión gestor % (default: 0%)"
            type="number"
            min="0"
            max="100"
            step="0.1"
            className="w-full bg-slate-200 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600 text-sm"
          />
          <Button type="submit" variant="primary" isLoading={isAddingProduct} disabled={(currency === 'USD' && !currentExchangeRate) || isAddingProduct}>Agregar Producto</Button>
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
                    <span className="ml-2 text-xs px-2 py-0.5 bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 rounded-md">
                      Asignado a gestor
                    </span>
                  )}
                </div>
                <div className="text-right">
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    Costo: {p.currency === 'MN' ? `${formatCurrency(p.costMN || 0)}` : `$${p.costUSD}`} | Margen: {(p.margin*100).toFixed(1)}% | Comisión gestor: {commissionLabel}
                  </div>
                  {p.priceMN ? (
                    <div className="text-base font-bold text-primary-600 dark:text-primary-400">
                      Precio: {formatCurrency(p.priceMN)}
                    </div>
                  ) : currentExchangeRate && (
                    <div className="text-base font-bold text-primary-600 dark:text-primary-400">
                      Precio: {formatCurrency(prices.finalMN)}
                    </div>
                  )}
                  <div className="flex gap-2 justify-end mt-2">
                    <Button
                      variant="neutral"
                      size="xs"
                      onClick={() => handleEdit(p)}
                      disabled={assigned || isDeletingProduct !== null}
                    >
                      Editar
                    </Button>
                    <Button
                      variant="danger"
                      size="xs"
                      onClick={() => handleDelete(p.id)}
                      isLoading={isDeletingProduct === p.id}
                      disabled={assigned || isDeletingProduct !== null}
                    >
                      Eliminar
                    </Button>
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
  const [isSettingStock, setIsSettingStock] = useState(false);
  const [isUpdatingStock, setIsUpdatingStock] = useState(false);
  const [isDeletingStock, setIsDeletingStock] = useState<string | null>(null);
  const storeProducts = db.products.filter(p => p.storeId === store.id);

  const handleSetStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || quantity < 0) return;

    setIsSettingStock(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/product-stock`, {
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
    } finally {
      setIsSettingStock(false);
    }
  };

  const handleEditStock = (stock: any) => {
    setEditingStock(stock);
    setEditingQuantity(stock.quantity);
  };

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStock || editingQuantity < 0) return;

    setIsUpdatingStock(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/product-stock`, {
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
    } finally {
      setIsUpdatingStock(false);
    }
  };

  const handleDeleteStock = async (stockId: string, productId: string) => {
    if (!confirm('¿Estás seguro de que deseas eliminar este registro de stock?')) {
      return;
    }

    setIsDeletingStock(stockId);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/product-stock/${stockId}?productId=${productId}&storeId=${store.id}`, {
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
    } finally {
      setIsDeletingStock(null);
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
      <h3 className="text-base md:text-lg font-bold mb-4">Gestión de Stock Inicial</h3>

      {/* Edit Stock Modal */}
      {editingStock && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-slate-50 dark:bg-slate-800 rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4">Editar Stock</h3>
            <form onSubmit={handleUpdateStock} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Producto</label>
                <input
                  value={db.products.find(p => p.id === editingStock.productId)?.name || ''}
                  disabled
                  className="w-full bg-slate-200 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600 opacity-60 text-sm"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">Cantidad</label>
                <input
                  value={editingQuantity}
                  onChange={e => setEditingQuantity(parseInt(e.target.value) || 0)}
                  type="number"
                  min="0"
                  className="w-full bg-slate-200 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600 text-sm"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <Button type="button" variant="neutral" onClick={cancelEditStock} disabled={isUpdatingStock}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" isLoading={isUpdatingStock} disabled={isUpdatingStock}>
                  Guardar
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      <form onSubmit={handleSetStock} className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 items-end">
        <select
          value={productId}
          onChange={e => setProductId(e.target.value)}
          className="w-full bg-slate-200 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600 text-sm"
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
          className="w-full bg-slate-200 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600 text-sm"
        />
        <Button type="submit" variant="primary" isLoading={isSettingStock} disabled={isSettingStock}>Actualizar Stock</Button>
      </form>

      {/* Current stock list */}
      <h4 className="font-bold mt-4 md:mt-6 mb-2 text-sm md:text-base">Stock Actual</h4>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cantidad Disponible</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-slate-50 dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {storeStock.length > 0 ? storeStock.map(stock => {
              const product = db.products.find(p => p.id === stock.productId);
              const isAssigned = isStockAssignedToGestor(stock.id);
              return (
                <tr key={stock.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">
                    <div className="flex items-center gap-2">
                      <span>{product?.name || 'Producto desconocido'}</span>
                      {isAssigned && (
                        <span className="text-xs px-2 py-0.5 bg-warning-100 dark:bg-warning-900/30 text-warning-700 dark:text-warning-300 rounded-md">
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
                      <Button
                        variant="neutral"
                        size="xs"
                        onClick={() => handleEditStock(stock)}
                        disabled={isDeletingStock !== null}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="danger"
                        size="xs"
                        onClick={() => handleDeleteStock(stock.id, stock.productId)}
                        isLoading={isDeletingStock === stock.id}
                        disabled={isDeletingStock !== null}
                      >
                        Eliminar
                      </Button>
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
  const [isAssigning, setIsAssigning] = useState(false);
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

    setIsAssigning(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/assigned-inventory`, {
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
    } finally {
      setIsAssigning(false);
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
      <h3 className="text-base md:text-lg font-bold mb-4">Asignar Inventario a Gestores</h3>
      <form onSubmit={handleAssign} className="grid grid-cols-1 md:grid-cols-4 gap-2 md:gap-3 mb-4 md:mb-6 items-end">
        <select value={productId} onChange={e => setProductId(e.target.value)} className="w-full bg-slate-200 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600 text-sm"><option value="">Seleccionar producto</option>{storeProducts.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select value={gestorId} onChange={e => setGestorId(e.target.value)} className="w-full bg-slate-200 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600 text-sm"><option value="">Seleccionar gestor</option>{storeGestores.map(g=><option key={g.id} value={g.id}>{g.name}</option>)}</select>
        <input value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 1)} type="number" min="1" placeholder="Cantidad" className="w-full bg-slate-200 dark:bg-slate-700 p-2 rounded-md border border-slate-300 dark:border-slate-600 text-sm"/>
        <Button type="submit" variant="primary" size="md" isLoading={isAssigning} disabled={isAssigning}>Asignar</Button>
       </form>
       {/* Pending inventory list */}
       <h4 className="font-bold mt-4 md:mt-6 mb-2 text-sm md:text-base">Inventario Pendiente de Aceptación</h4>
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
           <tbody className="bg-slate-50 dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-warning-600 dark:text-warning-400">
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
        <h4 className="font-bold mt-4 md:mt-6 mb-2 text-sm md:text-base">Inventario Confirmado</h4>
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
           <tbody className="bg-slate-50 dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
              {Object.keys(groupedAssignedInventory).length > 0 ? (Object.values(groupedAssignedInventory) as InventoryGroup[]).map((group, idx) => (
                <tr key={idx}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">
                    {group.product?.name || 'Producto desconocido'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                    {group.gestor?.name || 'Gestor desconocido'}
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                     {group.priceMN !== undefined && group.priceMN !== null ? formatCurrency(group.priceMN) : 'N/A'}
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
const ConflictsView: React.FC<{conflicts: InventoryConflict[], products: Product[], refreshDb: () => Promise<void>}> = ({ conflicts, products, refreshDb }) => {
  const productsById = Object.fromEntries(products.map(p => [p.id, p]));
  const [resolvingConflictId, setResolvingConflictId] = useState<string | null>(null);

  const handleResolve = async (conflictId: string, action: 'resolve' | 'cancel') => {
    let newQuantity = 0;
    if (action === 'resolve') {
      const input = prompt('Ingresa la cantidad corregida para esta asignación:');
      if (input === null) return;
      newQuantity = parseInt(input);
      if (isNaN(newQuantity) || newQuantity < 0) {
        alert('Cantidad inválida.');
        return;
      }
    }

    setResolvingConflictId(conflictId);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/inventory-conflicts/${conflictId}/resolve`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ action, newQuantity })
      });

      if (response.ok) {
        await refreshDb();
        alert('Conflicto resuelto exitosamente.');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error resolving conflict:', error);
      alert('Error al resolver el conflicto.');
    } finally {
      setResolvingConflictId(null);
    }
  };

  return (
    <div>
      <h3 className="text-base md:text-lg font-bold mb-4">Conflictos de Inventario (Asignaciones Rechazadas)</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead className="bg-slate-50 dark:bg-slate-700">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Gestor</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Producto</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Cantidad</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Razón</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider">Acciones</th>
            </tr>
          </thead>
          <tbody className="bg-slate-50 dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
            {conflicts.length > 0 ? conflicts.map(conflict => (
              <tr key={conflict.id} className="hover:bg-warning-50 dark:hover:bg-warning-900/10">
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                  {conflict.createdAt ? new Date(conflict.createdAt).toLocaleString() : 'N/A'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">
                  {conflict.gestorName || 'Gestor desconocido'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                  {conflict.productName || productsById[conflict.productId]?.name || 'Producto desconocido'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                  {conflict.quantity}
                </td>
                <td className="px-6 py-4 text-sm text-warning-600 dark:text-warning-400 max-w-xs">
                  {conflict.reason}
                </td>
                <td className="px-6 py-4 text-center whitespace-nowrap">
                  {conflict.status === 'Pending' ? (
                    <div className="flex gap-2 justify-center">
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() => handleResolve(conflict.id, 'resolve')}
                        isLoading={resolvingConflictId === conflict.id}
                        disabled={resolvingConflictId !== null}
                      >
                        Reasignar
                      </Button>
                      <Button
                        variant="danger"
                        size="xs"
                        onClick={() => handleResolve(conflict.id, 'cancel')}
                        isLoading={resolvingConflictId === conflict.id}
                        disabled={resolvingConflictId !== null}
                      >
                        Cancelar
                      </Button>
                    </div>
                  ) : (
                    <span className="text-green-600 dark:text-green-400 text-xs font-bold uppercase">Resuelto</span>
                  )}
                </td>
              </tr>
            )) : (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-slate-500">No hay conflictos de inventario.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// --- CLOSINGS REPORT VIEW ---
interface ClosingMetrics {
  closing: Closing;
  gestorName: string;
  ventas: number;
  costoProductosMN: number;
  gananciaTiendaMN: number;
  comisionGestorMN: number;
  totalVendidoMN: number;
  margenPorcentaje: number;
}

const ClosingsReportView: React.FC<{
  closings: Closing[];
  users: User[];
  products: Product[];
  assignedInventory: AssignedInventory[];
}> = ({ closings, users, products, assignedInventory }) => {
  const presets = getPresetRanges();
  const [dateRange, setDateRange] = useState({
    start: presets.esteMes.start,
    end: presets.esteMes.end
  });
  const [viewMode, setViewMode] = useState<'por-cierre' | 'por-gestor'>('por-cierre');

  const usersById = Object.fromEntries(users.map(u => [u.id, u]));

  const filteredClosings = useMemo(() => {
    const isValidDate = (d: any) => d instanceof Date && !isNaN(d.getTime());
    
    // Normalize date to YYYY-MM-DD string for comparison
    const normalizeDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const normalizedStart = normalizeDate(dateRange.start);
    const normalizedEnd = normalizeDate(dateRange.end);
    
    return closings.filter(c => {
      // accountingDate comes as YYYY-MM-DD string from backend
      let targetDateStr: string;
      
      if (typeof c.accountingDate === 'string' && c.accountingDate.length === 10) {
        // It's already a YYYY-MM-DD string
        targetDateStr = c.accountingDate;
      } else if (isValidDate(c.accountingDate)) {
        // It's a Date object (fallback)
        const d = c.accountingDate as Date;
        targetDateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      } else {
        // Fallback to completedAt or initiatedAt
        const fallbackDate = c.completedAt || c.initiatedAt;
        targetDateStr = normalizeDate(fallbackDate);
      }
      
      return c.status === ClosingStatus.COMPLETED &&
             targetDateStr >= normalizedStart && 
             targetDateStr <= normalizedEnd;
    });
  }, [closings, dateRange]);

  const closingMetrics = useMemo(() => {
    return filteredClosings.map(closing => {
      const gestorName = usersById[closing.gestorId]?.name || 'Desconocido';
      
      const costoProductosMN = closing.sales.reduce((sum, sale) => {
        if (sale.costUSD && sale.costUSD > 0 && sale.exchangeRateUsed > 0) {
          return sum + (sale.costUSD * sale.exchangeRateUsed);
        }
        if (sale.costMN && sale.costMN > 0) {
          return sum + sale.costMN;
        }
        const baseMN = sale.finalMN - sale.commission;
        const calculatedCost = sale.margin > 0 ? baseMN / (1 + sale.margin) : baseMN;
        return sum + calculatedCost;
      }, 0);
      
      const gananciaTiendaMN = closing.totalFinalMN - costoProductosMN - closing.totalCommission;
      const margenPorcentaje = (gananciaTiendaMN / closing.totalFinalMN) * 100;
      
      return {
        closing,
        gestorName,
        ventas: closing.sales.length,
        costoProductosMN,
        gananciaTiendaMN,
        comisionGestorMN: closing.totalCommission,
        totalVendidoMN: closing.totalFinalMN,
        margenPorcentaje
      };
    });
  }, [filteredClosings, usersById]);

  const totals = useMemo(() => {
    const totals = closingMetrics.reduce((acc, m) => ({
      cantidadCierres: acc.cantidadCierres + 1,
      totalVentas: acc.totalVentas + m.ventas,
      costoProductosMN: acc.costoProductosMN + m.costoProductosMN,
      gananciaTiendaMN: acc.gananciaTiendaMN + m.gananciaTiendaMN,
      comisionGestorMN: acc.comisionGestorMN + m.comisionGestorMN,
      totalVendidoMN: acc.totalVendidoMN + m.totalVendidoMN
    }), {
      cantidadCierres: 0,
      totalVentas: 0,
      costoProductosMN: 0,
      gananciaTiendaMN: 0,
      comisionGestorMN: 0,
      totalVendidoMN: 0
    });
    
    return {
      ...totals,
      margenPromedio: totals.totalVendidoMN > 0 ? (totals.gananciaTiendaMN / totals.totalVendidoMN) * 100 : 0
    };
  }, [closingMetrics]);

  const metricsByGestor = useMemo(() => {
    const grouped: Record<string, ClosingMetrics[]> = {};
    
    closingMetrics.forEach(metric => {
      const key = metric.gestorName;
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(metric);
    });
    
    return Object.entries(grouped).map(([gestorName, metrics]) => {
      const aggregates = metrics.reduce((acc, m) => ({
        cantidadCierres: acc.cantidadCierres + 1,
        ventas: acc.ventas + m.ventas,
        costoProductosMN: acc.costoProductosMN + m.costoProductosMN,
        gananciaTiendaMN: acc.gananciaTiendaMN + m.gananciaTiendaMN,
        comisionGestorMN: acc.comisionGestorMN + m.comisionGestorMN,
        totalVendidoMN: acc.totalVendidoMN + m.totalVendidoMN
      }), {
        cantidadCierres: 0,
        ventas: 0,
        costoProductosMN: 0,
        gananciaTiendaMN: 0,
        comisionGestorMN: 0,
        totalVendidoMN: 0
      });
      
      const margenPorcentaje = aggregates.totalVendidoMN > 0 
        ? (aggregates.gananciaTiendaMN / aggregates.totalVendidoMN) * 100 
        : 0;
      
      return {
        gestorName,
        ...aggregates,
        margenPorcentaje
      };
    }).sort((a, b) => b.gananciaTiendaMN - a.gananciaTiendaMN);
  }, [closingMetrics]);

  const getPeriodLabel = () => {
    return `${formatDate(dateRange.start)} - ${formatDate(dateRange.end)}`;
  };

  const handleExportCSV = () => {
    const data = viewMode === 'por-cierre'
      ? closingMetrics.map(m => ({
          Fecha: formatDate(new Date(m.closing.completedAt!)),
          Gestor: m.gestorName,
          Ventas: m.ventas,
          CostoProductosMN: m.costoProductosMN,
          GananciaTiendaMN: m.gananciaTiendaMN,
          ComisionGestorMN: m.comisionGestorMN,
          TotalVendidoMN: m.totalVendidoMN,
          MargenPorcentaje: m.margenPorcentaje.toFixed(2) + '%'
        }))
      : metricsByGestor.map(m => ({
          Gestor: m.gestorName,
          Cierres: m.cantidadCierres,
          Ventas: m.ventas,
          CostoProductosMN: m.costoProductosMN,
          GananciaTiendaMN: m.gananciaTiendaMN,
          ComisionGestorMN: m.comisionGestorMN,
          TotalVendidoMN: m.totalVendidoMN,
          MargenPorcentaje: m.margenPorcentaje.toFixed(2) + '%'
        }));
    exportToCSV(data, `reporte_cierres_${getPeriodLabel()}`);
  };

  const handleExportPDF = () => {
    const data = viewMode === 'por-cierre'
      ? closingMetrics.map(m => ({
          Fecha: formatDate(new Date(m.closing.completedAt!)),
          Gestor: m.gestorName,
          Ventas: m.ventas,
          Costo: m.costoProductosMN,
          Ganancia: m.gananciaTiendaMN,
          Comisión: m.comisionGestorMN,
          Total: m.totalVendidoMN,
          Margen: m.margenPorcentaje.toFixed(2) + '%'
        }))
      : metricsByGestor.map(m => ({
          Gestor: m.gestorName,
          Cierres: m.cantidadCierres,
          Ventas: m.ventas,
          Costo: m.costoProductosMN,
          Ganancia: m.gananciaTiendaMN,
          Comisión: m.comisionGestorMN,
          Total: m.totalVendidoMN,
          Margen: m.margenPorcentaje.toFixed(2) + '%'
        }));
    exportToPDF(data, `Reporte de Cierres (${getPeriodLabel()})`, `reporte_cierres_${getPeriodLabel()}`);
  };

  const handleExportExcel = () => {
    const data = viewMode === 'por-cierre'
      ? closingMetrics.map(m => ({
          Fecha: formatDate(new Date(m.closing.completedAt!)),
          Gestor: m.gestorName,
          Ventas: m.ventas,
          CostoProductosMN: m.costoProductosMN,
          GananciaTiendaMN: m.gananciaTiendaMN,
          ComisionGestorMN: m.comisionGestorMN,
          TotalVendidoMN: m.totalVendidoMN,
          MargenPorcentaje: m.margenPorcentaje.toFixed(2) + '%'
        }))
      : metricsByGestor.map(m => ({
          Gestor: m.gestorName,
          Cierres: m.cantidadCierres,
          Ventas: m.ventas,
          CostoProductosMN: m.costoProductosMN,
          GananciaTiendaMN: m.gananciaTiendaMN,
          ComisionGestorMN: m.comisionGestorMN,
          TotalVendidoMN: m.totalVendidoMN,
          MargenPorcentaje: m.margenPorcentaje.toFixed(2) + '%'
        }));
    exportToExcel(data, 'Cierres', `reporte_cierres_${getPeriodLabel()}`);
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
          filename={`reporte_cierres_${formatDate(new Date())}`}
        />
      </div>

      <div className="border-b border-slate-200 dark:border-slate-700">
        <nav className="-mb-px flex space-x-4">
          <button
            onClick={() => setViewMode('por-cierre')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              viewMode === 'por-cierre'
                ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'
            }`}
          >
            Por Cierre
          </button>
          <button
            onClick={() => setViewMode('por-gestor')}
            className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
              viewMode === 'por-gestor'
                ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400'
                : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:border-slate-600'
            }`}
          >
            Por Gestor
          </button>
        </nav>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <ReportCard
          title="Cierres"
          value={totals.cantidadCierres}
          icon="receipt"
        />
        <ReportCard
          title="Costo Productos"
          value={formatCurrency(totals.costoProductosMN)}
          icon="inventory_2"
        />
        <ReportCard
          title="Ganancia Tienda"
          value={formatCurrency(totals.gananciaTiendaMN)}
          icon="trending_up"
        />
        <ReportCard
          title="Margen Promedio"
          value={totals.margenPromedio.toFixed(1) + '%'}
          icon="percent"
        />
      </div>

      {viewMode === 'por-cierre' && (
        <div>
          <h3 className="text-lg font-bold mb-4">Cierres Detallados</h3>
          {closingMetrics.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">event_busy</span>
              <p className="text-slate-500 dark:text-slate-400">No hay cierres en el período seleccionado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha Contable</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Fecha Real</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Gestor</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Ventas</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Costo Prod (MN)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Ganancia (MN)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Comisión (MN)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Total (MN)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Margen %</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  {closingMetrics.map((m, index) => (
                    <tr key={`${m.closing.id}-${index}`}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">
                        {m.closing.accountingDate ? formatAccountingDate(m.closing.accountingDate) : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-500 dark:text-slate-400">
                        {formatDateTime(new Date(m.closing.completedAt!))}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300">
                        {m.gestorName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300 text-right">
                        {m.ventas}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300 text-right">
                        {formatCurrency(m.costoProductosMN)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-success-600 dark:text-success-400 text-right">
                        {formatCurrency(m.gananciaTiendaMN)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300 text-right">
                        {formatCurrency(m.comisionGestorMN)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300 text-right">
                        {formatCurrency(m.totalVendidoMN)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300 text-right">
                        {m.margenPorcentaje.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <td className="px-6 py-4 text-left text-sm font-bold text-slate-900 dark:text-white" colSpan={3}>TOTAL</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white">{totals.totalVentas}</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(totals.costoProductosMN)}</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-success-600 dark:text-success-400">{formatCurrency(totals.gananciaTiendaMN)}</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(totals.comisionGestorMN)}</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-info-600 dark:text-info-400">{formatCurrency(totals.totalVendidoMN)}</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white">{totals.margenPromedio.toFixed(1)}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {viewMode === 'por-gestor' && (
        <div>
          <h3 className="text-lg font-bold mb-4">Agrupado por Gestor</h3>
          {metricsByGestor.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 dark:bg-slate-800 rounded-lg">
              <span className="material-symbols-outlined text-4xl text-slate-400 mb-2">group_off</span>
              <p className="text-slate-500 dark:text-slate-400">No hay datos en el período seleccionado</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                <thead className="bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Gestor</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Cierres</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Ventas</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Costo Prod (MN)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Ganancia (MN)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Comisión (MN)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Total (MN)</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">Margen %</th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-slate-800 divide-y divide-slate-200 dark:divide-slate-700">
                  {metricsByGestor.map((m) => (
                    <tr key={m.gestorName}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-slate-900 dark:text-slate-200">
                        {m.gestorName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300 text-right">
                        {m.cantidadCierres}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300 text-right">
                        {m.ventas}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300 text-right">
                        {formatCurrency(m.costoProductosMN)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-success-600 dark:text-success-400 text-right">
                        {formatCurrency(m.gananciaTiendaMN)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300 text-right">
                        {formatCurrency(m.comisionGestorMN)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300 text-right">
                        {formatCurrency(m.totalVendidoMN)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500 dark:text-slate-300 text-right">
                        {m.margenPorcentaje.toFixed(1)}%
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-slate-50 dark:bg-slate-700">
                  <tr>
                    <td className="px-6 py-4 text-left text-sm font-bold text-slate-900 dark:text-white">TOTAL</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white">{totals.cantidadCierres}</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white">{totals.totalVentas}</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(totals.costoProductosMN)}</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-success-600 dark:text-success-400">{formatCurrency(totals.gananciaTiendaMN)}</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(totals.comisionGestorMN)}</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-info-600 dark:text-info-400">{formatCurrency(totals.totalVendidoMN)}</td>
                    <td className="px-6 py-4 text-right text-sm font-bold text-slate-900 dark:text-white">{totals.margenPromedio.toFixed(1)}%</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ManagerDashboard;