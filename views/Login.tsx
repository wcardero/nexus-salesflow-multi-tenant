// views/Login.tsx
import React, { useState } from 'react';
import { User, MockDB, Role } from '../types';

interface LoginProps {
  db: MockDB;
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ db, onLogin }) => {
  const [newUserName, setNewUserName] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserName || !newPassword) {
      alert('Por favor, ingresa un nombre de usuario y contraseña.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: newUserName, password: newPassword, role: Role.ADMIN }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const newUser: User = await response.json();
      alert(`Usuario '${newUser.name}' creado exitosamente.`);
      onLogin(newUser); // Auto-login the new admin
    } catch (error: any) {
      console.error('Error creating admin:', error);
      alert(`Error al crear el administrador: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginUser = async (user: User, passwordAttempt: string) => {
    try {
        const response = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: user.name, password: passwordAttempt }),
        });

        if (!response.ok) {
            alert('Credenciales inválidas.');
            return false;
        }

        const loggedInUser: User = await response.json();
        onLogin(loggedInUser);
        return true;
    } catch (error) {
        console.error('Login failed:', error);
        alert('Error al iniciar sesión.');
        return false;
    }
  }


  if (db.users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-center text-sky-600 dark:text-sky-400 mb-2">
            Nexus SalesFlow
          </h1>
          <p className="text-center text-slate-500 dark:text-slate-400 mb-8">
            No hay usuarios registrados. Crea el primer usuario administrador.
          </p>

          <form onSubmit={handleCreateAdmin} className="space-y-4">
            <div>
              <label htmlFor="adminName" className="block text-sm font-medium text-slate-600 dark:text-slate-400">Nombre de Usuario</label>
              <input
                id="adminName"
                type="text"
                value={newUserName}
                onChange={(e) => setNewUserName(e.target.value)}
                className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                placeholder="ej: admin"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="adminPassword" className="block text-sm font-medium text-slate-600 dark:text-slate-400">Contraseña</label>
              <input
                id="adminPassword"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
                placeholder="ej: admin123"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear Administrador'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // If there are users, display the selection
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [passwordAttempt, setPasswordAttempt] = useState('');

  if (!selectedUser) {
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
                onClick={() => setSelectedUser(user)}
                className="w-full text-left p-4 rounded-lg bg-slate-50 dark:bg-slate-700/50 hover:bg-slate-100 dark:hover:bg-slate-700 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-sky-500"
              >
                <p className="font-bold text-slate-800 dark:text-slate-200">{user.name}</p>
                <p className="text-sm text-sky-600 dark:text-sky-500 font-semibold">{user.role}</p>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Password entry for selected user
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await handleLoginUser(selectedUser, passwordAttempt);
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-center text-sky-600 dark:text-sky-400 mb-2">
          Nexus SalesFlow
        </h1>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-4">
          Inicia sesión como <span className="font-bold text-sky-600 dark:text-sky-400">{selectedUser.name}</span>
        </p>

        <form onSubmit={handlePasswordSubmit} className="space-y-4">
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-600 dark:text-slate-400">Contraseña</label>
            <input
              id="password"
              type="password"
              value={passwordAttempt}
              onChange={(e) => setPasswordAttempt(e.target.value)}
              className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sky-500 focus:border-sky-500 sm:text-sm"
              placeholder="Ingresa tu contraseña"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-sky-600 hover:bg-sky-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
          <button
            type="button"
            onClick={() => setSelectedUser(null)}
            className="w-full bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 hover:bg-slate-300 dark:hover:bg-slate-600 font-bold py-2 px-4 rounded-md transition-colors mt-2"
            disabled={loading}
          >
            Cambiar de Usuario
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
