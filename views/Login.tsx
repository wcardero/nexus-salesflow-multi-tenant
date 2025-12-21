import React, { useState, useEffect } from 'react';
import { User, Role } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
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
        body: JSON.stringify({ name: username, password }),
      });

      if (!response.ok) {
        alert('Credenciales inválidas.');
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
    buttonText: string
  ) => (
    <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark font-display">
      <div className="w-full max-w-md bg-white dark:bg-gray-800 shadow-2xl rounded-2xl p-8 m-4">
        <h1 className="text-3xl font-black text-center text-gray-800 dark:text-gray-200 mb-2 tracking-tight">
          Nexus SalesFlow
        </h1>
        <p className="text-center text-gray-600 dark:text-gray-400 mb-8">{subtitle}</p>

        <form onSubmit={submitHandler} className="space-y-6">
          <div>
            <label
              htmlFor="loginUsername"
              className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1"
            >
              Usuario
            </label>
            <input
              id="loginUsername"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="mt-1 block w-full bg-background-light dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Tu nombre de usuario"
              disabled={loading}
            />
          </div>
          <div>
            <label
              htmlFor="loginPassword"
              className="block text-sm font-medium text-gray-600 dark:text-gray-400 mb-1"
            >
              Contraseña
            </label>
            <input
              id="loginPassword"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full bg-background-light dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg shadow-sm py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary/50"
              placeholder="Tu contraseña"
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-primary hover:bg-blue-600 text-white font-bold py-3 px-4 rounded-lg transition-colors shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
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
      <div className="flex items-center justify-center min-h-screen bg-background-light dark:bg-background-dark">
        <p>Cargando...</p>
      </div>
    );
  }

  if (showCreateAdmin) {
    return renderForm(
      'Bienvenido',
      'No hay usuarios registrados. Crea el primer administrador.',
      handleCreateAdmin,
      'Crear Administrador'
    );
  }

  return renderForm('Iniciar Sesión', 'Inicia sesión con tu usuario y contraseña', handleLoginUser, 'Iniciar Sesión');
};

export default Login;
