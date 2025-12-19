
import React, { useState } from 'react';
import { mockDB } from '../store';
import { Role } from '../types';
import Layout from '../components/Layout';

const AdminDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState('overview');

  const navItems = [
    { icon: 'dashboard', label: 'Overview', id: 'overview' },
    { icon: 'storefront', label: 'Stores', id: 'stores' },
    { icon: 'group', label: 'Managers', id: 'managers' },
    { icon: 'settings_suggest', label: 'System Settings', id: 'settings' },
  ];

  const renderOverview = () => (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-[#dbe0e6] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[#617589] text-sm font-bold uppercase tracking-wider">Total Stores</span>
            <span className="material-symbols-outlined text-primary bg-primary/10 p-2 rounded-lg">storefront</span>
          </div>
          <p className="text-4xl font-black">{mockDB.stores.length}</p>
          <p className="text-[#078838] text-sm font-bold mt-2">+2 this month</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#dbe0e6] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[#617589] text-sm font-bold uppercase tracking-wider">Active Managers</span>
            <span className="material-symbols-outlined text-purple-600 bg-purple-50 p-2 rounded-lg">badge</span>
          </div>
          <p className="text-4xl font-black">{mockDB.users.filter(u => u.role === Role.MANAGER).length}</p>
          <p className="text-slate-500 text-sm font-medium mt-2">Verified users</p>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-[#dbe0e6] shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <span className="text-[#617589] text-sm font-bold uppercase tracking-wider">Platform Status</span>
            <span className="material-symbols-outlined text-teal-600 bg-teal-50 p-2 rounded-lg">dns</span>
          </div>
          <p className="text-2xl font-black text-teal-600">Operational</p>
          <p className="text-slate-500 text-sm font-medium mt-2">All regions stable</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-[#dbe0e6] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-[#dbe0e6] flex justify-between items-center">
          <h3 className="font-bold text-lg">System Directory</h3>
          <button className="bg-primary text-white px-4 py-2 rounded-lg text-sm font-bold">Register New Tenant</button>
        </div>
        <table className="w-full text-left">
          <thead className="bg-gray-50 text-[10px] font-bold uppercase text-[#617589] tracking-widest">
            <tr>
              <th className="px-6 py-4">Tenant Name</th>
              <th className="px-6 py-4">Location</th>
              <th className="px-6 py-4">Current Manager</th>
              <th className="px-6 py-4 text-right">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {mockDB.stores.map(store => {
              const manager = mockDB.users.find(u => u.storeId === store.id && u.role === Role.MANAGER);
              return (
                <tr key={store.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 font-bold text-sm">{store.name}</td>
                  <td className="px-6 py-4 text-sm text-[#617589]">{store.location}</td>
                  <td className="px-6 py-4 text-sm font-medium">{manager?.name || 'Unassigned'}</td>
                  <td className="px-6 py-4 text-right">
                    <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter">Active</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );

  return (
    <Layout 
      user={mockDB.users[0]} 
      title="System Administration" 
      navItems={navItems} 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
    >
      {activeTab === 'overview' ? renderOverview() : (
        <div className="flex items-center justify-center h-64 border-2 border-dashed border-gray-200 rounded-2xl">
          <p className="text-gray-400 font-medium italic">Feature section: {activeTab} coming soon</p>
        </div>
      )}
    </Layout>
  );
};

export default AdminDashboard;
