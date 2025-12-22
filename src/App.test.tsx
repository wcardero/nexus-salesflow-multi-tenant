import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import { Role, User, Store } from '../types';
import { ThemeProvider } from '../ThemeContext';

// Mock the fetch function
global.fetch = vi.fn();

const createFetchResponse = (data: any, ok = true) => {
  return { ok, json: () => new Promise((resolve) => resolve(data)) };
};

const mockManager: User = {
  id: 'user-manager-1',
  name: 'testmanager',
  role: 'Manager ' as Role, // Malformed with a trailing space
  storeId: null, // Managers don't have a direct storeId, they are assigned
};

const mockStore: Store = {
    id: 'store-1',
    name: 'Main Store',
    defaultCommissionRate: 0.1,
    exchangeRates: [],
    managerIds: [mockManager.id], // Assign the manager to this store
};

describe('App component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorage.clear();
  });

  it('should show access denied for a manager with a malformed role', async () => {
    // Mock fetch for all API calls
    (fetch as any).mockImplementation((url: string) => {
        if (url.endsWith('/api/login')) {
            return Promise.resolve(createFetchResponse({ token: 'fake-manager-token', ...mockManager }));
        }
        if (url.endsWith('/api/users/exists')) {
            return Promise.resolve(createFetchResponse({ exists: true }));
        }
        if (url.endsWith('/api/stores')) {
            // Return the store the manager is assigned to
            return Promise.resolve(createFetchResponse([mockStore]));
        }
        // Default mock for other refreshDb calls
        return Promise.resolve(createFetchResponse([]));
    });

    render(
      <ThemeProvider>
        <App />
      </ThemeProvider>
    );

    // Wait for the login form
    await screen.findByPlaceholderText('Tu nombre de usuario');

    // Simulate login
    fireEvent.change(screen.getByPlaceholderText('Tu nombre de usuario'), { target: { value: 'testmanager' } });
    fireEvent.change(screen.getByPlaceholderText('Tu contraseña'), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /iniciar sesión/i }));

    // 4. Assert that the manager dashboard IS shown and the error is NOT
    await waitFor(() => {
      // The manager dashboard should be visible
      expect(screen.getByText(/Cierres Pendientes de Validación/i)).toBeInTheDocument();
    });

    // And assert that the "Acceso denegado" message is NOT visible
    expect(screen.queryByText(/Acceso denegado. Rol no reconocido./i)).not.toBeInTheDocument();
  });
});
