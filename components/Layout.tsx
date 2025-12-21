import React, { useState } from 'react';
import { User } from '../types';
import { useTheme } from '../ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User;
  onLogout: () => void;
  storeName?: string;
}

const NavLink: React.FC<{
  href: string;
  icon: string;
  label: string;
  active?: boolean;
}> = ({ href, icon, label, active }) => (
  <a
    href={href}
    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-sm font-medium ${
      active
        ? 'bg-primary/10 text-primary'
        : 'text-[#111418] dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
    }`}
  >
    <span className={`material-symbols-outlined ${active ? 'fill' : ''}`}>{icon}</span>
    <p>{label}</p>
  </a>
);

export const Layout: React.FC<LayoutProps> = ({ children, currentUser, onLogout, storeName }) => {
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const navigationItems = [
    { href: '#', icon: 'dashboard', label: 'Dashboard', active: true },
    { href: '#', icon: 'storefront', label: 'Stores' },
    { href: '#', icon: 'group', label: 'Users (Managers)' },
    { href: '#', icon: 'inventory_2', label: 'Inventory' },
    { href: '#', icon: 'receipt_long', label: 'Closings' },
  ];

  return (
    <div className="flex h-screen w-full bg-background-light dark:bg-background-dark text-[#111418] dark:text-white font-display overflow-hidden">
      {/* Sidebar */}
      <aside
        className={`flex w-64 flex-col justify-between border-r border-[#dbe0e6] dark:border-gray-700 bg-white dark:bg-[#1a2632] p-4 transition-transform transform ${
          isMenuOpen ? 'translate-x-0' : '-translate-x-full'
        } md:translate-x-0 md:flex fixed md:static h-full z-20`}
      >
        <div className="flex flex-col gap-4">
          <div className="flex gap-3 items-center mb-4">
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA-_390OM0Gn-9xZ1Iwa8Eykzu1grYN-3FgcrsxrzfBDQf8jAri2aKOhW4VoM8mXbR1-eUYp_UH3VMNqe57d8Y-3rZISVh1LakGHA5dWYsGow14Yqxqy0NYygYWfK4FMe9nU6iyLTwd_xZl39swVPZUBnbjLpVqmb90RZBFig56wIzGpHm8BL7Zs7jYBrmtYLirHyv_GYEpdFOsgMJY7e8kA_LdMP2kobNih5URs3ReFF2C8Cp4fUvHfwNn7TKJAvpTs-ozZ9XuRYSZ")',
              }}
            ></div>
            <div className="flex flex-col">
              <h1 className="text-base font-bold leading-normal text-[#111418] dark:text-white">
                Admin Console
              </h1>
              <p className="text-[#617589] dark:text-gray-400 text-xs font-normal leading-normal">
                {storeName || 'Multi-tenant System'}
              </p>
            </div>
          </div>
          <nav className="flex flex-col gap-2">
            {navigationItems.map((item) => (
              <NavLink key={item.label} {...item} />
            ))}
          </nav>
        </div>
        <div className="flex flex-col gap-2">
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-[#111418] dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            <p className="text-sm font-medium leading-normal">
              Switch to {theme === 'dark' ? 'Light' : 'Dark'} Mode
            </p>
          </button>
          <div className="flex items-center gap-3 px-3 py-4 mt-2 border-t border-[#dbe0e6] dark:border-gray-700">
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBA1NdEALHVBbVIUGvuY3b8kMxzJNZQgPkLQuSwCm7PZp44VPQz97bhV48WrQermfPGAEgL3NZ73K7Kdt6VhW0sCXrhv2cZx9Q8deWhinbTZaM92TGlaysI3VFP7kGfVnYrmMXsKbPL1yDqVMzbhE6wAuREvaUfgHNbUwz0dlRS3s3j3FVWqunNVfj1A7QZt5hy5GLjFR711wf04R6RU8GJnV1hkAfXqAoS7h2TomlNMH0QaEJwEBKOzliJYG2LwRMejYMkKuQDrVXc")',
              }}
            ></div>
            <div className="flex flex-col flex-1">
              <p className="text-sm font-medium leading-tight text-[#111418] dark:text-white">
                {currentUser.name}
              </p>
              <p className="text-xs text-[#617589] dark:text-gray-400">{currentUser.role}</p>
            </div>
            <button onClick={onLogout} title="Cerrar Sesión">
              <span className="material-symbols-outlined text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-500 transition-colors">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white dark:bg-[#1a2632] border-b border-[#dbe0e6] dark:border-gray-700">
          <button onClick={() => setIsMenuOpen(!isMenuOpen)}>
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="font-bold text-lg">Admin Console</h1>
          <div className="size-8 rounded-full bg-gray-200"></div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-8">{children}</div>
      </main>
      
      {/* Overlay for mobile */}
      {isMenuOpen && (
        <div 
          className="md:hidden fixed inset-0 bg-black/30 z-10"
          onClick={() => setIsMenuOpen(false)}
        ></div>
      )}
    </div>
  );
};