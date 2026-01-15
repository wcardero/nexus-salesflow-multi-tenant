import { Request, Response } from 'express';
import db from '../db';
import { AuthenticatedRequest } from '../middleware/auth.middleware';

// ============================================================================
// Director Metrics Controller
// ============================================================================

export const getDirectorMetrics = async (req: Request, res: Response) => {
  const requestingUser = (req as AuthenticatedRequest).user;

  if (requestingUser?.role !== 'Director') {
    return res.status(403).json({ message: 'Access denied. Only directors can view metrics.' });
  }

  const { period = '7d', startDate, endDate } = req.query;

  let start: Date, end: Date;
  const now = new Date();

  switch (period) {
    case 'today':
      start = new Date(now.setHours(0, 0, 0, 0));
      end = new Date();
      break;
    case '7d':
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      end = new Date();
      break;
    case '30d':
      start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      end = new Date();
      break;
    case 'custom':
      start = startDate ? new Date(startDate as string) : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      end = endDate ? new Date(endDate as string) : new Date();
      break;
    default:
      start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      end = new Date();
  }

  if (!requestingUser?.storeId) {
    return res.status(400).json({ message: 'Director not assigned to a store.' });
  }

  try {
    const totalSalesResult = await db.query(
      `SELECT COUNT(*) as count, COALESCE(SUM("finalMN"), 0) as total, COALESCE(SUM("baseMN"), 0) as base, COALESCE(SUM("commission"), 0) as commission
       FROM "Sale" s
       JOIN "User" u ON s."gestorId" = u.id
       WHERE u."storeId" = $1 AND s."soldAt" BETWEEN $2 AND $3`,
      [requestingUser.storeId, start, end]
    );

    const salesByDayResult = await db.query(
      `SELECT DATE("soldAt") as date, COUNT(*) as count, COALESCE(SUM("finalMN"), 0) as total
       FROM "Sale" s
       JOIN "User" u ON s."gestorId" = u.id
       WHERE u."storeId" = $1 AND s."soldAt" BETWEEN $2 AND $3
       GROUP BY DATE("soldAt")
       ORDER BY date`,
      [requestingUser.storeId, start, end]
    );

    const managersResult = await db.query(
      `SELECT u.id, u.name, 
        (SELECT COUNT(*) FROM "User" WHERE "createdBy" = u.id AND role = 'Gestor') as gestorCount,
        COALESCE((
          SELECT COUNT(*) FROM "Sale" s2
          JOIN "User" u2 ON s2."gestorId" = u2.id
          WHERE u2."createdBy" = u.id AND s2."soldAt" BETWEEN $1 AND $2
        ), 0) as salesCount,
        COALESCE((
          SELECT SUM("finalMN") FROM "Sale" s3
          JOIN "User" u3 ON s3."gestorId" = u3.id
          WHERE u3."createdBy" = u.id AND s3."soldAt" BETWEEN $1 AND $2
        ), 0) as totalSales
       FROM "User" u
       WHERE u."storeId" = $1 AND u.role = 'Manager'`,
      [requestingUser.storeId, start, end]
    );

    const pendingPaymentsResult = await db.query(
      `SELECT COUNT(*) as count, COALESCE(SUM("finalMN"), 0) as total
       FROM "Sale" s
       JOIN "User" u ON s."gestorId" = u.id
       WHERE u."storeId" = $1 AND s."paymentStatus" = 'PENDING'`,
      [requestingUser.storeId]
    );

    res.json({
      period: { start, end },
      totalSales: parseInt(totalSalesResult.rows[0].count),
      totalRevenue: parseFloat(totalSalesResult.rows[0].total),
      totalBase: parseFloat(totalSalesResult.rows[0].base),
      totalCommission: parseFloat(totalSalesResult.rows[0].commission),
      salesByDay: salesByDayResult.rows,
      byManager: managersResult.rows,
      pendingPayments: {
        count: parseInt(pendingPaymentsResult.rows[0].count),
        total: parseFloat(pendingPaymentsResult.rows[0].total),
      },
    });
  } catch (error) {
    console.error('Get director metrics error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
