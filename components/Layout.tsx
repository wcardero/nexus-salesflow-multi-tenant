// components/Layout.tsx

import React from 'react';
import { User } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  users: User[];
  currentUser: User;
  setCurrentUser: (user: User) => void;
  storeName?: string;
}

export const Layout: React.FC<LayoutProps> = ({ children, users, currentUser, setCurrentUser, storeName }) => {
  return (
    <div className="flex flex-col min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200">
      {/* Simulation Header */}
      <header className="bg-white dark:bg-slate-800 shadow-md z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-2">
            <div className="flex items-baseline gap-4">
              <h1 className="text-xl font-bold text-sky-600 dark:text-sky-400">
                Nexus SalesFlow
              </h1>
              {storeName && (
                <div className="flex items-center gap-2">
                   <span className="text-slate-400 dark:text-slate-500">|</span>
                   <span className="font-medium text-slate-600 dark:text-slate-300">{storeName}</span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-slate-500 dark:text-slate-400">Simulador de Rol:</span>
              <select
                value={currentUser.id}
                onChange={(e) => {
                  const user = users.find(u => u.id === e.target.value);
                  if (user) setCurrentUser(user);
                }}
                className="bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md px-3 py-1 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                {users.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
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