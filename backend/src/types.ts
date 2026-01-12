// types.ts

/**
 * Roles de usuario en el sistema.
 */
export enum Role {
  ADMIN = 'Admin',
  DIRECTOR = 'Director',
  MANAGER = 'Manager',
  GESTOR = 'Gestor',
}

/**
 * Representa un usuario en el sistema.
 */
export interface User {
  id: string;
  name: string;
  role: Role;
  storeId?: string; // El admin no tiene tienda, los otros sí
}

/**
 * Representa una tienda.
 */
export interface Store {
  id: string;
  name: string;
  // Un historial para permitir cambios en el tiempo
  exchangeRates: ExchangeRate[];
  defaultCommissionRate: number; // e.g., 0.10 for 10%
  managerIds?: string[]; // IDs of managers assigned to this store
}

/**
 * Representa un tipo de cambio en un momento dado.
 */
export interface ExchangeRate {
  id: string;
  rate: number; // Factor de conversión (e.g., 300)
  startDate: Date; // Fecha de inicio de vigencia
  endDate?: Date; // Opcional: si no está, es el vigente
}

/**
 * Representa la definición de un producto.
 */
export interface Product {
  id: string;
  storeId: string;
  name: string;
  costUSD?: number; // compra_usd
  costMN?: number; // compra_mn
  margin: number; // margen_pct (e.g., 0.30 for 30%)
  commissionRate?: number; // Comisión específica para este producto (opcional)
  createdBy?: string; // ID del usuario que creó el producto
  currency?: 'USD' | 'MN'; // Moneda del costo
  priceMN?: number; // Precio final calculado en MN (incluye margen)
  gestorCommissionMN?: number; // Comisión del gestor en MN calculada
}

/**
 * Representa un item de inventario físico asignado a un gestor.
 */
export interface InventoryItem {
  id: string;
  productId: string;
  gestorId: string;
  assignedAt: Date;
  status: 'Available' | 'Sold';
  saleId?: string;
}

/**
 * Represents product stock at the store level.
 */
export interface ProductStock {
  id: string;
  productId: string;
  storeId: string;
  quantity: number;
}

/**
 * Represents assigned inventory quantities to a gestor.
 */
export interface AssignedInventory {
  id: string;
  productId: string;
  gestorId: string;
  quantity: number;
  assignedAt: Date;
}

/**
 * Representa una venta realizada por un gestor.
 */
export interface Sale {
  id: string;
  inventoryItemId: string;
  gestorId: string;
  soldAt: Date;
  // Congela los valores al momento de la venta
  exchangeRateUsed: number;
  costUSD: number;
  costMN: number;
  margin: number;
  // Cálculos congelados
  saleUSD: number;
  baseMN: number;
  commission: number;
  finalMN: number;
  paymentStatus: SalePaymentStatus;
  customerName?: string;
}

/**
 * Estados del proceso de cierre de caja.
 */
export enum ClosingStatus {
  PENDING = 'PENDING', // El gestor ya cerró, pendiente de entrega de dinero
  COMPLETED = 'COMPLETED', // El manager confirmó la recepción del dinero
}

/**
 * Estados de pago de una venta.
 */
export enum SalePaymentStatus {
  PAID = 'PAID', // Pago al contado
  PENDING = 'PENDING' // Venta al crédito
}

/**
 * Representa un cierre de caja de un gestor.
 */
export interface Closing {
  id: string;
  gestorId: string;
  initiatedAt: Date;
  completedAt?: Date;
  status: ClosingStatus;
  sales: Sale[];
  // Totales del cierre
  totalBaseMN: number;
  totalCommission: number;
  totalFinalMN: number;
}

/**
 * Represents an audit log entry.
 */
export interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId?: string;
  oldValues?: any;
  newValues?: any;
  timestamp: Date;
  storeId?: string;
}

/**
 * La base de datos simulada que contiene todos los datos de la aplicación.
 */
export interface MockDB {
  users: User[];
  stores: Store[];
  products: Product[];
  inventory: InventoryItem[];
  productStock: ProductStock[];
  assignedInventory: AssignedInventory[];
  sales: Sale[];
  closings: Closing[];
  auditLogs: AuditLog[];
}
