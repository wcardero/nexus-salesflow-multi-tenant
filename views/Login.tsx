import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [storeId, setStoreId] = useState('');
  const [stores, setStores] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [checkingUsers, setCheckingUsers] = useState(true);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);

  useEffect(() => {
    const checkUsersExist = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/users/exists');
        const data = await response.json();
        setShowCreateAdmin(!data.exists);
      } catch (error) {
        console.error('Error checking if users exist:', error);
        setShowCreateAdmin(false);
      } finally {
        setCheckingUsers(false);
      }
    };
    checkUsersExist();
  }, []);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/stores/public');
        const data = await response.json();
        setStores(data);
      } catch (error) {
        console.error('Error fetching stores:', error);
      }
    };
    fetchStores();
  }, []);

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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: username, password, role: Role.ADMIN }),
      });

      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const newUser: User = await response.json();

      const loginResponse = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: username, password }),
      });

      if (!loginResponse.ok) throw new Error('Login failed after user creation');
      const loginData = await loginResponse.json();
      localStorage.setItem('token', loginData.token);

      alert(`Usuario '${newUser.name}' creado exitosamente.`);
      onLogin(newUser);
    } catch (error: any) {
      console.error('Error creating admin:', error);
      alert(`Error al crear el administrador: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLoginUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) {
      alert('Por favor, ingresa tu usuario y contraseña.');
      return;
    }
    setLoading(true);
    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: username, password, storeId: storeId || null }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        alert(errorData.message || 'Credenciales inválidas.');
        setLoading(false);
        return;
      }

      const loginResponse = await response.json();
      localStorage.setItem('token', loginResponse.token);
      const { token, ...user } = loginResponse;
      onLogin(user as User);
    } catch (error) {
      console.error('Login failed:', error);
      alert('Error al iniciar sesión.');
      setLoading(false);
    }
  };

  const renderForm = (
    title: string,
    subtitle: string,
    submitHandler: (e: React.FormEvent) => Promise<void>,
    buttonText: string,
    includeStoreSelect: boolean = false
  ) => (
    <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 font-display">
      <div className="w-full max-w-md bg-slate-50 dark:bg-slate-800 shadow-2xl rounded-2xl p-8 m-4">
        <h1 className="text-3xl font-black text-center bg-gradient-to-r from-primary-600 to-primary-500 bg-clip-text text-transparent mb-2 tracking-tight">
          Nexus SalesFlow
        </h1>
        <p className="text-center text-slate-600 dark:text-slate-400 mb-8">{subtitle}</p>

        <form onSubmit={submitHandler} className="space-y-6">
          <div>
            <label
              htmlFor="loginUsername"
              className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1"
            >
              Usuario
            </label>
            <input
              id="loginUsername"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              placeholder="Tu nombre de usuario"
              disabled={loading}
            />
          </div>
          <div>
            <label
              htmlFor="loginPassword"
              className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1"
            >
              Contraseña
            </label>
            <input
              id="loginPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
              placeholder="Tu contraseña"
              disabled={loading}
            />
          </div>
          {includeStoreSelect && (
            <div>
              <label
                htmlFor="loginStore"
                className="block text-sm font-medium text-slate-700 dark:text-slate-400 mb-1"
              >
                Tienda
              </label>
              <select
                id="loginStore"
                value={storeId}
                onChange={(e) => setStoreId(e.target.value)}
                className="mt-1 block w-full bg-slate-200 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded-lg shadow-sm py-2.5 px-4 focus:outline-none focus:ring-2 focus:ring-primary-500/50 focus:border-primary-500"
                disabled={loading}
              >
                <option value="">Seleccione su tienda</option>
                {stores.map(store => (
                  <option key={store.id} value={store.id}>{store.name}</option>
                ))}
              </select>
            </div>
          )}
          <button
            type="submit"
            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-4 rounded-lg transition-all shadow-md hover:shadow-lg disabled:bg-slate-400 disabled:cursor-not-allowed disabled:shadow-none"
            disabled={loading}
          >
            {loading ? 'Cargando...' : buttonText}
          </button>
        </form>
      </div>
    </div>
  );

  if (checkingUsers) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-200">
        <p>Cargando...</p>
      </div>
    );
  }

  if (showCreateAdmin) {
    return renderForm(
      'Bienvenido',
      'No hay usuarios registrados. Crea el primer administrador.',
      handleCreateAdmin,
      'Crear Administrador',
      false
    );
  }

  return renderForm('Iniciar Sesión', 'Inicia sesión con tu usuario y contraseña', handleLoginUser, 'Iniciar Sesión', true);
};

export default Login;
