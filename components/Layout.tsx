import React, { useState } from 'react';
import { User, Role, Store } from '../types';
import { useTheme } from '../ThemeContext';
import { getCurrentExchangeRate } from '../utils';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User;
  onLogout: () => void;
  storeName?: string;
  store?: Store;
  onNavigate: (view: string) => void;
  currentView: string;
}

const NavLink: React.FC<{
  icon: string;
  label: string;
  view: string;
  active: boolean;
  onClick: () => void;
}> = ({ icon, label, active, onClick }) => (
  <a
    href="#"
    onClick={onClick}
    className={`flex items-center gap-3 px-3 py-2 rounded-lg transition-all text-sm font-medium ${
      active
        ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 shadow-sm'
        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:shadow-md'
    }`}
  >
    <span className={`material-symbols-outlined ${active ? 'fill' : ''}`}>{icon}</span>
    <p>{label}</p>
  </a>
);

export const Layout: React.FC<LayoutProps> = ({ children, currentUser, onLogout, storeName, store, onNavigate, currentView }) => {
  const { theme, toggleTheme } = useTheme();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);

  const currentExchangeRate = store ? getCurrentExchangeRate(store) : null;

  const handleOverlayClick = () => {
    setIsMenuOpen(false);
    setIsSidebarCollapsed(true);
  };

  const getNavigationItems = (role: Role) => {
    switch (role) {
      case Role.ADMIN:
        return [
          { view: 'dashboard', icon: 'dashboard', label: 'Panel de Control' },
          { view: 'stores', icon: 'storefront', label: 'Tiendas' },
          { view: 'users', icon: 'group', label: 'Usuarios' },
        ];
      case Role.DIRECTOR:
        return [
          { view: 'dashboard', icon: 'dashboard', label: 'Panel de Control' },
          { view: 'managers', icon: 'group', label: 'Managers' },
          { view: 'inventory', icon: 'inventory_2', label: 'Inventario' },
          { view: 'closings', icon: 'receipt_long', label: 'Cierres' },
        ];
      case Role.MANAGER:
        return [
          { view: 'dashboard', icon: 'dashboard', label: 'Panel de Control' },
          { view: 'inventory', icon: 'inventory_2', label: 'Inventario' },
          { view: 'closings', icon: 'receipt_long', label: 'Cierres' },
        ];
      case Role.GESTOR:
        return [
          { view: 'dashboard', icon: 'dashboard', label: 'Panel de Control' },
          { view: 'sales', icon: 'point_of_sale', label: 'Ventas' },
          { view: 'closings', icon: 'receipt_long', label: 'Cierres' },
        ];
      default:
        return [];
    }
  };

  const navigationItems = getNavigationItems(currentUser.role);

  return (
    <div className="flex h-screen w-full bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-display overflow-hidden">
       {/* Mobile Sidebar */}
      <aside
        className={`md:hidden flex flex-col justify-between border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 transition-transform duration-300 h-full z-20 fixed ${
          isMenuOpen ? 'translate-x-0 w-64 p-4 overflow-y-auto' : '-translate-x-full w-64 p-4 overflow-y-auto'
        }`}
      >
        <div className="flex flex-col gap-4 px-4">
          <div className="flex gap-3 items-center mb-4">
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 ring-2 ring-primary-200 dark:ring-primary-800"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA-_390OM0Gn-9xZ1Iwa8Eykzu1grYN-3FgcrsxrzfBDQf8jAri2aKOhW4VoM8mXbR1-eUYp_UH3VMNqe57d8Y-3rZISVh1LakGHA5dWYsGow14Yqxqy0NYygYWfK4FMe9nU6iyLTwd_xZl39swVPZUBnbjLpVqmb90RZBFig56wIzGpHm8BL7Zs7jYBrmtYLirHyv_GYEpdFOsgMJY7e8kA_LdMP2kobNih5URs3ReFF2C8Cp4fUvHfwNn7TKJAvpTs-ozZ9XuRYSZ")',
              }}
            ></div>
            <div className="flex flex-col">
              <h1 className="text-base font-bold leading-normal text-slate-800 dark:text-white">
                Consola de Administración
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-normal leading-normal">
                {storeName || 'Sistema Multi-inquilino'}
              </p>
              {currentExchangeRate && (
                <div className="mt-1 px-2 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs font-semibold rounded-md inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">currency_exchange</span>
                  <span>TC: {currentExchangeRate.rate}</span>
                </div>
              )}
            </div>
          </div>
          <nav className="overflow-x-auto">
            {navigationItems.map((item) => (
              <NavLink
                key={item.view}
                {...item}
                active={currentView === item.view}
                onClick={() => {
                  onNavigate(item.view);
                  setIsMenuOpen(false);
                }}
              />
            ))}
          </nav>
        </div>
        <div className={`flex flex-col gap-2 border-t border-slate-200 dark:border-slate-700 px-4 ${isMenuOpen ? 'pb-4' : ''}`}>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:shadow-md transition-all"
          >
            <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            <p className="text-sm font-medium leading-normal">
              Cambiar a Modo {theme === 'dark' ? 'Claro' : 'Oscuro'}
            </p>
          </button>
          <div className="flex items-center gap-3 px-3 py-4">
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8 ring-2 ring-slate-200 dark:ring-slate-600"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBA1NdEALHVBbVIUGvuY3b8kMxzJNZQgPkLQuSwCm7PZp44VPQz97bhV48WrQermfPGAEgL3NZ73K7Kdt6VhW0sCXrhv2cZx9Q8deWhinbTZaM92TGlaysI3VFP7kGfVnYrmMXsKbPL1yDqVMzbhE6wAuREvaUfgHNbUwz0dlRS3s3j3FVWqunNVfj1A7QZt5hy5GLjFR711wf04R6RU8GJnV1hkAfXqAoS7h2TomlNMH0QaEJwEBKOzliJYG2LwRMejYMkKuQDrVXc")',
              }}
            ></div>
            <div className="flex flex-col flex-1">
              <p className="text-sm font-medium leading-tight text-slate-800 dark:text-white">
                {currentUser.name}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{currentUser.role}</p>
            </div>
            <button onClick={onLogout} title="Cerrar Sesión">
              <span className="material-symbols-outlined text-danger-500 hover:text-danger-700 dark:text-danger-400 dark:hover:text-danger-500 hover:shadow-sm transition-all">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col justify-between border-r border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 transition-all duration-300 h-full overflow-hidden ${
          isSidebarCollapsed ? 'w-0 border-none p-0' : 'w-64 p-4'
        }`}
      >
        <div className={`flex flex-col gap-4 h-full transition-opacity duration-200 ${isSidebarCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <div className="flex gap-3 items-center mb-4">
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-10 ring-2 ring-primary-200 dark:ring-primary-800"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuA-_390OM0Gn-9xZ1Iwa8Eykzu1grYN-3FgcrsxrzfBDQf8jAri2aKOhW4VoM8mXbR1-eUYp_UH3VMNqe57d8Y-3rZISVh1LakGHA5dWYsGow14Yqxqy0NYygYWfK4FMe9nU6iyLTwd_xZl39swVPZUBnbjLpVqmb90RZBFig56wIzGpHm8BL7Zs7jYBrmtYLirHyv_GYEpdFOsgMJY7e8kA_LdMP2kobNih5URs3ReFF2C8Cp4fUvHfwNn7TKJAvpTs-ozZ9XuRYSZ")',
              }}
            ></div>
            <div className="flex flex-col">
              <h1 className="text-base font-bold leading-normal text-slate-800 dark:text-white">
                Consola de Administración
              </h1>
              <p className="text-slate-500 dark:text-slate-400 text-xs font-normal leading-normal">
                {storeName || 'Sistema Multi-inquilino'}
              </p>
              {currentExchangeRate && (
                <div className="mt-1 px-2 py-1 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 text-xs font-semibold rounded-md inline-flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">currency_exchange</span>
                  <span>TC: {currentExchangeRate.rate}</span>
                </div>
              )}
            </div>
          </div>
          <nav className="flex flex-col gap-2">
            {navigationItems.map((item) => (
              <NavLink
                key={item.view}
                {...item}
                active={currentView === item.view}
                onClick={() => {
                  onNavigate(item.view);
                }}
              />
            ))}
          </nav>
        </div>
        <div className={`flex flex-col gap-2 border-t border-slate-200 dark:border-slate-700 ${isSidebarCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
          <button
            onClick={toggleTheme}
            className="flex items-center gap-3 px-3 py-2 rounded-lg text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 hover:shadow-md transition-all"
          >
            <span className="material-symbols-outlined">{theme === 'dark' ? 'light_mode' : 'dark_mode'}</span>
            <p className="text-sm font-medium leading-normal">
              Cambiar a Modo {theme === 'dark' ? 'Claro' : 'Oscuro'}
            </p>
          </button>
          <div className="flex items-center gap-3 px-3 py-4 mt-2">
            <div
              className="bg-center bg-no-repeat aspect-square bg-cover rounded-full size-8 ring-2 ring-slate-200 dark:ring-slate-600"
              style={{
                backgroundImage:
                  'url("https://lh3.googleusercontent.com/aida-public/AB6AXuBA1NdEALHVBbVIUGvuY3b8kMxzJNZQgPkLQuSwCm7PZp44VPQz97bhV48WrQermfPGAEgL3NZ73K7Kdt6VhW0sCXrhv2cZx9Q8deWhinbTZaM92TGlaysI3VFP7kGfVnYrmMXsKbPL1yDqVMzbhE6wAuREvaUfgHNbUwz0dlRS3s3j3FVWqunNVfj1A7QZt5hy5GLjFR711wf04R6RU8GJnV1hkAfXqAoS7h2TomlNMH0QaEJwEBKOzliJYG2LwRMejYMkKuQDrVXc")',
              }}
            ></div>
            <div className="flex flex-col flex-1">
              <p className="text-sm font-medium leading-tight text-slate-800 dark:text-white">
                {currentUser.name}
              </p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{currentUser.role}</p>
            </div>
            <button onClick={onLogout} title="Cerrar Sesión">
              <span className="material-symbols-outlined text-danger-500 hover:text-danger-700 dark:text-danger-400 dark:hover:text-danger-500 hover:shadow-sm transition-all">logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Toggle button for collapsed sidebar (desktop only) */}
      {isSidebarCollapsed && (
        <button
          onClick={() => setIsSidebarCollapsed(false)}
          className="hidden md:flex fixed left-4 top-1/2 -translate-y-1/2 z-10 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg p-2 shadow-lg hover:shadow-xl transition-shadow hover:bg-slate-100 dark:hover:bg-slate-700"
          title="Abrir barra lateral"
        >
          <span className="material-symbols-outlined text-slate-700 dark:text-slate-300">menu</span>
        </button>
      )}

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Mobile Header */}
        <div className="md:hidden flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700">
          <button onClick={(e) => { e.stopPropagation(); setIsMenuOpen(!isMenuOpen); }}>
            <span className="material-symbols-outlined">menu</span>
          </button>
          <h1 className="font-bold text-lg">Consola de Administración</h1>
          <div className="size-8 rounded-full bg-slate-200"></div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 md:p-8" onClick={handleOverlayClick}>{children}</div>
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
