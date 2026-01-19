import { Request, Response } from 'express';
import db from '../db';
import { AuthenticatedRequest, isAdmin, isManager, isDirector, isGestor } from '../middleware/auth.middleware';
import { validationResult } from 'express-validator';
import { createAuditLog } from '../utils/audit.utils';

export const getProducts = async (req: Request, res: Response) => {
  const requestingUser = (req as AuthenticatedRequest).user;
  const storeId = requestingUser?.storeId;

  let query = 'SELECT * FROM "Product"';
  const params: any[] = [];

  if (isAdmin(requestingUser?.role)) {
    // Admin sees all
  } else if (isDirector(requestingUser?.role) || isManager(requestingUser?.role) || isGestor(requestingUser?.role)) {
    if (storeId) {
      query += ' WHERE "storeId" = $1';
      params.push(storeId);
    } else if (isManager(requestingUser?.role)) {
        // Manager might be assigned to multiple stores via _StoreToUser
        query = `
            SELECT p.* FROM "Product" p
            WHERE p."storeId" IN (
                SELECT "A" FROM "_StoreToUser" WHERE "B" = $1
            )
        `;
        params.push(requestingUser?.id);
    } else {
      return res.status(403).json({ message: 'No store assigned to user.' });
    }
  }

  try {
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get products error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createProduct = async (req: Request, res: Response) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
  }

  const { name, costUSD, costMN, margin, currency, commissionRate, storeId } = req.body;
  const requestingUser = (req as AuthenticatedRequest).user;

  if (!isDirector(requestingUser?.role) && !isManager(requestingUser?.role)) {
    return res.status(403).json({ message: 'Access denied. Only directors and managers can create products.' });
  }

  const finalStoreId = storeId || requestingUser?.storeId;
  if (!finalStoreId) {
    return res.status(400).json({ message: 'Store ID is required.' });
  }

  try {
    // Check if name is unique for this creator
    const existingProduct = await db.query(
      'SELECT id FROM "Product" WHERE name = $1 AND "createdBy" = $2',
      [name, requestingUser?.id]
    );

    if (existingProduct.rows.length > 0) {
      return res.status(400).json({ message: 'Ya existe un producto con ese nombre creado por ti.' });
    }

    const productId = `prod-${Date.now()}`;
    const query = `
      INSERT INTO "Product" (
        id, name, "costUSD", "costMN", margin, currency, "commissionRate", "storeId", "createdBy"
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;
    const result = await db.query(query, [
      productId, name, costUSD || null, costMN || null, margin || null, currency || 'USD', commissionRate || null, finalStoreId, requestingUser?.id
    ]);

    await createAuditLog(
      requestingUser?.id || '',
      'CREATE_PRODUCT',
      'Product',
      productId,
      null,
      result.rows[0],
      finalStoreId
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, costUSD, costMN, margin, currency, commissionRate } = req.body;
  const requestingUser = (req as AuthenticatedRequest).user;

  if (!isDirector(requestingUser?.role) && !isManager(requestingUser?.role)) {
    return res.status(403).json({ message: 'Access denied.' });
  }

  try {
    const currentProductResult = await db.query('SELECT * FROM "Product" WHERE id = $1', [id]);
    if (currentProductResult.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    const currentProduct = currentProductResult.rows[0];

    // Check if product is assigned to any gestor
    const assignmentCheck = await db.query(
      'SELECT COUNT(*) FROM "AssignedInventory" WHERE "productId" = $1',
      [id]
    );
    if (parseInt(assignmentCheck.rows[0].count) > 0) {
      return res.status(400).json({ message: 'No se puede editar un producto que ya ha sido asignado a gestores.' });
    }

    // Check name uniqueness for this creator (if name changed)
    if (name && name !== currentProduct.name) {
        const existingProduct = await db.query(
            'SELECT id FROM "Product" WHERE name = $1 AND "createdBy" = $2 AND id != $3',
            [name, currentProduct.createdBy, id]
        );
        if (existingProduct.rows.length > 0) {
            return res.status(400).json({ message: 'Ya existe otro producto con ese nombre.' });
        }
    }

    const query = `
      UPDATE "Product"
      SET name = $1, "costUSD" = $2, "costMN" = $3, margin = $4, currency = $5, "commissionRate" = $6
      WHERE id = $7
      RETURNING *
    `;
    const result = await db.query(query, [
      name || currentProduct.name,
      costUSD !== undefined ? costUSD : currentProduct.costUSD,
      costMN !== undefined ? costMN : currentProduct.costMN,
      margin !== undefined ? margin : currentProduct.margin,
      currency || currentProduct.currency,
      commissionRate !== undefined ? commissionRate : currentProduct.commissionRate,
      id
    ]);

    await createAuditLog(
      requestingUser?.id || '',
      'UPDATE_PRODUCT',
      'Product',
      id,
      currentProduct,
      result.rows[0],
      currentProduct.storeId
    );

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteProduct = async (req: Request, res: Response) => {
  const { id } = req.params;
  const requestingUser = (req as AuthenticatedRequest).user;

  if (!isDirector(requestingUser?.role) && !isManager(requestingUser?.role)) {
    return res.status(403).json({ message: 'Access denied.' });
  }

  try {
    const currentProductResult = await db.query('SELECT * FROM "Product" WHERE id = $1', [id]);
    if (currentProductResult.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }
    const currentProduct = currentProductResult.rows[0];

    // Check if product is assigned to any gestor
    const assignmentCheck = await db.query(
      'SELECT COUNT(*) FROM "AssignedInventory" WHERE "productId" = $1',
      [id]
    );
    if (parseInt(assignmentCheck.rows[0].count) > 0) {
      return res.status(400).json({ message: 'No se puede eliminar un producto que ya ha sido asignado a gestores.' });
    }

    await db.query('DELETE FROM "Product" WHERE id = $1', [id]);

    await createAuditLog(
      requestingUser?.id || '',
      'DELETE_PRODUCT',
      'Product',
      id,
      currentProduct,
      null,
      currentProduct.storeId
    );

    res.json({ message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
