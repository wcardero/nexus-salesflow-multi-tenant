// views/Login.tsx
import React, { useState } from 'react';
import { User, MockDB, Role } from '../types';

interface LoginProps {
  db: MockDB;
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ db, onLogin }) => {
  const [username, setUsername] = useState(''); // Use username for traditional login
  const [password, setPassword] = useState(''); // Use password for traditional login
  const [loading, setLoading] = useState(false);

  const handleCreateAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
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
        body: JSON.stringify({ name: username, password: password, role: Role.ADMIN }),
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

  const handleLoginUser = async (loginUsername: string, loginPasswordAttempt: string) => {
    setLoading(true);
    try {
        const response = await fetch('http://localhost:3001/api/login', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ name: loginUsername, password: loginPasswordAttempt }),
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
    } finally {
      setLoading(false);
    }
  }


  if (db.users.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
        <div className="w-full max-w-md bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-center text-primary-600 dark:text-primary-400 mb-2">
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
                value={username} // Use username state
                onChange={(e) => setUsername(e.target.value)} // Update username state
                className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="ej: admin"
                disabled={loading}
              />
            </div>
            <div>
              <label htmlFor="adminPassword" className="block text-sm font-medium text-slate-600 dark:text-slate-400">Contraseña</label>
              <input
                id="adminPassword"
                type="password"
                value={password} // Use password state
                onChange={(e) => setPassword(e.target.value)} // Update password state
                className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="ej: admin123"
                disabled={loading}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Creando...' : 'Crear Administrador'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Traditional Login form
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      alert('Por favor, ingresa tu usuario y contraseña.');
      return;
    }
    await handleLoginUser(username, password);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
      <div className="w-full max-w-md bg-white dark:bg-slate-800 shadow-xl rounded-2xl p-8">
        <h1 className="text-3xl font-bold text-center text-primary-600 dark:text-primary-400 mb-2">
          Nexus SalesFlow
        </h1>
        <p className="text-center text-slate-500 dark:text-slate-400 mb-8">
          Inicia sesión con tu usuario y contraseña
        </p>

        <form onSubmit={handleLoginSubmit} className="space-y-4">
          <div>
            <label htmlFor="loginUsername" className="block text-sm font-medium text-slate-600 dark:text-slate-400">Usuario</label>
            <input
              id="loginUsername"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Tu nombre de usuario"
              disabled={loading}
            />
          </div>
          <div>
            <label htmlFor="loginPassword" className="block text-sm font-medium text-slate-600 dark:text-slate-400">Contraseña</label>
            <input
              id="loginPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Tu contraseña"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-2 px-4 rounded-md transition-colors disabled:bg-slate-400 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Iniciando sesión...' : 'Iniciar Sesión'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
