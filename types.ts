
export enum Role {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  GESTOR = 'GESTOR'
}

export interface Store {
  id: string;
  name: string;
  location: string;
  exchangeRate: number; // Factor X (USD -> MN)
  commissionPct: number; // Default 0.10
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  storeId?: string;
  avatar?: string;
}

export interface Product {
  id: string;
  name: string;
  sku: string;
  costUsd: number;
  marginPct: number;
  stock: number; // Total manager stock
}

export interface InventoryBatch {
  id: string;
  productId: string;
  gestorId: string;
  quantity: number;
  assignedAt: string;
}

export interface Sale {
  id: string;
  gestorId: string;
  productId: string;
  quantity: number;
  exchangeRate: number; // Frozen at sale time
  costUsd: number;      // Frozen at sale time
  marginPct: number;    // Frozen at sale time
  mnBase: number;
  commission: number;
  mnFinal: number;
  timestamp: string;
}

export enum ClosureStatus {
  PENDING = 'PENDING',
  RECEIVED = 'RECEIVED'
}

export interface Closure {
  id: string;
  gestorId: string;
  storeId: string;
  totalCollected: number; // sum of mnFinal
  netToManager: number;   // sum of mnBase
  totalCommission: number; // sum of comision
  status: ClosureStatus;
  salesIds: string[];
  timestamp: string;
}
