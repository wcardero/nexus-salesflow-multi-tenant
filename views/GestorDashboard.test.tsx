import { render, screen, fireEvent } from '@testing-library/react';
import GestorDashboard from './GestorDashboard';
import { expect, describe, it, vi } from 'vitest';

describe('GestorDashboard', () => {
  it('renders a sell button for each inventory item', () => {
    // Mock data for the test
    const user = { id: 'gestor1', name: 'Gestor Name', role: 'Gestor' };
    const store = { id: 'store1', name: 'My Store', currency: 'USD', exchangeRates: [{ id: 'er1', rate: 1, startDate: new Date() }] };
    const db = {
      assignedInventory: [
        { id: 'inv1', productId: 'prod1', gestorId: 'gestor1', quantity: 10, priceMN: 100, status: 'Confirmed', assignedAt: new Date() },
        { id: 'inv2', productId: 'prod2', gestorId: 'gestor1', quantity: 5, priceMN: 200, status: 'Confirmed', assignedAt: new Date() },
      ],
      products: [
        { id: 'prod1', name: 'Product 1', currency: 'USD', price: 10, costUSD: 5, margin: 0.5, storeId: 'store1' },
        { id: 'prod2', name: 'Product 2', currency: 'USD', price: 20, costUSD: 10, margin: 0.5, storeId: 'store1' },
      ],
      sales: [],
      closings: [],
      users: [],
      stores: [],
    };
    const setDb = vi.fn();
    const refreshDb = vi.fn();

    render(
      <GestorDashboard
        user={user}
        store={store}
        db={db}
        setDb={setDb}
        refreshDb={refreshDb}
      />
    );

    // Switch to the 'Inventario y Ventas' tab
    const salesTabButton = screen.getByRole('button', { name: /inventario y ventas/i });
    fireEvent.click(salesTabButton);

    const sellButtons = screen.getAllByRole('button', { name: /vender/i });
    expect(sellButtons).toHaveLength(2);
  });

  it('opens and closes the sell modal', () => {
    // Mock data for the test
    const user = { id: 'gestor1', name: 'Gestor Name', role: 'Gestor' };
    const store = { id: 'store1', name: 'My Store', currency: 'USD', exchangeRates: [{ id: 'er1', rate: 1, startDate: new Date() }] };
    const db = {
      assignedInventory: [
        { id: 'inv1', productId: 'prod1', gestorId: 'gestor1', quantity: 10, priceMN: 100, status: 'Confirmed', assignedAt: new Date() },
      ],
      products: [
        { id: 'prod1', name: 'Product 1', currency: 'USD', price: 10, costUSD: 5, margin: 0.5, storeId: 'store1' },
      ],
      sales: [],
      closings: [],
      users: [],
      stores: [],
    };
    const setDb = vi.fn();
    const refreshDb = vi.fn();

    render(
      <GestorDashboard
        user={user}
        store={store}
        db={db}
        setDb={setDb}
        refreshDb={refreshDb}
      />
    );

    // Switch to the 'Inventario y Ventas' tab
    const salesTabButton = screen.getByRole('button', { name: /inventario y ventas/i });
    fireEvent.click(salesTabButton);

    // Click the "Vender" button
    const sellButton = screen.getByRole('button', { name: /vender/i });
    fireEvent.click(sellButton);

    // Check if the modal is open
    const modalTitle = screen.getByText(/vender producto/i);
    expect(modalTitle).toBeInTheDocument();

    // Click the "Cancelar" button to close the modal
    const cancelButton = screen.getByRole('button', { name: /cancelar/i });
    fireEvent.click(cancelButton);

    // Check if the modal is closed
    expect(screen.queryByText(/vender producto/i)).not.toBeInTheDocument();
  });

  it('displays product information in the sell modal', () => {
    // Mock data for the test
    const user = { id: 'gestor1', name: 'Gestor Name', role: 'Gestor' };
    const store = { id: 'store1', name: 'My Store', currency: 'USD', exchangeRates: [{ id: 'er1', rate: 1, startDate: new Date() }] };
    const db = {
      assignedInventory: [
        { id: 'inv1', productId: 'prod1', gestorId: 'gestor1', quantity: 10, priceMN: 100, status: 'Confirmed', assignedAt: new Date() },
      ],
      products: [
        { id: 'prod1', name: 'Product 1', currency: 'USD', price: 10, costUSD: 5, margin: 0.5, storeId: 'store1' },
      ],
      sales: [],
      closings: [],
      users: [],
      stores: [],
    };
    const setDb = vi.fn();
    const refreshDb = vi.fn();

    render(
      <GestorDashboard
        user={user}
        store={store}
        db={db}
        setDb={setDb}
        refreshDb={refreshDb}
      />
    );

    // Switch to the 'Inventario y Ventas' tab
    const salesTabButton = screen.getByRole('button', { name: /inventario y ventas/i });
    fireEvent.click(salesTabButton);

    // Click the "Vender" button
    const sellButton = screen.getByRole('button', { name: /vender/i });
    fireEvent.click(sellButton);

    // Check if the modal displays the correct information
    expect(screen.getByText(/producto: product 1/i)).toBeInTheDocument();
    expect(screen.getByText(/disponibles: 10/i)).toBeInTheDocument();
    // We are not testing the price here, as it is not part of the current task
  });
});

