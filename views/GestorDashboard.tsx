// views/GestorDashboard.tsx
import React, { useState, useMemo, useEffect } from 'react';
import { User, Store, MockDB, InventoryItem, Product, Role, Sale, ClosingStatus, Closing, AssignedInventory, InventoryConflict, InventoryGroup, ExchangeRate, SalePaymentStatus } from '../types';
import { calculateProductPrices, formatCurrency, getCurrentExchangeRate } from '../utils';
import SellModal from '../components/SellModal';
import Button from '../components/Button';
import DateRangeSelector from '../components/DateRangeSelector';
import ExportButton from '../components/ExportButton';
import ReportCard from '../components/ReportCard';
import { formatDate, getPresetRanges } from '../dateUtils';
import { exportToCSV, exportToPDF, exportToExcel } from '../exportUtils';

interface GestorDashboardProps {
  user: User;
  store: Store;
  db: MockDB;
  setDb: React.Dispatch<React.SetStateAction<MockDB | null>>;
  refreshDb: () => Promise<void>;
}

type Tabs = 'inventory' | 'sales' | 'debts' | 'pending-closings' | 'reports';

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

// --- PENDING INVENTORY VIEW ---
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
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <Button
                          variant="success"
                          size="xs"
                          onClick={() => onConfirm(ai.id)}
                        >
                          Aceptar
                        </Button>
                        <Button
                          variant="danger"
                          size="xs"
                          onClick={() => setRejecting(ai.id)}
                        >
                          Rechazar
                        </Button>
                      </div>
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
            <h3 className="text-lg font-bold mb-4 text-slate-900 dark:text-white">Rechazar Inventario</h3>
            <textarea
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              placeholder="Explica la razón del rechazo..."
              className="w-full h-32 p-3 border rounded-md dark:bg-slate-700 dark:border-slate-600 mb-4 dark:text-white"
            />
            <div className="flex justify-end gap-2">
              <Button
                variant="neutral"
                onClick={() => { setRejecting(null); setRejectionReason(''); }}
              >
                Cancelar
              </Button>
              <Button
                variant="danger"
                onClick={() => handleReject(rejecting)}
                disabled={!rejectionReason.trim()}
              >
                Confirmar Rechazo
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// --- SALES VIEW ---
interface SalesViewProps {
  user: User;
  store: Store;
  db: MockDB;
  setDb: React.Dispatch<React.SetStateAction<MockDB | null>>;
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

