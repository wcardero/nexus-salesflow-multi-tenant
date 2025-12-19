// components/Layout.tsx

import React from 'react';
import { User } from '../types';
import { useTheme } from '../ThemeContext';

interface LayoutProps {
  children: React.ReactNode;
  currentUser: User;
  onLogout: () => void;
  storeName?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentUser, onLogout, storeName }) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex flex-col min-h-screen bg-surface-background dark:bg-surface-dark text-slate-800 dark:text-slate-200">
      {/* Header */}
      <header className="bg-white dark:bg-slate-800 shadow-md z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2">
            <div className="flex items-baseline gap-4">
              <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">
                Nexus SalesFlow
              </h1>
              {storeName && (
                <div className="flex items-center gap-2">
                   <span className="text-slate-400 dark:text-slate-500">|</span>
                   <span className="font-medium text-slate-600 dark:text-slate-300">{storeName}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
                title="Cambiar tema"
              >
                <span className="material-symbols-outlined text-xl text-slate-600 dark:text-slate-300">
                  {theme === 'dark' ? 'light_mode' : 'dark_mode'}
                </span>
              </button>

              <div className="text-right">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{currentUser.name}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{currentUser.role}</p>
              </div>
              <button
                onClick={onLogout}
                className="bg-slate-200 dark:bg-slate-700 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 text-slate-600 dark:text-slate-300 font-bold py-2 px-3 rounded-md transition-colors text-xs"
                title="Cerrar Sesión"
              >
                Cerrar Sesión
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-8">
        {children}
      </main>

       {/* Footer */}
       <footer className="bg-white dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 text-center text-xs text-slate-500 dark:text-slate-400">
            <p>&copy; {new Date().getFullYear()} Nexus SalesFlow. Prototipo generado para demostración.</p>
          </div>
       </footer>
    </div>
  );
};