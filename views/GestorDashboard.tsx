// views/GestorDashboard.tsx
import React from 'react';
import { User, Store, MockDB, InventoryItem, Product, Role, Sale, ClosingStatus, Closing } from '../types';
import { calculateProductPrices, formatCurrency, getCurrentExchangeRate } from '../utils';

interface GestorDashboardProps {
  user: User;
  store: Store;
  db: MockDB;
  setDb: React.Dispatch<React.SetStateAction<MockDB>>;
}

const GestorDashboard: React.FC<GestorDashboardProps> = ({ user, store, db, setDb }) => {
  // Filtrar inventario, productos y ventas para el gestor actual
  const gestorInventory = db.inventory.filter(item => item.gestorId === user.id && item.status === 'Available');
  const gestorSales = db.sales.filter(sale => sale.gestorId === user.id && !db.closings.some(c => c.sales.some(s => s.id === sale.id)));
  const productsById = Object.fromEntries(db.products.map(p => [p.id, p]));
  const currentRate = getCurrentExchangeRate(store);

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
      const updatedInventory = prevDb.inventory.map(item => 
        item.id === inventoryItem.id ? { ...item, status: 'Sold', saleId: newSale.id } : item
      );
      return {
        ...prevDb,
        inventory: updatedInventory,
        sales: [...prevDb.sales, newSale]
      };
    });
  };

  const handleExecuteClosing = () => {
    if (gestorSales.length === 0) {
      alert('No hay ventas nuevas para cerrar.');
      return;
    }

    const totalBaseMN = gestorSales.reduce((sum, sale) => sum + sale.baseMN, 0);
    const totalCommission = gestorSales.reduce((sum, sale) => sum + sale.commission, 0);
    const totalFinalMN = gestorSales.reduce((sum, sale) => sum + sale.finalMN, 0);

    const newClosing: Closing = {
      id: `closing-${Date.now()}`,
      gestorId: user.id,
      initiatedAt: new Date(),
      status: ClosingStatus.PENDING,
      sales: gestorSales,
      totalBaseMN,
      totalCommission,
      totalFinalMN,
    };
    
    // Simple summary for user confirmation
    const summary = `
      Resumen del Cierre:
      - Artículos Vendidos: ${gestorSales.length}
      - Total Recaudado: ${formatCurrency(totalFinalMN)}
      - Tu Comisión: ${formatCurrency(totalCommission)}
      - Monto a Entregar: ${formatCurrency(totalBaseMN)}

      ¿Confirmas la ejecución del cierre?
    `;

    if (window.confirm(summary)) {
      setDb(prevDb => ({
        ...prevDb,
        closings: [...prevDb.closings, newClosing],
      }));
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
                <p className="text-2xl font-bold text-sky-600 dark:text-sky-400">{gestorSales.length}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Total a entregar: {formatCurrency(gestorSales.reduce((sum, s) => sum + s.baseMN, 0))}
                </p>
            </div>
          <button 
            onClick={handleExecuteClosing}
            disabled={gestorSales.length === 0}
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
          >
            Ejecutar Cierre
          </button>
        </div>
      </div>
    </div>
  );
};

export default GestorDashboard;