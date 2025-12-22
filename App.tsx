import React, { useState, useMemo, useEffect } from 'react';
import { Role, User, Store, MockDB } from './types';
import AdminDashboard from './views/AdminDashboard';
import ManagerDashboard from './views/ManagerDashboard';
import GestorDashboard from './views/GestorDashboard';
import Login from './views/Login';
import { Layout } from './components/Layout';
import DirectorDashboard from './views/DirectorDashboard';
import StoreManagement from './views/StoreManagement';
import UserManagement from './views/UserManagement';

const App: React.FC = () => {
  const [db, setDb] = useState<MockDB | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [checkingAuth, setCheckingAuth] = useState(true); // New state to track auth check
  const [currentView, setCurrentView] = useState('dashboard');

  const handleNavigate = (view: string) => {
    setCurrentView(view);
  };

  const refreshDb = async () => {
    try {
      // Get the token from localStorage or wherever it's stored
      const token = localStorage.getItem('token');

      if (!token) {
        // If there's no token, don't show an error, just return
        // The user will be redirected to login via the rendering logic
        return;
      }

      const resources = ['users', 'stores', 'products', 'inventory', 'product-stock', 'assigned-inventory', 'sales', 'closings', 'audit-logs'];
      const promises = resources.map(resource =>
        fetch(`http://localhost:3001/api/${resource}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).then(res => {
          if (!res.ok) {
            if ((res.status === 401 || res.status === 403)) {
              // For the 'users' endpoint, a 403 is expected for non-admins.
              // Return an empty array instead of throwing an error.
              if (resource === 'users') {
                return [];
              }
              // For any other endpoint, a 401/403 is a real authentication problem.
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              window.location.href = '/';
            }
            throw new Error(`HTTP error for ${resource}! status: ${res.status}`);
          }
          return res.json();
        })
      );

      const [users, stores, products, inventory, productStock, assignedInventory, sales, closings, auditLogs] = await Promise.all(promises);

      // Assemble the database object
      const data: MockDB = { users, stores, products, inventory, productStock, assignedInventory, sales, closings, auditLogs };

      // Dates are transmitted as strings, so we need to convert them back to Date objects
      data.stores.forEach(s => s.exchangeRates.forEach(xr => {
          xr.startDate = new Date(xr.startDate);
          if(xr.endDate) xr.endDate = new Date(xr.endDate);
      }));
      data.inventory.forEach(i => i.assignedAt = new Date(i.assignedAt));
      data.assignedInventory.forEach(i => i.assignedAt = new Date(i.assignedAt));
      data.sales.forEach(s => s.soldAt = new Date(s.soldAt));
      data.closings.forEach(c => {
          c.initiatedAt = new Date(c.initiatedAt);
          if(c.completedAt) c.completedAt = new Date(c.completedAt);
      });
      data.auditLogs.forEach(log => log.timestamp = new Date(log.timestamp));

      setDb(data);
    } catch (err: any) {
      setError(`Failed to fetch data: ${err.message}`);
      console.error(err);
    }
  };

  useEffect(() => {
    const checkAuthAndLoadData = async () => {
      const token = localStorage.getItem('token');
      const userJson = localStorage.getItem('user');

      if (token && userJson) {
        // If there's a token, try to load the database
        try {
          const user = JSON.parse(userJson);
          console.log(`DEBUG: Loaded user from localStorage:`, user);
          console.log(`DEBUG: User role from localStorage: '${user.role}' (type: ${typeof user.role}, length: ${user.role.length})`);
          console.log(`DEBUG: User role character codes:`, Array.from(user.role).map(char => `${char}:${char.charCodeAt(0)}`));

          setCurrentUser(user);
          // Verify token is still valid by making a simple request
          const response = await fetch('http://localhost:3001/api/users', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            // Token is valid, load the full database
            await refreshDb();
          } else {
            // Token is invalid/expired, remove it and show login
            handleLogout();
          }
        } catch (err) {
          // Network error or other issue, remove token and show login
          handleLogout();
        }
      }
      setCheckingAuth(false);
    };

    checkAuthAndLoadData();
  }, []);

  const activeStore = useMemo(() => {
    if (currentUser?.storeId && db) {
      // For Gestors who have a direct storeId assignment
      return db.stores.find(s => s.id === currentUser.storeId);
    } else if (currentUser?.role?.trim() === 'Manager' && db) {
      // For Managers, find the store through their assignments
      // Look for stores where this manager is assigned via the managerIds field
      return db.stores.find(store => store.managerIds?.includes(currentUser.id));
    }
    return undefined;
  }, [currentUser, db]);

  const handleLogin = (user: User) => {
    console.log(`DEBUG: handleLogin called with user:`, user);
    console.log(`DEBUG: handleLogin - user role: '${user.role}' (type: ${typeof user.role}, length: ${user.role.length})`);
    console.log(`DEBUG: handleLogin - user role character codes:`, Array.from(user.role).map(char => `${char}:${char.charCodeAt(0)}`));

    setCurrentUser(user);
    localStorage.setItem('user', JSON.stringify(user));
    refreshDb(); // Refresh data after login, especially if a new user was created
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setDb(null);
    // Clear the token from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };
  
  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <p>Loading...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  if (!db) {
    // If database is still null after auth check, load empty data for Login component
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <p>Loading database...</p>
      </div>
    );
  }

  const renderContent = () => {
    // Normalize the role string by trimming whitespace and handling special characters
    const normalizeRole = (role: string): string => {
      // Remove leading/trailing whitespace and normalize the role
      let normalizedRole = role.trim();

      // Remove any potential invisible characters or zero-width spaces
      normalizedRole = normalizedRole.replace(/[\u200B-\u200D\uFEFF]/g, '');

      // Remove any other common invisible characters
      normalizedRole = normalizedRole.replace(/[\u00A0\u1680\u2000-\u200B\u2028\u2029\u202F\u205F\u3000]/g, '');

      // Check if the role matches any of our known roles exactly (case-insensitive)
      if (normalizedRole.toLowerCase() === 'admin') return 'Admin';
      if (normalizedRole.toLowerCase() === 'director') return 'Director';
      if (normalizedRole.toLowerCase() === 'manager') return 'Manager';
      if (normalizedRole.toLowerCase() === 'gestor') return 'Gestor';

      // If it doesn't match any known role, return the normalized version
      return normalizedRole;
    };

    const role = normalizeRole(currentUser.role);

    switch (currentView) {
      case 'dashboard':
        // Use comprehensive role checking
        const roleChecks = {
          isManager: role === 'Manager' || role.toLowerCase() === 'manager',
          isAdmin: role === 'Admin' || role.toLowerCase() === 'admin',
          isDirector: role === 'Director' || role.toLowerCase() === 'director',
          isGestor: role === 'Gestor' || role.toLowerCase() === 'gestor'
        };

        if (roleChecks.isManager) {
          if (!activeStore) return <div>Error: Manager sin tienda asignada.</div>;
          return <ManagerDashboard user={currentUser} store={activeStore} db={db} setDb={setDb} />;
        } else if (roleChecks.isAdmin) {
          return <AdminDashboard db={db} refreshDb={refreshDb} />;
        } else if (roleChecks.isDirector) {
          if (!activeStore) return <div>Error: Director sin tienda asignada.</div>;
          return <DirectorDashboard />;
        } else if (roleChecks.isGestor) {
          if (!activeStore) return <div>Error: Gestor sin tienda asignada.</div>;
          return <GestorDashboard user={currentUser} store={activeStore} db={db} />;
        } else {
          return <div className="p-4">Acceso denegado. Rol no reconocido. Original: '${currentUser.role}', Normalized: '${role}'</div>;
        }
      case 'stores':
        if (role === 'Admin') {
          return <StoreManagement db={db} refreshDb={refreshDb} />;
        } else {
          return <div className="p-4">Acceso denegado. Rol no reconocido. Original: '{currentUser.role}', Normalized: '{role}'</div>;
        }
      case 'users':
        if (role === 'Admin') {
          return <UserManagement db={db} refreshDb={refreshDb} />;
        } else {
          return <div className="p-4">Acceso denegado. Rol no reconocido. Original: '{currentUser.role}', Normalized: '{role}'</div>;
        }
      case 'managers':
        if (role === 'Director') {
          return <DirectorDashboard db={db} refreshDb={refreshDb} />;
        } else {
          return <div className="p-4">Acceso denegado. Rol no reconocido. Original: '{currentUser.role}', Normalized: '{role}'</div>;
        }
      case 'inventory':
        // Managers and Directors can access inventory
        if (role === 'Manager' || role === 'Director') {
          if (!activeStore) return <div>Error: Usuario sin tienda asignada.</div>;
          return <ManagerDashboard user={currentUser} store={activeStore} db={db} refreshDb={refreshDb} />;
        } else if (role === 'Gestor') {
          if (!activeStore) return <div>Error: Gestor sin tienda asignada.</div>;
          return <GestorDashboard user={currentUser} store={activeStore} db={db} />;
        } else {
          return <div className="p-4">Acceso denegado. Rol no reconocido. Original: '${currentUser.role}', Normalized: '${role}'</div>;
        }
      case 'closings':
        // All roles except Admin can access closings
        if (role === 'Director' || role === 'Manager' || role === 'Gestor') {
          if (!activeStore) return <div>Error: Usuario sin tienda asignada.</div>;
          if (role === 'Gestor') {
            return <GestorDashboard user={currentUser} store={activeStore} db={db} />;
          } else {
            // For Director/Manager, show the manager dashboard for closure management
            return <ManagerDashboard user={currentUser} store={activeStore} db={db} refreshDb={refreshDb} />;
          }
        } else {
          return <div className="p-4">Acceso denegado. Rol no reconocido. Original: '${currentUser.role}', Normalized: '${role}'</div>;
        }
      // Add other cases for other views here
      default:
        return <div>Vista no encontrada</div>;
    }
  };

  return (
    <Layout 
      currentUser={currentUser} 
      onLogout={handleLogout}
      storeName={activeStore?.name}
      onNavigate={handleNavigate}
      currentView={currentView}
    >
      {renderContent()}
    </Layout>
  );
};

export default App;
