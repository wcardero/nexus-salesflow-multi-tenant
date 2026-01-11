// store.ts

import { MockDB, Role, User, Store, Product, InventoryItem, ClosingStatus, SalePaymentStatus } from './types';

// ====================================================================================
// IDs para mantener consistencia
// ====================================================================================
const ADMIN_ID = 'user-admin-01';
const MANAGER_A_ID = 'user-manager-01';
const MANAGER_B_ID = 'user-manager-02';
const GESTOR_A1_ID = 'user-gestor-01';
const GESTOR_A2_ID = 'user-gestor-02';
const GESTOR_B1_ID = 'user-gestor-03';

const STORE_A_ID = 'store-a';
const STORE_B_ID = 'store-b';

const PRODUCT_1_ID = 'prod-001';
const PRODUCT_2_ID = 'prod-002';
const PRODUCT_3_ID = 'prod-003';

// ====================================================================================
// MOCK DATABASE
// ====================================================================================

export let mockDB: MockDB = {
  // ================================================================================
  // USUARIOS
  // ================================================================================
  users: [
    { id: ADMIN_ID, name: 'Admin User', role: Role.ADMIN },
    { id: MANAGER_A_ID, name: 'Manager A', role: Role.MANAGER, storeId: STORE_A_ID },
    { id: MANAGER_B_ID, name: 'Manager B', role: Role.MANAGER, storeId: STORE_B_ID },
    { id: GESTOR_A1_ID, name: 'Gestor A1', role: Role.GESTOR, storeId: STORE_A_ID },
    { id: GESTOR_A2_ID, name: 'Gestor A2', role: Role.GESTOR, storeId: STORE_A_ID },
    { id: GESTOR_B1_ID, name: 'Gestor B1', role: Role.GESTOR, storeId: STORE_B_ID },
  ],

  // ================================================================================
  // TIENDAS
  // ================================================================================
  stores: [
    {
      id: STORE_A_ID,
      name: 'Tienda Principal',
      defaultCommissionRate: 0.10,
      exchangeRates: [
        { id: 'xr-a-1', rate: 290, startDate: new Date('2023-01-01'), endDate: new Date('2023-06-30') },
        { id: 'xr-a-2', rate: 300, startDate: new Date('2023-07-01') },
      ],
    },
    {
      id: STORE_B_ID,
      name: 'Sucursal Norte',
      defaultCommissionRate: 0.12,
      exchangeRates: [
        { id: 'xr-b-1', rate: 305, startDate: new Date('2023-01-01') },
      ],
    },
  ],

  // ================================================================================
  // PRODUCTOS
  // ================================================================================
  products: [
    { id: PRODUCT_1_ID, storeId: STORE_A_ID, name: 'Producto Alpha', costUSD: 10, margin: 0.30 },
    { id: PRODUCT_2_ID, storeId: STORE_A_ID, name: 'Producto Beta', costUSD: 25, margin: 0.25 },
    { id: PRODUCT_3_ID, storeId: STORE_B_ID, name: 'Producto Gamma', costUSD: 50, margin: 0.20 },
  ],
  
  // ================================================================================
  // INVENTARIO
  // ================================================================================
  inventory: [
    // Inventario para Gestor A1 (Tienda A)
    { id: 'inv-001', productId: PRODUCT_1_ID, gestorId: GESTOR_A1_ID, assignedAt: new Date(), status: 'Available' },
    { id: 'inv-002', productId: PRODUCT_1_ID, gestorId: GESTOR_A1_ID, assignedAt: new Date(), status: 'Available' },
    { id: 'inv-003', productId: PRODUCT_2_ID, gestorId: GESTOR_A1_ID, assignedAt: new Date(), status: 'Available' },
    
    // Inventario para Gestor A2 (Tienda A)
    { id: 'inv-004', productId: PRODUCT_1_ID, gestorId: GESTOR_A2_ID, assignedAt: new Date(), status: 'Available' },
    
    // Inventario para Gestor B1 (Tienda B)
    { id: 'inv-005', productId: PRODUCT_3_ID, gestorId: GESTOR_B1_ID, assignedAt: new Date(), status: 'Available' },
    { id: 'inv-006', productId: PRODUCT_3_ID, gestorId: GESTOR_B1_ID, assignedAt: new Date(), status: 'Available' },
    
    // Un item ya vendido para el ejemplo
    { id: 'inv-007', productId: PRODUCT_3_ID, gestorId: GESTOR_B1_ID, assignedAt: new Date('2023-10-01'), status: 'Sold', saleId: 'sale-001' }
  ],

  // ================================================================================
  // VENTAS
  // ================================================================================
  sales: [
    {
      id: 'sale-001',
      inventoryItemId: 'inv-007',
      gestorId: GESTOR_B1_ID,
      soldAt: new Date('2023-10-10'),
      exchangeRateUsed: 305,
      costUSD: 50,
      costMN: 15250,
      margin: 0.20,
      saleUSD: 60,
      baseMN: 18300,
      commission: 2196,
      finalMN: 20496,
      paymentStatus: SalePaymentStatus.PAID
    }
  ],
  
  // ================================================================================
  // CIERRES
  // ================================================================================
  closings: [
    {
      id: 'closing-001',
      gestorId: GESTOR_B1_ID,
      initiatedAt: new Date('2023-10-11'),
      status: ClosingStatus.PENDING,
      sales: [
        // En un caso real, aquí iría el objeto completo de la venta 'sale-001'
        // @ts-ignore
        { saleId: 'sale-001' } 
      ],
      totalBaseMN: 18300,
      totalCommission: 2196,
      totalFinalMN: 20496,
    }
  ],
};