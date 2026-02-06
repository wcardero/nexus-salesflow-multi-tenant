import { Request, Response } from 'express';
import db from '../db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { createAuditLog, auditClosingCreation, auditClosingCompletion } from '../utils/audit.utils';

// ============================================================================
// Closings Controllers
// ============================================================================

export const getClosings = async (req: Request, res: Response) => {
  const requestingUser = (req as AuthenticatedRequest).user;

  let condition = '';
  const params: any[] = [];

  if (requestingUser?.role === 'Admin' || requestingUser?.role === 'Manager') {
    condition = `WHERE c."gestorId" IN (
      SELECT u.id FROM "User" u
      WHERE u."storeId" IN (
        SELECT stum."A" FROM "_StoreToUser" stum
        JOIN "User" mgr ON stum."B" = mgr.id
        WHERE mgr.id = $1
      )
    )`;
    params.push(requestingUser?.id);
  } else if (requestingUser?.role === 'Gestor') {
    condition = 'WHERE c."gestorId" = $1';
    params.push(requestingUser?.id);
  }

  try {
    const closingsResult = await db.query(
      `SELECT c.*, u.name as gestorName FROM "Closing" c
       JOIN "User" u ON c."gestorId" = u.id ${condition} ORDER BY c."initiatedAt" DESC`,
      params
    );

    const closingsWithSales = await Promise.all(closingsResult.rows.map(async (closing) => {
      const salesResult = await db.query(
        `SELECT s.*, p.name as productName FROM "_ClosingToSale" cs
         JOIN "Sale" s ON cs."B" = s.id
         JOIN "Product" p ON s."productId" = p.id
         WHERE cs."A" = $1`,
        [closing.id]
      );
      return { ...closing, sales: salesResult.rows };
    }));

    res.json(closingsWithSales);
  } catch (error) {
    console.error('Get closings error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const createClosing = async (req: Request, res: Response) => {
  const { saleIds, accountingDate } = req.body;
  const requestingUser = (req as AuthenticatedRequest).user;

  if (!saleIds || !Array.isArray(saleIds) || saleIds.length === 0) {
    return res.status(400).json({ message: 'saleIds array is required.' });
  }

  try {
    const salesResult = await db.query(
      `SELECT s.* FROM "Sale" s
       JOIN "User" u ON s."gestorId" = u.id
       WHERE s.id = ANY($1) AND s."gestorId" = $2 AND s."paymentStatus" = 'PAID'`,
      [saleIds, requestingUser?.id]
    );

    if (salesResult.rows.length !== saleIds.length) {
      return res.status(400).json({ message: 'Some sales are not valid or not owned by you.' });
    }

    let totalBaseMN = 0, totalCommission = 0, totalFinalMN = 0;
    for (const sale of salesResult.rows) {
      totalBaseMN += sale.baseMN + (sale.transferSurchargeAmount || 0);
      totalCommission += sale.commission;
      totalFinalMN += sale.finalMN;
    }

    const closingId = `closing-${Date.now()}`;
    const closingResult = await db.query(
      `INSERT INTO "Closing" (id, "gestorId", "initiatedAt", "accountingDate", status, "totalBaseMN", "totalCommission", "totalFinalMN")
       VALUES ($1, $2, NOW(), COALESCE($3, CURRENT_DATE), 'PENDING', $4, $5, $6) RETURNING *`,
      [closingId, requestingUser?.id, accountingDate || null, totalBaseMN, totalCommission, totalFinalMN]
    );

    for (const saleId of saleIds) {
      await db.query(
        'INSERT INTO "_ClosingToSale" ("A", "B") VALUES ($1, $2)',
        [closingId, saleId]
      );
    }

    await auditClosingCreation(requestingUser?.id || '', closingId, closingResult.rows[0]);

    res.status(201).json(closingResult.rows[0]);
  } catch (error) {
    console.error('Create closing error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const completeClosing = async (req: Request, res: Response) => {
  const { id } = req.params;
  const requestingUser = (req as AuthenticatedRequest).user;

  try {
    const closingResult = await db.query('SELECT * FROM "Closing" WHERE id = $1', [id]);
    if (closingResult.rows.length === 0) {
      return res.status(404).json({ message: 'Closing not found.' });
    }

    const closing = closingResult.rows[0];
    if (closing.status !== 'PENDING') {
      return res.status(400).json({ message: 'Closing is not pending.' });
    }

    const gestorResult = await db.query('SELECT * FROM "User" WHERE id = $1', [closing.gestorId]);
    const gestor = gestorResult.rows[0];

    const storeAccess = await db.query(
      'SELECT * FROM "_StoreToUser" WHERE "A" = $1 AND "B" = $2',
      [gestor.storeId, requestingUser?.id]
    );
    if (storeAccess.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied. You do not have access to this store.' });
    }

    const oldClosing = { ...closing };
    await db.query(
      'UPDATE "Closing" SET status = $1, "completedAt" = NOW() WHERE id = $2',
      ['COMPLETED', id]
    );

    const newClosing = { ...closing, status: 'COMPLETED' };
    await auditClosingCompletion(requestingUser?.id || '', id, oldClosing, newClosing);

    res.status(200).json({ message: 'Closing completed successfully.' });
  } catch (error) {
    console.error('Complete closing error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
