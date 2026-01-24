import { Request, Response } from 'express';
import db from '../db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { createAuditLog, auditSaleCreation, auditSaleDeletion } from '../utils/audit.utils';

// ============================================================================
// Sales Controllers
// ============================================================================

export const getSales = async (req: Request, res: Response) => {
  const requestingUser = (req as AuthenticatedRequest).user;

  let condition = '';
  const params: any[] = [];

  if (requestingUser?.role === 'Admin') {
    // Admin sees all
  } else if (requestingUser?.role === 'Manager') {
    condition = `WHERE s."gestorId" IN (
      SELECT u.id FROM "User" u
      WHERE u."storeId" IN (
        SELECT stum."A" FROM "_StoreToUser" stum
        JOIN "User" mgr ON stum."B" = mgr.id
        WHERE mgr.id = $1
      )
    )`;
    params.push(requestingUser.id);
  } else if (requestingUser?.role === 'Gestor') {
    condition = 'WHERE s."gestorId" = $1';
    params.push(requestingUser?.id);
  } else if (requestingUser?.role === 'Director') {
    condition = `WHERE s."productId" IN (
      SELECT id FROM "Product" WHERE "storeId" = $1
    )`;
    params.push(requestingUser.storeId);
  }

  try {
    const query = `
      SELECT s.*, p.name as productName, u.name as gestorName
      FROM "Sale" s
      JOIN "Product" p ON s."productId" = p.id
      JOIN "User" u ON s."gestorId" = u.id
      ${condition}
      ORDER BY s."soldAt" DESC
    `;
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get sales error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createSale = async (req: Request, res: Response) => {
  const { assignedInventoryId, quantity, customerName, paymentStatus, accountingDate } = req.body;
  const requestingUser = (req as AuthenticatedRequest).user;

  if (!quantity || quantity < 1) {
    return res.status(400).json({ message: 'Quantity must be at least 1.' });
  }

  if (paymentStatus === 'PENDING' && !customerName) {
    return res.status(400).json({ message: 'Customer name is required for credit sales.' });
  }

  try {
    const assignmentResult = await db.query(
      'SELECT * FROM "AssignedInventory" WHERE id = $1 AND "gestorId" = $2',
      [assignedInventoryId, requestingUser?.id]
    );

    if (assignmentResult.rows.length === 0) {
      return res.status(404).json({ message: 'Assignment not found or not authorized.' });
    }

    const assignment = assignmentResult.rows[0];
    if (assignment.status !== 'Confirmed') {
      return res.status(400).json({ message: 'Inventory must be confirmed before sale.' });
    }

    if (assignment.quantity < quantity) {
      return res.status(400).json({ message: 'Insufficient inventory.' });
    }

    const exchangeRateResult = await db.query(
      'SELECT * FROM "ExchangeRate" WHERE "storeId" = $1 ORDER BY "startDate" DESC LIMIT 1',
      [requestingUser?.storeId]
    );
    const exchangeRate = exchangeRateResult.rows[0]?.rate || 1;

    const productResult = await db.query('SELECT * FROM "Product" WHERE id = $1', [assignment.productId]);
    const product = productResult.rows[0];

    const costUSD = product.costUSD || 0;
    const costMN = product.costMN || 0;
    const margin = product.margin || 0;
    const commissionRate = product.commissionRate || 0;

    let saleUSD = 0, baseMN = 0, commission = 0, finalMN = 0;

    if (product.currency === 'USD') {
      saleUSD = costUSD * (1 + margin);
      baseMN = saleUSD * exchangeRate;
      commission = baseMN * commissionRate;
      finalMN = baseMN + commission;
    } else {
      saleUSD = 0;
      baseMN = costMN * (1 + margin);
      commission = baseMN * commissionRate;
      finalMN = baseMN + commission;
    }

    // Create multiple sales, one per unit
    const sales = [];
    for (let i = 0; i < quantity; i++) {
      const saleId = `sale-${Date.now()}-${i}`;
      const saleResult = await db.query(
        `INSERT INTO "Sale" (id, "inventoryItemId", "gestorId", "productId", "soldAt", "accountingDate", "exchangeRateUsed",
          "costUSD", "costMN", "margin", "saleUSD", "baseMN", "commission", "finalMN", "paymentStatus", "customerName")
         VALUES ($1, $2, $3, $4, NOW(), COALESCE($5, CURRENT_DATE), $6, $7, $8, $9, $10, $11, $12, $13, $14, $15) RETURNING *`,
        [saleId, assignedInventoryId, requestingUser?.id, assignment.productId, accountingDate || null, exchangeRate,
          costUSD, costMN, margin, saleUSD, baseMN, commission, finalMN, paymentStatus || 'PAID', customerName]
      );
      sales.push(saleResult.rows[0]);
      await auditSaleCreation(requestingUser?.id || '', saleId, saleResult.rows[0], assignment.storeId);
    }

    const totalFinalMN = finalMN * quantity;
    const newQuantity = assignment.quantity - quantity;
    await db.query('UPDATE "AssignedInventory" SET quantity = $1 WHERE id = $2', [newQuantity, assignedInventoryId]);

    res.status(201).json({ sales, totalFinalMN });
  } catch (error) {
    console.error('Create sale error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const markSaleAsPaid = async (req: Request, res: Response) => {
  const { saleId } = req.params;
  const requestingUser = (req as AuthenticatedRequest).user;

  try {
    const saleResult = await db.query('SELECT * FROM "Sale" WHERE id = $1', [saleId]);
    if (saleResult.rows.length === 0) {
      return res.status(404).json({ message: 'Sale not found.' });
    }

    const sale = saleResult.rows[0];
    if (sale.gestorId !== requestingUser?.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    if (sale.paymentStatus === 'PAID') {
      return res.status(400).json({ message: 'Sale is already paid.' });
    }

    await db.query('UPDATE "Sale" SET "paymentStatus" = $1 WHERE id = $2', ['PAID', saleId]);

    const productResult = await db.query('SELECT "storeId" FROM "Product" WHERE id = $1', [sale.productId]);
    const storeId = productResult.rows[0]?.storeId;

    await createAuditLog(
      requestingUser?.id || '',
      'MARK_SALE_PAID',
      'Sale',
      saleId,
      { paymentStatus: 'PENDING' },
      { paymentStatus: 'PAID' },
      storeId
    );

    res.status(200).json({ message: 'Sale marked as paid.' });
  } catch (error) {
    console.error('Mark sale as paid error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const deleteSale = async (req: Request, res: Response) => {
  const { id } = req.params;
  const requestingUser = (req as AuthenticatedRequest).user;

  try {
    const saleResult = await db.query('SELECT * FROM "Sale" WHERE id = $1', [id]);
    if (saleResult.rows.length === 0) {
      return res.status(404).json({ message: 'Sale not found.' });
    }

    const sale = saleResult.rows[0];
    if (sale.gestorId !== requestingUser?.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }

    const assignmentResult = await db.query(
      'SELECT * FROM "AssignedInventory" WHERE id = $1',
      [sale.inventoryItemId]
    );
    if (assignmentResult.rows.length > 0) {
      const assignment = assignmentResult.rows[0];
      await db.query(
        'UPDATE "AssignedInventory" SET quantity = quantity + 1 WHERE id = $1',
        [sale.inventoryItemId]
      );
    }

    await db.query('DELETE FROM "Sale" WHERE id = $1', [id]);

    await auditSaleDeletion(requestingUser?.id || '', id, sale);

    res.status(200).json({ message: 'Sale deleted successfully.' });
  } catch (error) {
    console.error('Delete sale error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
