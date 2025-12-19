
import { Role, Store, User, Product, Sale, Closure, ClosureStatus } from './types';

export const INITIAL_STORES: Store[] = [
  { id: 'st_1', name: 'Sucursal Centro', location: 'Madrid, ES', exchangeRate: 300, commissionPct: 0.10 },
  { id: 'st_2', name: 'Sucursal Norte', location: 'Barcelona, ES', exchangeRate: 310, commissionPct: 0.10 },
];

export const INITIAL_USERS: User[] = [
  { id: 'u_1', name: 'Admin Master', email: 'admin@nexus.com', role: Role.ADMIN },
  { id: 'u_2', name: 'Sarah Jenkins', email: 's.jenkins@store.com', role: Role.MANAGER, storeId: 'st_1', avatar: 'https://picsum.photos/seed/sarah/100/100' },
  { id: 'u_3', name: 'Alejandro M.', email: 'alejandro@gestor.com', role: Role.GESTOR, storeId: 'st_1', avatar: 'https://picsum.photos/seed/alejandro/100/100' },
];

export const INITIAL_PRODUCTS: Product[] = [
  { id: 'p_1', name: 'iPhone 13 Pro', sku: 'APP-13P', costUsd: 800, marginPct: 0.25, stock: 50 },
  { id: 'p_2', name: 'Sony WH-1000XM4', sku: 'SNY-XM4', costUsd: 250, marginPct: 0.30, stock: 30 },
  { id: 'p_3', name: 'Nike Air Max', sku: 'NKE-AM', costUsd: 100, marginPct: 0.40, stock: 100 },
];

// Mock database state
export const mockDB = {
  stores: INITIAL_STORES,
  users: INITIAL_USERS,
  products: INITIAL_PRODUCTS,
  batches: [] as any[],
  sales: [] as Sale[],
  closures: [] as Closure[]
};
