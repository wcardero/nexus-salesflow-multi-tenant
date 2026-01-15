import db from '../db';

// ============================================================================
// Audit Logger
// ============================================================================

/**
 * Create an audit log entry for tracking all operations
 * 
 * @param userId - The ID of the user performing the action
 * @param action - The action being performed (e.g., 'CREATE_USER', 'UPDATE_STORE')
 * @param entityType - The type of entity being affected (e.g., 'User', 'Store')
 * @param entityId - The ID of the affected entity (optional)
 * @param oldValues - The state before the change (optional)
 * @param newValues - The state after the change (optional)
 * @param storeId - The store ID associated with this operation (optional)
 */
export const createAuditLog = async (
  userId: string,
  action: string,
  entityType: string,
  entityId?: string,
  oldValues?: any,
  newValues?: any,
  storeId?: string
): Promise<void> => {
  try {
    const auditId = `audit-${Date.now()}`;
    await db.query(
      'INSERT INTO "AuditLog" (id, "userId", "action", "entityType", "entityId", "oldValues", "newValues", "storeId") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [auditId, userId, action, entityType, entityId, oldValues, newValues, storeId]
    );
  } catch (error) {
    // Log error but don't throw - audit logging shouldn't break main functionality
    console.error('Error creating audit log:', error);
  }
};

// ============================================================================
// Audit Log Types
// ============================================================================

export type AuditAction =
  | 'CREATE_USER'
  | 'UPDATE_USER'
  | 'DELETE_USER'
  | 'CHANGE_PASSWORD'
  | 'CREATE_STORE'
  | 'UPDATE_STORE'
  | 'DELETE_STORE'
  | 'ASSIGN_MANAGER_TO_STORE'
  | 'REMOVE_MANAGER_FROM_STORE'
  | 'CREATE_PRODUCT'
  | 'UPDATE_PRODUCT'
  | 'DELETE_PRODUCT'
  | 'UPDATE_STOCK'
  | 'DELETE_STOCK'
  | 'CREATE_ASSIGNED_INVENTORY'
  | 'CONFIRM_INVENTORY'
  | 'REJECT_INVENTORY'
  | 'RESOLVE_CONFLICT'
  | 'CREATE_SALE'
  | 'DELETE_SALE'
  | 'MARK_SALE_PAID'
  | 'CREATE_CLOSING'
  | 'COMPLETE_CLOSING'
  | 'CREATE_EXCHANGE_RATE'
  | 'LOGIN'
  | 'LOGOUT';

export const AUDIT_ACTIONS: Record<string, AuditAction> = {
  USER_CREATED: 'CREATE_USER',
  USER_UPDATED: 'UPDATE_USER',
  USER_DELETED: 'DELETE_USER',
  PASSWORD_CHANGED: 'CHANGE_PASSWORD',
  STORE_CREATED: 'CREATE_STORE',
  STORE_UPDATED: 'UPDATE_STORE',
  STORE_DELETED: 'DELETE_STORE',
  MANAGER_ASSIGNED: 'ASSIGN_MANAGER_TO_STORE',
  MANAGER_REMOVED: 'REMOVE_MANAGER_FROM_STORE',
  PRODUCT_CREATED: 'CREATE_PRODUCT',
  PRODUCT_UPDATED: 'UPDATE_PRODUCT',
  PRODUCT_DELETED: 'DELETE_PRODUCT',
  STOCK_UPDATED: 'UPDATE_STOCK',
  STOCK_DELETED: 'DELETE_STOCK',
  INVENTORY_ASSIGNED: 'CREATE_ASSIGNED_INVENTORY',
  INVENTORY_CONFIRMED: 'CONFIRM_INVENTORY',
  INVENTORY_REJECTED: 'REJECT_INVENTORY',
  CONFLICT_RESOLVED: 'RESOLVE_CONFLICT',
  SALE_CREATED: 'CREATE_SALE',
  SALE_DELETED: 'DELETE_SALE',
  SALE_PAID: 'MARK_SALE_PAID',
  CLOSING_CREATED: 'CREATE_CLOSING',
  CLOSING_COMPLETED: 'COMPLETE_CLOSING',
  EXCHANGE_RATE_CREATED: 'CREATE_EXCHANGE_RATE',
};