  const handleSell = async (quantity: number, paymentStatus: SalePaymentStatus, customerName?: string) => {
    if (!selectedGroup) return;

    try {
      const response = await fetch('http://localhost:3001/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          assignedInventoryId: selectedGroup.assignedInventoryId,
          quantity,
          paymentStatus,
          customerName
        })
      });

      if (response.ok) {
        await refreshDb();
        handleCloseSellModal();
        alert('Venta realizada con éxito.');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error creating sale:', error);
      alert('Error al procesar la venta.');
    }
  };

  const handleExecuteClosing = async () => {
    const paidSales = gestorSalesSinceLastClosing.filter(s => s.paymentStatus === SalePaymentStatus.PAID);
    if (paidSales.length === 0) {
      alert('No hay ventas pagadas para realizar el cierre.');
      return;
    }

    const totalBaseMN = paidSales.reduce((sum, s) => sum + s.baseMN, 0);

    if (!window.confirm(`¿Ejecutar cierre por un total de ${formatCurrency(totalBaseMN)}?`)) return;

    try {
      const response = await fetch('http://localhost:3001/api/closings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({
          saleIds: paidSales.map(s => s.id)
        })
      });

      if (response.ok) {
        await refreshDb();
        alert('Cierre de caja ejecutado correctamente.');
      } else {
        const error = await response.json();
        alert(`Error: ${error.message}`);
      }
    } catch (error) {
      console.error('Error creating closing:', error);
      alert('Error al ejecutar el cierre.');
    }
  };

  const salesByProduct = useMemo(() => {
    interface SalesGroup {
      quantity: number;
      total: number;
      gestorGain: number;
      storeGain: number;
      unitPrice: number;
      unitCommission: number;
    }
    const groups: { [key: string]: SalesGroup } = {};
    gestorSalesSinceLastClosing.forEach(sale => {
      if (sale.paymentStatus !== SalePaymentStatus.PAID) return;
      if (sale.productId) {
        const key = sale.productId;
        if (!groups[key]) {
          groups[key] = { quantity: 0, total: 0, gestorGain: 0, storeGain: 0, unitPrice: 0, unitCommission: 0 };
        }
        // Los valores sale.finalMN, sale.commission y sale.baseMN son por UNIDAD
        // Por cada venta individual, incrementamos la cantidad por la cantidadVendida
        // Y calculamos los totales correctamente: total = precioUnitario * cantidad
        const quantitySold = 1; // Cada venta individual representa 1 unidad
        
        groups[key].quantity += quantitySold;
        groups[key].total += sale.finalMN; // finalMN ya es el precio por unidad
        groups[key].gestorGain += sale.commission; // commission ya es la comisión por unidad
        groups[key].storeGain += sale.baseMN; // baseMN ya es el precio base por unidad
        
        // Guardamos el precio unitario y comisión unitaria (de la primera venta del producto)
        if (groups[key].unitPrice === 0) {
          groups[key].unitPrice = sale.baseMN;
          groups[key].unitCommission = sale.commission;
        }
      }
    });
    return groups;
  }, [gestorSalesSinceLastClosing]);

  interface SalesGroup {
    quantity: number;
    total: number;
    gestorGain: number;
    storeGain: number;
    unitPrice: number;
    unitCommission: number;
  }

  const salesValues = Object.values(salesByProduct) as SalesGroup[];
  const totalSalesAmount = salesValues.reduce((sum, data) => sum + data.total, 0);
  const totalGestorGain = salesValues.reduce((sum, data) => sum + data.gestorGain, 0);
  const totalStoreGain = salesValues.reduce((sum, data) => sum + data.storeGain, 0);

  const handleCleanInventory = async (inventoryIds: string[]) => {
    if (!inventoryIds || inventoryIds.length === 0) return;
    
    if (!confirm('¿Estás seguro de que deseas limpiar este producto de tu lista? Se archivará porque no tienes existencias.')) {
      return;
    }

    try {
      for (const id of inventoryIds) {
        const response = await fetch(`http://localhost:3001/api/assigned-inventory/${id}/archive`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (!response.ok) {
          const error = await response.json();
          console.error(`Error archiving inventory ${id}:`, error);
        }
      }
      
      await refreshDb();
      alert('Inventario actualizado.');
    } catch (error) {
      console.error('Error cleaning inventory:', error);
      alert('Error al limpiar el inventario.');
    }
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
        <h2 className="text-lg md:text-xl font-bold mb-4 text-slate-800 dark:text-slate-100 uppercase tracking-tight">Mi Inventario Disponible</h2>
        <div className="overflow-x-auto rounded-lg">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead className="bg-slate-50 dark:bg-slate-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Producto</th>
                <th className="px-4 py-3 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Precio Venta</th>
                <th className="px-4 py-3 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Stock</th>
                <th className="px-4 py-3 text-center text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Acción</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-transparent divide-y divide-slate-100 dark:divide-slate-700/50">
              {Object.entries(groupedInventory).map(([key, group]: [string, InventoryGroup]) => {
                const product = productsById[group.productId];
                if (!product) return null;
                return (
                  <tr key={key} className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-4 py-4 text-sm font-bold text-slate-900 dark:text-slate-100">{product.name}</td>
                    <td className="px-4 py-4 text-sm font-black text-primary-600 dark:text-primary-400">{formatCurrency(group.priceMN)}</td>
                    <td className="px-4 py-4 text-sm font-medium text-slate-600 dark:text-slate-400">{group.quantity}</td>
                    <td className="px-4 py-4 align-middle">
                      <div className="flex items-center justify-center w-full">
                        {group.quantity > 0 ? (
                          <Button variant="success" size="xs" onClick={() => handleOpenSellModal(group)}>Vender</Button>
                        ) : (
                          <button 
                            onClick={() => handleCleanInventory(group.inventoryIds || [])}
                            className="text-slate-400 hover:text-red-500 transition-colors p-1 rounded-full hover:bg-red-50 dark:hover:bg-red-900/20"
                            title="Limpiar inventario agotado"
                          >
                            <span className="material-symbols-outlined text-lg">delete</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {Object.keys(groupedInventory).length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center text-slate-400">No tienes mercancía asignada</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {Object.keys(salesByProduct).length > 0 && (
        <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700">
          <h2 className="text-lg md:text-xl font-bold mb-4 text-slate-800 dark:text-slate-100 uppercase tracking-tight">Ventas del Período (Desde Último Cierre)</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Producto</th>
                  <th className="px-4 py-3 text-center text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Cant.</th>
                  <th className="px-4 py-3 text-right text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Precio</th>
                  <th className="px-4 py-3 text-right text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Comisión</th>
                  <th className="px-4 py-3 text-right text-xs font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
                {Object.entries(salesByProduct).map(([productId, data]: [string, SalesGroup]) => (
                  <tr key={productId}>
                    <td className="px-4 py-4 text-sm font-bold text-slate-900 dark:text-slate-100">{productsById[productId]?.name}</td>
                    <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400 text-center">{data.quantity}</td>
                    <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400 text-right">{formatCurrency(data.quantity * data.unitPrice)}</td>
                    <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400 text-right">{formatCurrency(data.quantity * data.unitCommission)}</td>
                    <td className="px-4 py-4 text-sm text-slate-900 dark:text-slate-100 text-right font-black">{formatCurrency(data.total)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot className="bg-slate-50 dark:bg-slate-900/50 font-black">
                <tr>
                  <td colSpan={2} className="px-4 py-4 text-slate-500 text-xs uppercase tracking-widest">Total Período</td>
                  <td className="px-4 py-4 text-right text-slate-500">{formatCurrency(totalStoreGain)}</td>
                  <td className="px-4 py-4 text-right text-slate-500">{formatCurrency(totalGestorGain)}</td>
                  <td className="px-4 py-4 text-right text-primary-600 dark:text-primary-400">{formatCurrency(totalSalesAmount)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white dark:bg-slate-800 p-6 md:p-8 rounded-xl shadow-2xl border-2 border-primary-500/20">
        <div className="flex flex-col md:flex-row justify-between items-center gap-8">
          <div>
            <h2 className="text-2xl font-black text-slate-900 dark:text-white uppercase">Cierre de Caja</h2>
            <p className="text-slate-500 text-sm">Resumen de dinero a entregar al manager.</p>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Monto a Entregar</p>
              <p className="text-3xl font-black text-primary-600 dark:text-primary-400">{formatCurrency(totalStoreGain)}</p>
            </div>
            <Button variant="primary" size="lg" onClick={handleExecuteClosing} disabled={Object.keys(salesByProduct).length === 0} className="px-10 h-16 uppercase shadow-xl">
              Cerrar Caja
            </Button>
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
    </div>
  );
};

// --- DEBTS VIEW ---
interface DebtsViewProps {
  gestorSales: Sale[];
  gestorClosings: Closing[];
  db: MockDB;
  productsById: { [key: string]: Product };
  refreshDb: () => Promise<void>;
  user: User;
}

const DebtsView: React.FC<DebtsViewProps> = ({ gestorSales, gestorClosings, db, productsById, refreshDb, user }) => {
  // Group pending debts by customer and product
  const groupedDebts = useMemo(() => {
    const pendingSales = gestorSales.filter(sale =>
      sale.paymentStatus === SalePaymentStatus.PENDING &&
      !gestorClosings.some(c => c.sales?.some(s => s.id === sale.id))
    );

    interface DebtGroup {
      customerName: string;
      productId: string;
      quantity: number;
      totalAmount: number;
      saleIds: string[];
    }

    const groups: { [key: string]: DebtGroup } = {};

    pendingSales.forEach(sale => {
      if (sale.productId) {
        const key = `${sale.customerName || 'N/A'}-${sale.productId}`;
        if (!groups[key]) {
          groups[key] = {
            customerName: sale.customerName || 'N/A',
            productId: sale.productId,
            quantity: 0,
            totalAmount: 0,
            saleIds: []
          };
        }
        groups[key].quantity += 1;
        groups[key].totalAmount += sale.finalMN;
        groups[key].saleIds.push(sale.id);
      }
    });

    return Object.values(groups);
  }, [gestorSales, gestorClosings]);

  const handleMarkAsPaid = async (saleIds: string[]) => {
    try {
      // Mark all sales in the group as paid
      for (const saleId of saleIds) {
        const response = await fetch(`http://localhost:3001/api/sales/${saleId}/mark-as-paid`, {
          method: 'PATCH',
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (!response.ok) {
          console.error(`Failed to mark sale ${saleId} as paid`);
        }
      }
      await refreshDb();
      alert(`${saleIds.length} deuda(s) pagada(s) correctamente.`);
    } catch (error) {
      console.error(error);
      alert('Error al marcar las deudas como pagadas.');
    }
  };

  return (
    <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
      <h2 className="text-lg font-bold mb-4 text-amber-600 dark:text-amber-400">Deudas Pendientes</h2>
      {groupedDebts.length === 0 ? (
        <p className="text-slate-500 py-8 text-center">No hay deudas pendientes</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Cliente</th>
                <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Producto</th>
                <th className="px-4 py-3 text-center text-xs font-black text-slate-500 uppercase tracking-widest">Cant.</th>
                <th className="px-4 py-3 text-right text-xs font-black text-slate-500 uppercase tracking-widest">Monto</th>
                <th className="px-4 py-3 text-center text-xs font-black text-slate-500 uppercase tracking-widest">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {groupedDebts.map((debt, index) => (
                <tr key={`debt-${index}`}>
                  <td className="px-4 py-4 text-sm font-bold text-slate-900 dark:text-slate-100">{debt.customerName}</td>
                  <td className="px-4 py-4 text-sm text-slate-600 dark:text-slate-400">{productsById[debt.productId]?.name}</td>
                  <td className="px-4 py-4 text-sm text-slate-900 dark:text-slate-100 text-center">{debt.quantity}</td>
                  <td className="px-4 py-4 text-sm text-slate-900 dark:text-slate-100 text-right font-black">{formatCurrency(debt.totalAmount)}</td>
                  <td className="px-4 py-4 align-middle">
                    <div className="flex items-center justify-center">
                      <Button variant="success" size="xs" onClick={() => handleMarkAsPaid(debt.saleIds)}>Marcar Pagada</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

// --- PENDING CLOSINGS VIEW ---
const PendingClosingsView: React.FC<{pendingClosings: Closing[]}> = ({ pendingClosings }) => (
  <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
    <h2 className="text-lg font-bold mb-4 text-primary-600 dark:text-primary-400">Cierres Pendientes de Validación</h2>
    {pendingClosings.length === 0 ? (
      <p className="text-slate-500 py-8 text-center">No hay cierres pendientes</p>
    ) : (
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
          <thead>
            <tr>
              <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Fecha</th>
              <th className="px-4 py-3 text-right text-xs font-black text-slate-500 uppercase tracking-widest">Monto</th>
              <th className="px-4 py-3 text-center text-xs font-black text-slate-500 uppercase tracking-widest">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/50">
            {pendingClosings.map(c => (
              <tr key={c.id}>
                <td className="px-4 py-4 text-sm font-bold text-slate-900 dark:text-slate-100">{formatDate(new Date(c.initiatedAt))}</td>
                <td className="px-4 py-4 text-sm text-slate-900 dark:text-slate-100 text-right font-black">{formatCurrency(c.totalBaseMN)}</td>
                <td className="px-4 py-4 text-center">
                  <span className="px-2 py-1 rounded bg-amber-100 text-amber-800 text-xs font-bold uppercase">Pendiente</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </div>
);

// --- GESTOR REPORTS VIEW ---
interface GestorReportsViewProps {
  gestorSales: Sale[];
  gestorClosings: Closing[];
  products: Product[];
}

const GestorReportsView: React.FC<GestorReportsViewProps> = ({ gestorSales, gestorClosings, products }) => {
  const presetRanges = getPresetRanges();
  const [dateRange, setDateRange] = useState({
    start: presetRanges.esteMes.start,
    end: presetRanges.esteMes.end
  });

  const filteredClosings = gestorClosings.filter(c => {
    const targetDate = c.accountingDate instanceof Date ? c.accountingDate : (c.completedAt || c.initiatedAt);
    return c.status === ClosingStatus.COMPLETED &&
           targetDate.getTime() >= dateRange.start.getTime() &&
           targetDate.getTime() <= dateRange.end.getTime();
  });

  const totalRecaudado = filteredClosings.reduce((sum, c) => sum + c.totalFinalMN, 0);
  const totalCommissionEarned = filteredClosings.reduce((sum, c) => sum + c.totalCommission, 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <DateRangeSelector value={dateRange} onChange={setDateRange} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ReportCard title="Total Recaudado" value={formatCurrency(totalRecaudado)} icon="account_balance_wallet" />
        <ReportCard title="Mi Comisión" value={formatCurrency(totalCommissionEarned)} icon="payments" />
      </div>

      <div className="bg-white dark:bg-slate-800 p-4 md:p-6 rounded-lg border border-slate-200 dark:border-slate-700 shadow-sm">
        <h3 className="font-bold mb-4 uppercase tracking-wider text-slate-500 text-xs">Historial de Cierres</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
            <thead>
              <tr>
                <th className="px-4 py-3 text-left text-xs font-black text-slate-500 uppercase tracking-widest">Fecha</th>
                <th className="px-4 py-3 text-right text-xs font-black text-slate-500 uppercase tracking-widest">Monto</th>
                <th className="px-4 py-3 text-right text-xs font-black text-slate-500 uppercase tracking-widest">Comisión</th>
              </tr>
            </thead>
            <tbody>
              {filteredClosings.map(c => (
                <tr key={c.id}>
                  <td className="px-4 py-4 text-sm font-bold text-slate-900 dark:text-slate-100">{formatDate(new Date(c.completedAt!))}</td>
                  <td className="px-4 py-4 text-sm text-right text-slate-900 dark:text-slate-100">{formatCurrency(c.totalBaseMN)}</td>
                  <td className="px-4 py-4 text-sm text-right text-emerald-600 font-bold">{formatCurrency(c.totalCommission)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// =======================================================================
// Main Dashboard Component
// =======================================================================

const GestorDashboard: React.FC<GestorDashboardProps> = ({ user, store, db, setDb, refreshDb }) => {
  const [activeTab, setActiveTab] = useState<Tabs>('inventory');
  const productsById = useMemo(() => Object.fromEntries(db.products.map(p => [p.id, p])), [db.products]);
  const currentRate = getCurrentExchangeRate(store);

  const pendingInventory = useMemo(() => 
    db.assignedInventory.filter(ai => ai.gestorId === user.id && ai.status === 'Pending'),
    [db.assignedInventory, user.id]
  );

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
    db.assignedInventory
      .filter(ai => ai.gestorId === user.id && ai.status === 'Confirmed')
      .forEach(ai => {
        const key = `${ai.productId}-${ai.gestorId}`;
        if (!groups[key]) {
          groups[key] = { 
            productId: ai.productId, 
            quantity: 0, 
            priceMN: ai.priceMN || 0, 
            assignedAt: ai.assignedAt, 
            assignedInventoryId: ai.id,
            inventoryIds: [],
            items: [] 
          };
        }
        groups[key].quantity += ai.quantity;
        groups[key].inventoryIds?.push(ai.id);
        for (let i = 0; i < ai.quantity; i++) {
          groups[key].items.push({ id: `${ai.id}-${i}`, productId: ai.productId, gestorId: ai.gestorId, assignedAt: ai.assignedAt, status: 'Available' });
        }
      });
    return groups;
  }, [db.assignedInventory, user.id]);

  const gestorSales = useMemo(() => db.sales.filter(s => s.gestorId === user.id), [db.sales, user.id]);
  const gestorClosings = useMemo(() => db.closings.filter(c => c.gestorId === user.id), [db.closings, user.id]);

  const handleConfirmInventory = async (id: string) => {
    try {
      await fetch(`http://localhost:3001/api/assigned-inventory/${id}/confirm`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      await refreshDb();
    } catch (error) { console.error(error); }
  };

  const handleRejectInventory = async (id: string, reason: string) => {
    try {
      await fetch(`http://localhost:3001/api/assigned-inventory/${id}/reject`, {
        method: 'POST',
        headers: { 
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json' 
        },
        body: JSON.stringify({ reason })
      });
      await refreshDb();
    } catch (error) { console.error(error); }
  };

  const handleMarkAsPaid = async (saleId: string) => {
    try {
      await fetch(`http://localhost:3001/api/sales/${saleId}/mark-as-paid`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      await refreshDb();
    } catch (error) { console.error(error); }
  };

  const renderContent = () => {
    if (!db.products || db.products.length === 0) return <div className="py-20 text-center text-slate-400">Cargando...</div>;
    
    switch (activeTab) {
      case 'inventory':
        return <PendingInventoryView pendingInventory={pendingInventory} productsById={productsById} onConfirm={handleConfirmInventory} onReject={handleRejectInventory} />;
      case 'sales':
        return <SalesView user={user} store={store} db={db} setDb={setDb} gestorSalesSinceLastClosing={gestorSales.filter(sale => !gestorClosings.some(c => c.sales?.some(s => s.id === sale.id)))} productsById={productsById} currentRate={currentRate} groupedInventory={groupedInventory} refreshDb={refreshDb} />;
      case 'debts':
        return <DebtsView gestorSales={gestorSales} gestorClosings={gestorClosings} db={db} productsById={productsById} refreshDb={refreshDb} user={user} />;
      case 'pending-closings':
        return <PendingClosingsView pendingClosings={db.closings.filter(c => c.gestorId === user.id && c.status === ClosingStatus.PENDING)} />;
      case 'reports':
        return <GestorReportsView gestorSales={gestorSales} gestorClosings={db.closings.filter(c => c.gestorId === user.id)} products={db.products.filter(p => p.storeId === store.id)} />;
      default:
        return null;
    }
  };

  return (
    <div className="bg-slate-50 dark:bg-slate-800 p-4 md:p-6 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700 min-h-full">
      <nav className="flex space-x-6 border-b border-slate-200 dark:border-slate-700 mb-6 overflow-x-auto">
        <TabButton name="Inventario Nuevo" tab="inventory" activeTab={activeTab} onClick={setActiveTab} />
        <TabButton name="Ventas" tab="sales" activeTab={activeTab} onClick={setActiveTab} />
        <TabButton name="Deudas" tab="debts" activeTab={activeTab} onClick={setActiveTab} />
        <TabButton name="Cierres" tab="pending-closings" activeTab={activeTab} onClick={setActiveTab} />
        <TabButton name="Reportes" tab="reports" activeTab={activeTab} onClick={setActiveTab} />
      </nav>
      {renderContent()}
    </div>
  );
};

export default GestorDashboard;
