
import React, { useState, useMemo } from 'react';
// Correct: mockDB is in '../store', types are in '../types'
import { Role, User, Store, Product, ClosureStatus } from '../types';
import { mockDB } from '../store';
import Layout from '../components/Layout';
import { calculateProductPrices, formatCurrency } from '../utils';

interface ManagerDashboardProps {
  user: User;
  store: Store;
}

const ManagerDashboard: React.FC<ManagerDashboardProps> = ({ user, store }) => {
  const [activeTab, setActiveTab] = useState('inventory');
  const [exchangeRate, setExchangeRate] = useState(store.exchangeRate);
  
  const navItems = [
    { icon: 'dashboard', label: 'Dashboard', id: 'dashboard' },
    { icon: 'inventory_2', label: 'Inventory', id: 'inventory' },
    { icon: 'groups', label: 'Sales Team', id: 'team' },
    { icon: 'verified_user', label: 'Closures', id: 'closures' },
    { icon: 'settings', label: 'Store Config', id: 'settings' },
  ];

  const pendingClosures = useMemo(() => mockDB.closures.filter(c => c.status === ClosureStatus.PENDING), []);

  const renderInventory = () => (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h3 className="text-2xl font-black tracking-tight">Store Catalog</h3>
          <p className="text-[#617589] text-sm mt-1">Manage costs, margins, and stock levels for {store.name}.</p>
        </div>
        <div className="flex gap-3">
           <div className="bg-primary/5 border border-primary/10 rounded-xl px-4 py-2 flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-widest text-primary/60">Exchange Rate (X)</span>
              <span className="text-lg font-black text-primary">{exchangeRate} MN / USD</span>
           </div>
           <button className="bg-primary text-white px-6 py-2 rounded-xl font-bold text-sm shadow-lg shadow-primary/20">Add Product</button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {mockDB.products.map(p => {
          const prices = calculateProductPrices(p.costUsd, p.marginPct, exchangeRate, store.commissionPct);
          return (
            <div key={p.id} className="bg-white border border-[#dbe0e6] rounded-2xl p-6 flex flex-wrap lg:flex-nowrap items-center gap-8 hover:shadow-md transition-shadow">
              <div className="size-16 bg-gray-100 rounded-xl flex items-center justify-center text-primary border border-gray-200 shrink-0">
                <span className="material-symbols-outlined text-3xl">shopping_bag</span>
              </div>
              <div className="flex-1 min-w-[200px]">
                <h4 className="font-bold text-lg leading-tight">{p.name}</h4>
                <p className="text-[#617589] text-xs font-medium mt-1">SKU: {p.sku} | Stock: <span className="font-bold text-slate-900">{p.stock} units</span></p>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 flex-1 text-center border-l border-[#f0f2f4] pl-8">
                <div>
                  <p className="text-[10px] font-bold text-[#617589] uppercase tracking-tighter">Cost (USD)</p>
                  <p className="font-black text-slate-700">${p.costUsd}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#617589] uppercase tracking-tighter">Margin</p>
                  <p className="font-bold text-green-600">{(p.marginPct * 100).toFixed(0)}%</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold text-[#617589] uppercase tracking-tighter">Price (MN)</p>
                  <p className="font-black text-primary">{formatCurrency(prices.mnFinal)}</p>
                </div>
                <div className="bg-slate-50 rounded-lg py-1 px-3">
                  <p className="text-[10px] font-bold text-[#617589] uppercase tracking-tighter">Gestor Net</p>
                  <p className="font-bold text-slate-900">{formatCurrency(prices.mnBase)}</p>
                </div>
              </div>

              <div className="flex gap-2">
                <button className="p-2 text-slate-400 hover:text-primary transition-colors"><span className="material-symbols-outlined">edit</span></button>
                <button className="p-2 text-slate-400 hover:text-primary transition-colors"><span className="material-symbols-outlined">assignment</span></button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <Layout 
      user={user} 
      title={`Manager: ${store.name}`} 
      navItems={navItems} 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
    >
      {activeTab === 'inventory' ? renderInventory() : (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#dbe0e6] border-dashed rounded-3xl">
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-4">construction</span>
          <p className="text-slate-400 font-bold tracking-tight">Section "{activeTab}" is in Phase 2 development.</p>
          <p className="text-slate-300 text-sm mt-2 px-10 text-center max-w-md">Currently focusing on the core exchange rate and multi-tenant logic.</p>
        </div>
      )}
    </Layout>
  );
};

export default ManagerDashboard;