// ============================================================================
// Helper Functions for Common Audit Operations
// ============================================================================

export const auditUserLogin = async (userId: string, storeId?: string): Promise<void> => {
  await createAuditLog(userId, 'LOGIN', 'User', userId, null, { loginAt: new Date() }, storeId);
};

export const auditUserCreation = async (
  userId: string,
  createdUserId: string,
  newUser: any,
  storeId?: string
): Promise<void> => {
  await createAuditLog(userId, 'CREATE_USER', 'User', createdUserId, null, newUser, storeId);
};

export const auditUserUpdate = async (
  userId: string,
  targetUserId: string,
  oldUser: any,
  newUser: any,
  storeId?: string
): Promise<void> => {
  await createAuditLog(userId, 'UPDATE_USER', 'User', targetUserId, oldUser, newUser, storeId);
};

export const auditUserDeletion = async (
  userId: string,
  deletedUserId: string,
  deletedUser: any,
  storeId?: string
): Promise<void> => {
  await createAuditLog(userId, 'DELETE_USER', 'User', deletedUserId, deletedUser, null, storeId);
};

export const auditStoreCreation = async (
  userId: string,
  storeId: string,
  store: any
): Promise<void> => {
  await createAuditLog(userId, 'CREATE_STORE', 'Store', storeId, null, store, storeId);
};

export const auditStoreUpdate = async (
  userId: string,
  storeId: string,
  oldStore: any,
  newStore: any
): Promise<void> => {
  await createAuditLog(userId, 'UPDATE_STORE', 'Store', storeId, oldStore, newStore, storeId);
};

export const auditStoreDeletion = async (
  userId: string,
  storeId: string,
  deletedStore: any
): Promise<void> => {
  await createAuditLog(userId, 'DELETE_STORE', 'Store', storeId, deletedStore, null, storeId);
};

export const auditInventoryAssignment = async (
  userId: string,
  assignmentId: string,
  assignment: any,
  storeId?: string
): Promise<void> => {
  await createAuditLog(userId, 'CREATE_ASSIGNED_INVENTORY', 'AssignedInventory', assignmentId, null, assignment, storeId);
};

export const auditInventoryConfirmation = async (
  userId: string,
  assignmentId: string,
  assignment: any,
  storeId?: string
): Promise<void> => {
  await createAuditLog(userId, 'CONFIRM_INVENTORY', 'AssignedInventory', assignmentId, null, assignment, storeId);
};

export const auditSaleCreation = async (
  userId: string,
  saleId: string, 
  sale: any,
  storeId?: string
): Promise<void> => {
  await createAuditLog(userId, 'CREATE_SALE', 'Sale', saleId, null, sale, storeId);
};

export const auditSaleDeletion = async (
  userId: string,
  saleId: string,
  sale: any,
  storeId?: string
): Promise<void> => {
  await createAuditLog(userId, 'DELETE_SALE', 'Sale', saleId, sale, null, storeId);
};

export const auditClosingCreation = async (
  userId: string,
  closingId: string,
  closing: any,
  storeId?: string
): Promise<void> => {
  await createAuditLog(userId, 'CREATE_CLOSING', 'Closing', closingId, null, closing, storeId);
};

export const auditClosingCompletion = async (
  userId: string,
  closingId: string,
  oldClosing: any,
  newClosing: any,
  storeId?: string
): Promise<void> => {
  await createAuditLog(userId, 'COMPLETE_CLOSING', 'Closing', closingId, oldClosing, newClosing, storeId);
};

export const auditPasswordChange = async (
  userId: string,
  targetUserId: string
): Promise<void> => {
  await createAuditLog(userId, 'CHANGE_PASSWORD', 'User', targetUserId, null, { changedAt: new Date() });
};
