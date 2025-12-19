
import React, { ReactNode } from 'react';
import { User, Role } from '../types';

interface NavItemProps {
  icon: string;
  label: string;
  active?: boolean;
  onClick?: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ icon, label, active, onClick }) => (
  <button 
    onClick={onClick}
    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg w-full transition-colors ${
      active 
      ? 'bg-primary/10 text-primary font-bold' 
      : 'text-[#617589] hover:bg-gray-100 hover:text-[#111418]'
    }`}
  >
    <span className={`material-symbols-outlined ${active ? 'fill' : ''}`}>{icon}</span>
    <span className="text-sm">{label}</span>
  </button>
);

interface LayoutProps {
  children: ReactNode;
  user: User;
  title: string;
  navItems: { icon: string; label: string; id: string }[];
  activeTab: string;
  onTabChange: (id: string) => void;
}

const Layout: React.FC<LayoutProps> = ({ children, user, title, navItems, activeTab, onTabChange }) => {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-[#f6f7f8]">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-64 flex-col bg-white border-r border-[#dbe0e6] p-4 shrink-0">
        <div className="flex gap-3 items-center mb-8 px-2">
          <div className="bg-primary/10 p-2 rounded-xl text-primary">
            <span className="material-symbols-outlined text-2xl">point_of_sale</span>
          </div>
          <div className="flex flex-col">
            <h1 className="text-base font-bold leading-none">NexusFlow</h1>
            <p className="text-[#617589] text-[10px] uppercase font-bold mt-1 tracking-widest">Multi-Tenant</p>
          </div>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(item => (
            <NavItem 
              key={item.id} 
              icon={item.icon} 
              label={item.label} 
              active={activeTab === item.id} 
              onClick={() => onTabChange(item.id)}
            />
          ))}
        </nav>

        <div className="mt-auto pt-4 border-t border-[#dbe0e6]">
          <div className="flex items-center gap-3 p-2 rounded-xl bg-gray-50 border border-gray-100">
            <img 
              src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=random`} 
              className="size-10 rounded-full border-2 border-white shadow-sm"
              alt={user.name}
            />
            <div className="flex flex-col overflow-hidden">
              <p className="text-sm font-bold truncate">{user.name}</p>
              <p className="text-[#617589] text-xs font-medium">{user.role}</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        <header className="h-16 flex items-center justify-between px-8 bg-white border-b border-[#dbe0e6] shrink-0">
          <h2 className="text-lg font-bold text-[#111418]">{title}</h2>
          <div className="flex items-center gap-4">
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#617589] material-symbols-outlined text-[20px]">search</span>
              <input 
                type="text" 
                placeholder="Search..." 
                className="pl-10 pr-4 py-1.5 bg-gray-50 border-none rounded-lg text-sm w-64 focus:ring-2 focus:ring-primary/20"
              />
            </div>
            <button className="p-2 text-[#617589] hover:bg-gray-100 rounded-full transition-colors relative">
              <span className="material-symbols-outlined">notifications</span>
              <span className="absolute top-2 right-2 size-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Layout;
