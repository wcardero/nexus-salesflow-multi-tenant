import { Request, Response } from 'express';
import db from '../db';
import { AuthenticatedRequest, isManager } from '../middleware/auth.middleware';

/**
 * Get stock information for a specific gestor and product.
 * Calculates: Asignación Histórica - Ventas Cerradas = Pendiente
 * 
 * Query params:
 * - gestorId: ID of the gestor (required)
 * - productId: ID of the product (required)
 */
export const getStockGestores = async (req: Request, res: Response) => {
  const requestingUser = (req as AuthenticatedRequest).user;
  const { gestorId, productId } = req.query;

  // Validate manager role
  if (!isManager(requestingUser?.role)) {
    return res.status(403).json({ message: 'Access denied. Only managers can access this endpoint.' });
  }

  // Validate required parameters
  if (!gestorId || !productId) {
    return res.status(400).json({ message: 'gestorId and productId are required query parameters.' });
  }

  try {
    // Step 1: Validate that the gestor belongs to the manager's store
    const gestorCheckQuery = `
      SELECT u.id, u.name, u."storeId"
      FROM "User" u
      WHERE u.id = $1 AND u.role = 'Gestor'
    `;
    const gestorResult = await db.query(gestorCheckQuery, [gestorId]);

    if (gestorResult.rows.length === 0) {
      return res.status(404).json({ message: 'Gestor not found.' });
    }

    const gestor = gestorResult.rows[0];

    // Check if the gestor belongs to a store managed by the requesting manager
    // Manager is connected to stores via _StoreToUser table
    const managerStoreQuery = `
      SELECT stum."A" as "storeId"
      FROM "_StoreToUser" stum
      WHERE stum."B" = $1
    `;
    const managerStoresResult = await db.query(managerStoreQuery, [requestingUser?.id]);
    const managerStoreIds = managerStoresResult.rows.map(r => r.storeId);

    if (!managerStoreIds.includes(gestor.storeId)) {
      return res.status(403).json({ message: 'Access denied. This gestor does not belong to your store.' });
    }

    // Step 2: Get product info
    const productQuery = `
      SELECT id, name
      FROM "Product"
      WHERE id = $1
    `;
    const productResult = await db.query(productQuery, [productId]);

    if (productResult.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const product = productResult.rows[0];

    // Step 3: Calculate Asignación Histórica (sum of all confirmed assignments)
    const asignacionQuery = `
      SELECT COALESCE(SUM(ai.quantity), 0) as total
      FROM "AssignedInventory" ai
      WHERE ai."gestorId" = $1 
        AND ai."productId" = $2 
        AND ai.status = 'Confirmed'
    `;
    const asignacionResult = await db.query(asignacionQuery, [gestorId, productId]);
    const asignacionHistorica = parseInt(asignacionResult.rows[0].total, 10) || 0;

    // Step 4: Calculate Ventas Cerradas (sales in COMPLETED closings)
    const ventasCerradasQuery = `
      SELECT COUNT(s.id) as total
      FROM "Sale" s
      JOIN "_ClosingToSale" cs ON s.id = cs."B"
      JOIN "Closing" c ON cs."A" = c.id
      WHERE s."gestorId" = $1 
        AND s."productId" = $2 
        AND c.status = 'COMPLETED'
    `;
    const ventasCerradasResult = await db.query(ventasCerradasQuery, [gestorId, productId]);
    const ventasCerradas = parseInt(ventasCerradasResult.rows[0].total, 10) || 0;

    // Step 5: Calculate Pendiente
    const pendiente = asignacionHistorica - ventasCerradas;

    // Return the response
    const response = {
      gestorId: gestor.id,
      gestorName: gestor.name,
      productId: product.id,
      productName: product.name,
      asignacionHistorica,
      ventasCerradas,
      pendiente: Math.max(0, pendiente), // Ensure non-negative
    };

    res.json(response);
  } catch (error) {
    console.error('Get stock gestores error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get all gestores assigned to the manager's store
 */
export const getManagerGestores = async (req: Request, res: Response) => {
  const requestingUser = (req as AuthenticatedRequest).user;

  if (!isManager(requestingUser?.role)) {
    return res.status(403).json({ message: 'Access denied. Only managers can access this endpoint.' });
  }

  try {
    // Get gestores from stores managed by this manager
    const query = `
      SELECT DISTINCT u.id, u.name, u."storeId"
      FROM "User" u
      JOIN "_StoreToUser" stum ON u."storeId" = stum."A"
      WHERE stum."B" = $1 AND u.role = 'Gestor'
      ORDER BY u.name
    `;
    const { rows } = await db.query(query, [requestingUser?.id]);
    res.json(rows);
  } catch (error) {
    console.error('Get manager gestores error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

/**
 * Get products that a specific gestor has assigned inventory for
 */
export const getGestorProducts = async (req: Request, res: Response) => {
  const requestingUser = (req as AuthenticatedRequest).user;
  const { gestorId } = req.query;

  if (!isManager(requestingUser?.role)) {
    return res.status(403).json({ message: 'Access denied. Only managers can access this endpoint.' });
  }

  if (!gestorId) {
    return res.status(400).json({ message: 'gestorId is required.' });
  }

  try {
    // Get products that the gestor has confirmed inventory for
    const query = `
      SELECT DISTINCT p.id, p.name
      FROM "Product" p
      JOIN "AssignedInventory" ai ON p.id = ai."productId"
      WHERE ai."gestorId" = $1 AND ai.status = 'Confirmed'
      ORDER BY p.name
    `;
    const { rows } = await db.query(query, [gestorId]);
    res.json(rows);
  } catch (error) {
    console.error('Get gestor products error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
