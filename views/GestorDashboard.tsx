
import React, { useState, useMemo } from 'react';
// Correct: mockDB is in '../store', types are in '../types'
import { Role, User, Store, Product, Sale, ClosureStatus } from '../types';
import { mockDB } from '../store';
import Layout from '../components/Layout';
import { calculateProductPrices, formatCurrency } from '../utils';

interface GestorDashboardProps {
  user: User;
  store: Store;
}

const GestorDashboard: React.FC<GestorDashboardProps> = ({ user, store }) => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [cart, setCart] = useState<Record<string, number>>({});
  const [localSales, setLocalSales] = useState<Sale[]>([]);

  const navItems = [
    { icon: 'dashboard', label: 'My Sales', id: 'dashboard' },
    { icon: 'inventory_2', label: 'Assigned Stock', id: 'inventory' },
    { icon: 'lock_clock', label: 'Daily Closure', id: 'closure' },
    { icon: 'bar_chart', label: 'Performance', id: 'performance' },
  ];

  const handleSale = (product: Product) => {
    const prices = calculateProductPrices(product.costUsd, product.marginPct, store.exchangeRate, store.commissionPct);
    
    const newSale: Sale = {
      id: `s_${Math.random().toString(36).substr(2, 9)}`,
      gestorId: user.id,
      productId: product.id,
      quantity: 1,
      exchangeRate: store.exchangeRate,
      costUsd: product.costUsd,
      marginPct: product.marginPct,
      mnBase: prices.mnBase,
      commission: prices.comision,
      mnFinal: prices.mnFinal,
      timestamp: new Date().toISOString()
    };

    setLocalSales(prev => [...prev, newSale]);
    alert(`Venta registrada: ${product.name} por ${formatCurrency(prices.mnFinal)}`);
  };

  const totals = useMemo(() => {
    return localSales.reduce((acc, s) => ({
      collected: acc.collected + s.mnFinal,
      base: acc.base + s.mnBase,
      commission: acc.commission + s.commission,
    }), { collected: 0, base: 0, commission: 0 });
  }, [localSales]);

  const renderInventory = () => (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black">Hola, {user.name.split(' ')[0]}</h2>
          <p className="text-[#617589] font-medium">Precios actuales basados en X = <span className="text-primary font-black">{store.exchangeRate}</span></p>
        </div>
        <div className="bg-white px-6 py-4 rounded-2xl border border-[#dbe0e6] shadow-sm flex gap-8">
          <div className="flex flex-col">
            <span className="text-[10px] font-bold text-[#617589] uppercase tracking-wider">Hoy Recaudado</span>
            <span className="text-xl font-black text-primary">{formatCurrency(totals.collected)}</span>
          </div>
          <div className="flex flex-col border-l border-gray-100 pl-8">
            <span className="text-[10px] font-bold text-[#617589] uppercase tracking-wider">Tu Comisión</span>
            <span className="text-xl font-black text-green-600">{formatCurrency(totals.commission)}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockDB.products.map(p => {
          const prices = calculateProductPrices(p.costUsd, p.marginPct, store.exchangeRate, store.commissionPct);
          return (
            <div key={p.id} className="bg-white border border-[#dbe0e6] rounded-2xl overflow-hidden group hover:border-primary transition-colors">
              <div className="h-40 bg-gray-50 flex items-center justify-center border-b border-[#f0f2f4]">
                <span className="material-symbols-outlined text-5xl text-gray-300">shopping_bag</span>
              </div>
              <div className="p-5">
                <h4 className="font-bold text-lg leading-tight">{p.name}</h4>
                <div className="flex justify-between items-center mt-4">
                  <p className="text-2xl font-black text-primary">{formatCurrency(prices.mnFinal)}</p>
                  <span className="text-xs font-bold text-[#617589] bg-gray-100 px-2 py-1 rounded">Stock: {p.stock}</span>
                </div>
                <button 
                  onClick={() => handleSale(p)}
                  className="w-full mt-6 py-2.5 bg-primary text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:bg-blue-600 transition-all active:scale-95"
                >
                  Registrar Venta
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderClosure = () => (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="bg-white rounded-3xl border border-[#dbe0e6] shadow-xl overflow-hidden">
        <div className="bg-slate-900 p-8 text-white">
          <h3 className="text-2xl font-bold">Resumen de Cierre Diario</h3>
          <p className="text-slate-400 mt-2">Ventas pendientes de consolidar ({localSales.length})</p>
        </div>
        
        <div className="p-8 space-y-6">
          <div className="flex justify-between items-center pb-6 border-b border-gray-100">
             <span className="text-slate-500 font-medium">Total Recaudado (Final)</span>
             <span className="text-2xl font-black">{formatCurrency(totals.collected)}</span>
          </div>
          <div className="flex justify-between items-center pb-6 border-b border-gray-100">
             <span className="text-slate-500 font-medium">Comisión Gestor (10%)</span>
             <span className="text-2xl font-black text-green-600">{formatCurrency(totals.commission)}</span>
          </div>
          <div className="flex justify-between items-center p-6 bg-primary/5 rounded-2xl border border-primary/10">
             <span className="text-primary font-bold">Monto a Entregar al Manager</span>
             <span className="text-3xl font-black text-primary">{formatCurrency(totals.base)}</span>
          </div>

          <div className="pt-6">
            <p className="text-xs text-[#617589] leading-relaxed text-center italic">
              Al confirmar, el sistema generará una solicitud de cierre pendiente de validación física por tu manager.
            </p>
            <button 
              disabled={localSales.length === 0}
              className="w-full mt-6 py-4 bg-primary text-white font-black rounded-2xl shadow-xl shadow-primary/30 disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
              onClick={() => {
                alert("Cierre ejecutado. Informe enviado al Manager.");
                setLocalSales([]);
                setActiveTab('inventory');
              }}
            >
              Confirmar y Ejecutar Cierre
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Layout 
      user={user} 
      title={`Gestor: ${store.name}`} 
      navItems={navItems} 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
    >
      {activeTab === 'inventory' ? renderInventory() : (
        activeTab === 'closure' ? renderClosure() : (
          <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#dbe0e6] border-dashed rounded-3xl">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">monitoring</span>
            <p className="text-slate-400 font-bold tracking-tight">Estadísticas avanzadas en development.</p>
          </div>
        )
      )}
    </Layout>
  );
};

export default GestorDashboard;
