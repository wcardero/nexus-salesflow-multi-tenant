// views/Login.tsx
import React from 'react';
import { User, MockDB } from '../types';

interface LoginProps {
  db: MockDB;
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ db, onLogin }) => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-center text-sky-600 dark:text-sky-400 mb-2">
          Nexus SalesFlow
        </h1>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-8">
          Selecciona un usuario para iniciar sesión
        </p>

        <div className="space-y-3">
          {db.users.map(user => (
            <button
              key={user.id}
              onClick={() => onLogin(user)}
              className="w-full text-left p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
            >
              <p className="font-bold text-slate-800 dark:text-slate-200">{user.name}</p>
              <p className="text-sm text-sky-600 dark:text-sky-500 font-semibold">{user.role}</p>
            </button>
          ))}
        </div>

        <p className="text-xs text-center text-slate-400 dark:text-slate-500 mt-8">
          Esto es una simulación de inicio de sesión. En una aplicación real, aquí habría un formulario de usuario/contraseña.
        </p>
      </div>
    </div>
  );
};

export default Login;
