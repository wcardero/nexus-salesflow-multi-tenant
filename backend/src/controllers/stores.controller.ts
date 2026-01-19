import { Request, Response } from 'express';
import db from '../db';
import { AuthenticatedRequest, isAdmin, isManager, isGestor } from '../middleware/auth.middleware';
import { validateStoreCreation, validateStoreUpdate, validateAssignManager } from '../validators/stores.validator';
import { validationResult, ValidationChain } from 'express-validator';
import {
  createAuditLog,
  auditStoreCreation,
  auditStoreUpdate,
  auditStoreDeletion,
} from '../utils/audit.utils';

const withValidation = (validations: ValidationChain[], handler: any) => {
  return [validations, handler];
};

export const getPublicStores = async (req: Request, res: Response) => {
  try {
    const result = await db.query('SELECT id, name FROM "Store" ORDER BY name');
    res.json(result.rows);
  } catch (error) {
    console.error('Fetch stores error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getStores = async (req: Request, res: Response) => {
  const requestingUser = (req as AuthenticatedRequest).user;

  let storeCondition = '';
  const params: any[] = [];
  const userId = requestingUser?.id || '';
  const userStoreId = requestingUser?.storeId || '';

  if (isAdmin(requestingUser?.role)) {
  } else if (isManager(requestingUser?.role)) {
    if (userStoreId) {
      storeCondition = `WHERE s.id = $1 OR s.id IN (
        SELECT stum."A" FROM "_StoreToUser" stum
        WHERE stum."B" = $2
      )`;
      params.push(userStoreId, userId);
    } else {
      storeCondition = `WHERE s.id IN (
        SELECT stum."A" FROM "_StoreToUser" stum
        JOIN "User" u ON stum."B" = u.id
        WHERE u.id = $1
      )`;
      params.push(userId);
    }
  } else if (isGestor(requestingUser?.role)) {
    if (userStoreId) {
      storeCondition = 'WHERE s.id = $1';
      params.push(userStoreId);
    } else {
      return res.status(403).json({ message: 'Gestor not assigned to a store.' });
    }
  }

  try {
    const query = `SELECT s.* FROM "Store" s ${storeCondition}`;
    const { rows: stores } = await db.query(query, params);

    const storesWithRatesAndManagers = await Promise.all(stores.map(async (store) => {
      const { rows: exchangeRates } = await db.query('SELECT * FROM "ExchangeRate" WHERE "storeId" = $1', [store.id]);
      const { rows: storeManagers } = await db.query(`
        SELECT u.id FROM "_StoreToUser" stum
        JOIN "User" u ON stum."B" = u.id
        WHERE stum."A" = $1 AND u.role = 'Manager'
      `, [store.id]);
      const managerIds = storeManagers.map(row => row.id);
      return { ...store, exchangeRates, managerIds };
    }));
    res.json(storesWithRatesAndManagers);
  } catch (error) {
    console.error('Get stores error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createStore = [
  validateStoreCreation,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { name } = req.body;
    const requestingUser = (req as AuthenticatedRequest).user;

    if (!isAdmin(requestingUser?.role)) {
      return res.status(403).json({ message: 'Access denied. Only admins can create stores.' });
    }

    try {
      const newStoreId = `store-${Date.now()}`;
      const nameCheckResult = await db.query('SELECT COUNT(*) FROM "Store" WHERE name = $1', [name]);
      if (parseInt(nameCheckResult.rows[0].count) > 0) {
        return res.status(400).json({ message: 'Ya existe una tienda con ese nombre.' });
      }

      const result = await db.query(
        'INSERT INTO "Store" (id, name) VALUES ($1, $2) RETURNING *',
        [newStoreId, name]
      );

      await auditStoreCreation(requestingUser?.id || '', newStoreId, result.rows[0]);
      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('Store creation error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
];

export const updateStore = [
  validateStoreUpdate,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params;
    const { name, directorId } = req.body;
    const requestingUser = (req as AuthenticatedRequest).user;

    if (!isAdmin(requestingUser?.role)) {
      return res.status(403).json({ message: 'Access denied. Only admins can update stores.' });
    }

    try {
      const currentStoreResult = await db.query('SELECT * FROM "Store" WHERE id = $1', [id]);
      if (currentStoreResult.rows.length === 0) {
        return res.status(404).json({ message: 'Store not found.' });
      }

      const query = `
        UPDATE "Store"
        SET name = COALESCE($1, name),
            "directorId" = COALESCE($2, "directorId")
        WHERE id = $3
        RETURNING *
      `;
      const result = await db.query(query, [name || null, directorId || null, id]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'Store not found.' });
      }

      await auditStoreUpdate(requestingUser?.id || '', id, currentStoreResult.rows[0], result.rows[0]);
      res.status(200).json(result.rows[0]);
    } catch (error) {
      console.error('Store update error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
];

export const deleteStore = async (req: Request, res: Response) => {
  const { id } = req.params;
  const requestingUser = (req as AuthenticatedRequest).user;

  if (!isAdmin(requestingUser?.role)) {
    return res.status(403).json({ message: 'Access denied. Only admins can delete stores.' });
  }

  try {
    const storeResult = await db.query('SELECT * FROM "Store" WHERE id = $1', [id]);
    if (storeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Store not found.' });
    }

    await db.query('DELETE FROM "Store" WHERE id = $1', [id]);
    await auditStoreDeletion(requestingUser?.id || '', id, storeResult.rows[0]);
    res.status(200).json({ message: 'Store deleted successfully.' });
  } catch (error) {
    console.error('Store deletion error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const assignManagerToStore = [
  validateAssignManager,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { storeId } = req.params;
    const { userId } = req.body;
    const requestingUser = (req as AuthenticatedRequest).user;

    if (!isAdmin(requestingUser?.role)) {
      return res.status(403).json({ message: 'Access denied. Only admins can assign managers to stores.' });
    }

    try {
      const storeResult = await db.query('SELECT id FROM "Store" WHERE id = $1', [storeId]);
      if (storeResult.rows.length === 0) {
        return res.status(404).json({ message: 'Store not found.' });
      }

      const userResult = await db.query('SELECT id, role FROM "User" WHERE id = $1', [userId]);
      if (userResult.rows.length === 0) {
        return res.status(404).json({ message: 'User not found.' });
      }
      if (userResult.rows[0].role !== 'Manager') {
        return res.status(400).json({ message: 'User is not a manager.' });
      }

      await db.query(
        'INSERT INTO "_StoreToUser" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING',
        [storeId, userId]
      );

      await createAuditLog(
        requestingUser?.id || '',
        'ASSIGN_MANAGER_TO_STORE',
        'StoreUser',
        storeId,
        null,
        { storeId, userId },
        storeId
      );

      res.status(200).json({ message: 'Manager assigned to store successfully.' });
    } catch (error) {
      console.error('Assign manager to store error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
];

export const removeManagerFromStore = async (req: Request, res: Response) => {
  const { storeId, userId } = req.params;
  const requestingUser = (req as AuthenticatedRequest).user;

  if (!isAdmin(requestingUser?.role)) {
    return res.status(403).json({ message: 'Access denied. Only admins can remove managers from stores.' });
  }

  try {
    await db.query(
      'DELETE FROM "_StoreToUser" WHERE "A" = $1 AND "B" = $2',
      [storeId, userId]
    );

    await createAuditLog(
      requestingUser?.id || '',
      'REMOVE_MANAGER_FROM_STORE',
      'StoreUser',
      storeId,
      { storeId, userId },
      null,
      storeId
    );

    res.status(200).json({ message: 'Manager removed from store successfully.' });
  } catch (error) {
    console.error('Remove manager from store error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
