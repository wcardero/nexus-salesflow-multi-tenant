import { Request, Response } from 'express';
import db from '../db';
import { AuthenticatedRequest, isAdmin, isGestor } from '../middleware/auth.middleware';
import { validateProductStock, validateInventoryAssignment } from '../validators/stores.validator';
import { validationResult, ValidationChain } from 'express-validator';
import { createAuditLog } from '../utils/audit.utils';
import { updateInventoryAfterSale } from '../inventory';

export const getInventory = async (req: Request, res: Response) => {
  const requestingUser = (req as AuthenticatedRequest).user;
  const storeId = requestingUser?.storeId;

  let query = 'SELECT * FROM "InventoryItem"';
  const params: any[] = [];

  if (isAdmin(requestingUser?.role)) {
    // Admin sees all
  } else if (isGestor(requestingUser?.role)) {
    query += ' WHERE "gestorId" = $1';
    params.push(requestingUser?.id);
  } else {
    // Manager/Director see by store
    if (storeId) {
        query = `
            SELECT ii.* FROM "InventoryItem" ii
            JOIN "Product" p ON ii."productId" = p.id
            WHERE p."storeId" = $1
        `;
        params.push(storeId);
    }
  }

  try {
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get inventory error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ============================================================================
// Product Stock Controllers
// ============================================================================

export const getProductStock = async (req: Request, res: Response) => {
  const requestingUser = (req as AuthenticatedRequest).user;

  let storeCondition = '';
  const params: any[] = [];

  if (requestingUser?.role === 'Admin') {
    // Admin sees all, no condition
  } else if (requestingUser?.role === 'Manager') {
    storeCondition = `WHERE ps."storeId" IN (
      SELECT stum."A" FROM "_StoreToUser" stum
      JOIN "User" u ON stum."B" = u.id
      WHERE u.id = $1
    )`;
    params.push(requestingUser.id);
  } else if (requestingUser?.role === 'Gestor') {
    if (requestingUser?.storeId) {
      storeCondition = 'WHERE ps."storeId" = $1';
      params.push(requestingUser.storeId);
    } else {
      return res.status(403).json({ message: 'Gestor not assigned to a store.' });
    }
  }

  try {
    const query = `
      SELECT ps.*, p.name as productName, s.name as storeName
      FROM "ProductStock" ps
      JOIN "Product" p ON ps."productId" = p.id
      JOIN "Store" s ON ps."storeId" = s.id
      ${storeCondition}
    `;
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get product stock error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createOrUpdateProductStock = [
  validateProductStock,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { productId, storeId, quantity } = req.body;
    const requestingUser = (req as AuthenticatedRequest).user;

    if (requestingUser?.role !== 'Manager') {
      return res.status(403).json({ message: 'Access denied. Only managers can set product stock.' });
    }

    try {
      const storeAccess = await db.query(
        'SELECT * FROM "_StoreToUser" WHERE "A" = $1 AND "B" = $2',
        [storeId, requestingUser.id]
      );
      if (storeAccess.rows.length === 0) {
        return res.status(403).json({ message: 'Access denied. You do not have access to this store.' });
      }

      const existingStock = await db.query(
        'SELECT * FROM "ProductStock" WHERE "productId" = $1 AND "storeId" = $2',
        [productId, storeId]
      );

      let result;
      if (existingStock.rows.length > 0) {
        result = await db.query(
          'UPDATE "ProductStock" SET "quantity" = $1 WHERE "productId" = $2 AND "storeId" = $3 RETURNING *',
          [quantity, productId, storeId]
        );
      } else {
        const stockId = `stock-${Date.now()}`;
        result = await db.query(
          'INSERT INTO "ProductStock" (id, "productId", "storeId", "quantity") VALUES ($1, $2, $3, $4) RETURNING *',
          [stockId, productId, storeId, quantity]
        );
      }

      await createAuditLog(
        requestingUser.id,
        'UPDATE_STOCK',
        'ProductStock',
        result.rows[0]?.id,
        existingStock.rows[0] || null,
        result.rows[0],
        storeId
      );

      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error('Product stock error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
];

export const deleteProductStock = async (req: Request, res: Response) => {
  const { stockId } = req.params;
  const requestingUser = (req as AuthenticatedRequest).user;

  if (requestingUser?.role !== 'Manager' && requestingUser?.role !== 'Director') {
    return res.status(403).json({ message: 'Access denied. Only managers can delete product stock.' });
  }

  try {
    const stockResult = await db.query('SELECT * FROM "ProductStock" WHERE id = $1', [stockId]);
    if (stockResult.rows.length === 0) {
      return res.status(404).json({ message: 'Stock record not found.' });
    }

    const stock = stockResult.rows[0];

    const storeAccess = await db.query(
      'SELECT * FROM "_StoreToUser" WHERE "A" = $1 AND "B" = $2',
      [stock.storeId, requestingUser.id]
    );
    if (storeAccess.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied. You do not have access to this store.' });
    }

    const assignmentsCheck = await db.query(
      `SELECT COUNT(*) FROM "AssignedInventory" ai
       JOIN "Product" p ON ai."productId" = p.id
       WHERE p.id = $1 AND p."storeId" = $2 AND ai.status IN ('Pending', 'Confirmed', 'Rejected')`,
      [stock.productId, stock.storeId]
    );

    if (parseInt(assignmentsCheck.rows[0].count) > 0) {
      return res.status(400).json({ 
        message: 'No se puede eliminar el stock inicial porque existen asignaciones activas o conflictos pendientes asociados a este producto. Primero debe cancelar o resolver las asignaciones de los gestores.' 
      });
    }

    await db.query('DELETE FROM "ProductStock" WHERE id = $1', [stockId]);

    await createAuditLog(
      requestingUser.id,
      'DELETE_STOCK',
      'ProductStock',
      stockId,
      stock,
      null,
      stock.storeId
    );

    res.status(200).json({ message: 'Stock deleted successfully.' });
  } catch (error) {
    console.error('Product stock deletion error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ============================================================================
// Assigned Inventory Controllers
// ============================================================================

export const getAssignedInventory = async (req: Request, res: Response) => {
  const requestingUser = (req as AuthenticatedRequest).user;

  let condition = '';
  const params: any[] = [];

  if (requestingUser?.role === 'Admin') {
    // Admin sees all
  } else if (requestingUser?.role === 'Manager') {
    condition = `WHERE ai."gestorId" IN (
      SELECT u.id FROM "User" u
      WHERE u."storeId" IN (
        SELECT stum."A" FROM "_StoreToUser" stum
        JOIN "User" mgr ON stum."B" = mgr.id
        WHERE mgr.id = $1
      )
    )`;
    params.push(requestingUser.id);
  } else if (requestingUser?.role === 'Gestor') {
    condition = 'WHERE ai."gestorId" = $1';
    params.push(requestingUser?.id);
  }

  try {
    const query = `
      SELECT ai.*, p.name as productName, u.name as gestorName
      FROM "AssignedInventory" ai
      JOIN "Product" p ON ai."productId" = p.id
      JOIN "User" u ON ai."gestorId" = u.id
      ${condition}
    `;
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get assigned inventory error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const assignInventory = [
  validateInventoryAssignment,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { productId, gestorId, quantity } = req.body;
    const requestingUser = (req as AuthenticatedRequest).user;

    if (requestingUser?.role !== 'Manager') {
      return res.status(403).json({ message: 'Access denied. Only managers can assign inventory.' });
    }

    try {
      const gestorResult = await db.query('SELECT * FROM "User" WHERE id = $1', [gestorId]);
      if (gestorResult.rows.length === 0) {
        return res.status(404).json({ message: 'Gestor not found.' });
      }

      const gestor = gestorResult.rows[0];
      if (gestor.role !== 'Gestor') {
        return res.status(400).json({ message: 'User is not a gestor.' });
      }

      const storeId = gestor.storeId;
      if (!storeId) {
        return res.status(400).json({ message: 'Gestor not assigned to a store.' });
      }

      const storeAccess = await db.query(
        'SELECT * FROM "_StoreToUser" WHERE "A" = $1 AND "B" = $2',
        [storeId, requestingUser.id]
      );
      if (storeAccess.rows.length === 0) {
        return res.status(403).json({ message: 'Access denied. You do not have access to this store.' });
      }

      const stockResult = await db.query(
        'SELECT * FROM "ProductStock" WHERE "productId" = $1 AND "storeId" = $2',
        [productId, storeId]
      );
      const currentStock = stockResult.rows[0]?.quantity || 0;

      if (currentStock < quantity) {
        return res.status(400).json({ message: 'Insufficient stock.' });
      }

      const productPriceResult = await db.query('SELECT "priceMN" FROM "Product" WHERE id = $1', [productId]);
      const currentPriceMN = productPriceResult.rows[0]?.priceMN || 0;

      const assignmentId = `assigned-${Date.now()}`;
      const result = await db.query(
        `INSERT INTO "AssignedInventory" (id, "productId", "gestorId", "quantity", "priceMN", status)
         VALUES ($1, $2, $3, $4, $5, 'Pending') RETURNING *`,
        [assignmentId, productId, gestorId, quantity, currentPriceMN]
      );

      const newStock = currentStock - quantity;
      if (stockResult.rows.length > 0) {
        await db.query(
          'UPDATE "ProductStock" SET "quantity" = $1 WHERE "productId" = $2 AND "storeId" = $3',
          [newStock, productId, storeId]
        );
      }

      await createAuditLog(
        requestingUser.id,
        'CREATE_ASSIGNED_INVENTORY',
        'AssignedInventory',
        assignmentId,
        null,
        result.rows[0],
        storeId
      );

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Assign inventory error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
];

export const confirmInventory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const requestingUser = (req as AuthenticatedRequest).user;

  try {
    const assignmentResult = await db.query(
      `SELECT ai.*, p."storeId" 
       FROM "AssignedInventory" ai
       JOIN "Product" p ON ai."productId" = p.id
       WHERE ai.id = $1`, 
      [id]
    );
    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }

    const assignment = assignmentResult.rows[0];
    if (assignment.gestorId !== requestingUser?.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    if (assignment.status !== 'Pending') {
      return res.status(400).json({ message: 'Assignment is not pending.' });
    }

    await db.query(
      'UPDATE "AssignedInventory" SET status = $1, "confirmedAt" = NOW() WHERE id = $2',
      ['Confirmed', id]
    );

    await createAuditLog(
      requestingUser?.id || '',
      'CONFIRM_INVENTORY',
      'AssignedInventory',
      id,
      assignment,
      { ...assignment, status: 'Confirmed' },
      assignment.storeId
    );

    res.status(200).json({ message: 'Inventory confirmed successfully.' });
  } catch (error) {
    console.error('Confirm inventory error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const rejectInventory = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body;
  const requestingUser = (req as AuthenticatedRequest).user;

  if (!reason) {
    return res.status(400).json({ message: 'Rejection reason is required.' });
  }

  try {
    const assignmentResult = await db.query(
      `SELECT ai.*, p."storeId" 
       FROM "AssignedInventory" ai
       JOIN "Product" p ON ai."productId" = p.id
       WHERE ai.id = $1`, 
      [id]
    );
    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found.' });
    }

    const assignment = assignmentResult.rows[0];
    if (assignment.gestorId !== requestingUser?.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const creatorLog = await db.query(
      'SELECT "userId" FROM "AuditLog" WHERE "action" = $1 AND "entityId" = $2 LIMIT 1',
      ['CREATE_ASSIGNED_INVENTORY', id]
    );
    
    let managerId = creatorLog.rows[0]?.userId;
    
    if (!managerId) {
      const fallbackManager = await db.query(
        'SELECT "B" as id FROM "_StoreToUser" WHERE "A" = $1 LIMIT 1',
        [assignment.storeId]
      );
      managerId = fallbackManager.rows[0]?.id;
    }

    if (!managerId) {
      return res.status(400).json({ message: 'No manager found to handle this conflict.' });
    }

    await db.query('BEGIN');
    await db.query(
      'UPDATE "AssignedInventory" SET status = $1, "rejectionReason" = $2 WHERE id = $3',
      ['Rejected', reason, id]
    );

    const stockResult = await db.query(
      'SELECT * FROM "ProductStock" WHERE "productId" = $1 AND "storeId" = $2',
      [assignment.productId, assignment.storeId]
    );
    const currentStock = stockResult.rows[0]?.quantity || 0;
    const newStock = currentStock + assignment.quantity;

    if (stockResult.rows.length > 0) {
      await db.query(
        'UPDATE "ProductStock" SET "quantity" = $1 WHERE "productId" = $2 AND "storeId" = $3',
        [newStock, assignment.productId, assignment.storeId]
      );
    }

    const conflictId = `conflict-${Date.now()}`;
    await db.query(
      `INSERT INTO "InventoryConflict" (id, "assignedInventoryId", "gestorId", "managerId", reason, status)
       VALUES ($1, $2, $3, $4, $5, 'Pending')`,
      [conflictId, id, assignment.gestorId, managerId, reason]
    );

    await db.query('COMMIT');

    await createAuditLog(
      requestingUser?.id || '',
      'REJECT_INVENTORY',
      'AssignedInventory',
      id,
      assignment,
      { ...assignment, status: 'Rejected', rejectionReason: reason },
      assignment.storeId
    );

    res.status(200).json({ message: 'Inventory rejected. Conflict created.' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Reject inventory error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ============================================================================
// Inventory Conflicts Controller
// ============================================================================

export const getInventoryConflicts = async (req: Request, res: Response) => {
  const requestingUser = (req as AuthenticatedRequest).user;

  let condition = '';
  const params: any[] = [];

  if (requestingUser?.role === 'Director') {
    if (requestingUser?.storeId) {
      condition = `WHERE ic."managerId" IN (
        SELECT u.id FROM "User" u
        WHERE u."storeId" = $1
      )`;
      params.push(requestingUser.storeId);
    }
  } else if (requestingUser?.role === 'Manager') {
    condition = 'WHERE ic."managerId" = $1';
    params.push(requestingUser?.id);
  } else if (requestingUser?.role === 'Gestor') {
    condition = 'WHERE ic."gestorId" = $1';
    params.push(requestingUser?.id);
  }

  try {
    const query = `
      SELECT 
        ic.id, 
        ic."assignedInventoryId", 
        ic."gestorId", 
        ic."managerId", 
        ic.reason, 
        ic.status, 
        ic."createdAt", 
        ic."resolvedAt",
        p.name as "productName", 
        u.name as "gestorName", 
        ai.quantity, 
        ai."productId"
      FROM "InventoryConflict" ic
      JOIN "AssignedInventory" ai ON ic."assignedInventoryId" = ai.id
      JOIN "Product" p ON ai."productId" = p.id
      JOIN "User" u ON ic."gestorId" = u.id
      ${condition}
      ORDER BY ic."createdAt" DESC
    `;
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get inventory conflicts error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const resolveInventoryConflict = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { action, newQuantity } = req.body;
  const requestingUser = (req as AuthenticatedRequest).user;

  try {
    const conflictResult = await db.query(
      `SELECT ic.*, p."storeId" 
       FROM "InventoryConflict" ic
       JOIN "AssignedInventory" ai ON ic."assignedInventoryId" = ai.id
       JOIN "Product" p ON ai."productId" = p.id
       WHERE ic.id = $1`, 
      [id]
    );
    if (conflictResult.rows.length === 0) {
      return res.status(404).json({ message: 'Conflict not found.' });
    }

    const conflict = conflictResult.rows[0];

    await db.query('BEGIN');

    if (action === 'resolve') {
      const assignmentResult = await db.query(
        'SELECT "productId", "quantity", "storeId" FROM "AssignedInventory" ai JOIN "Product" p ON ai."productId" = p.id WHERE ai.id = $1',
        [conflict.assignedInventoryId]
      );
      const assignment = assignmentResult.rows[0];

      const stockResult = await db.query(
        'SELECT quantity FROM "ProductStock" WHERE "productId" = $1 AND "storeId" = $2',
        [assignment.productId, assignment.storeId]
      );
      const currentStock = stockResult.rows[0]?.quantity || 0;

      if (newQuantity > currentStock) {
        await db.query('ROLLBACK');
        return res.status(400).json({ 
          message: `Stock insuficiente. El máximo disponible en tienda es ${currentStock}.` 
        });
      }

      await db.query(
        'UPDATE "InventoryConflict" SET status = $1, "resolvedAt" = NOW() WHERE id = $2',
        ['Resolved', id]
      );
      await db.query(
        'UPDATE "AssignedInventory" SET status = $1, quantity = $2, "rejectionReason" = NULL WHERE id = $3',
        ['Pending', newQuantity, conflict.assignedInventoryId]
      );

      const updatedStock = currentStock - newQuantity;
      await db.query(
        'UPDATE "ProductStock" SET "quantity" = $1 WHERE "productId" = $2 AND "storeId" = $3',
        [updatedStock, assignment.productId, assignment.storeId]
      );

    } else if (action === 'cancel') {
      await db.query(
        'UPDATE "InventoryConflict" SET status = $1, "resolvedAt" = NOW() WHERE id = $2',
        ['Resolved', id]
      );
      await db.query(
        'UPDATE "AssignedInventory" SET status = $1 WHERE id = $2',
        ['Cancelled', conflict.assignedInventoryId]
      );
    }

    await db.query('COMMIT');

    await createAuditLog(
      requestingUser?.id || '',
      'RESOLVE_CONFLICT',
      'InventoryConflict',
      id,
      conflict,
      { ...conflict, status: 'Resolved', action },
      conflict.storeId
    );

    res.status(200).json({ message: 'Conflict resolved successfully.' });
  } catch (error) {
    await db.query('ROLLBACK');
    console.error('Resolve inventory conflict error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
