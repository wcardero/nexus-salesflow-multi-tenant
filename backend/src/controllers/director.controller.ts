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

  const { period, startDate, endDate } = req.query;

  let start: Date, end: Date;
  const now = new Date();

  // If dates are provided, prioritize them (Custom range)
  if (startDate && endDate) {
    start = new Date(startDate as string);
    end = new Date(endDate as string);
  } else {
    // Default fallback logic
    switch (period) {
      case 'today':
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date(now.setHours(23, 59, 59, 999));
        break;
      case '30d':
        start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        end = new Date(now.setHours(23, 59, 59, 999));
        break;
      default: // '7d'
        start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        end = new Date(now.setHours(23, 59, 59, 999));
    }
  }
  
  if (!requestingUser?.storeId) {
    return res.status(400).json({ message: 'Director not assigned to a store.' });
  }

  try {
    const totalSalesResult = await db.query(
      `SELECT COUNT(*) as count, COALESCE(SUM("finalMN"), 0) as total, COALESCE(SUM("baseMN"), 0) as base, COALESCE(SUM("commission"), 0) as commission
       FROM "Sale" s
       JOIN "Product" p ON s."productId" = p.id
       WHERE p."storeId" = $1 AND s."soldAt" BETWEEN $2 AND $3`,
      [requestingUser.storeId, start, end]
    );

    const salesByDayResult = await db.query(
      `SELECT DATE("soldAt") as date, COUNT(*) as count, COALESCE(SUM("finalMN"), 0) as total
       FROM "Sale" s
       JOIN "Product" p ON s."productId" = p.id
       WHERE p."storeId" = $1 AND s."soldAt" BETWEEN $2 AND $3
       GROUP BY DATE("soldAt")
       ORDER BY date`,
      [requestingUser.storeId, start, end]
    );

    const managersResult = await db.query(
      `SELECT manager.id, manager.name, 
        (SELECT COUNT(*) FROM "User" WHERE "createdBy" = manager.id AND role = 'Gestor') as "gestorCount",
        COALESCE((
          SELECT COUNT(*) FROM "Sale" s2
          JOIN "User" gestor ON s2."gestorId" = gestor.id
          WHERE gestor."createdBy" = manager.id AND s2."soldAt" BETWEEN $2 AND $3
        ), 0) as "salesCount",
        COALESCE((
          SELECT SUM("finalMN") FROM "Sale" s3
          JOIN "User" gestor ON s3."gestorId" = gestor.id
          WHERE gestor."createdBy" = manager.id AND s3."soldAt" BETWEEN $2 AND $3
        ), 0) as "totalSales"
       FROM "User" manager
       WHERE (manager."storeId" = $1 OR manager.id IN (SELECT "B" FROM "_StoreToUser" WHERE "A" = $1)) 
       AND manager.role = 'Manager'`,
      [requestingUser.storeId, start, end]
    );

    const pendingPaymentsResult = await db.query(
      `SELECT COUNT(*) as count, COALESCE(SUM("finalMN"), 0) as total
       FROM "Sale" s
       JOIN "Product" p ON s."productId" = p.id
       WHERE p."storeId" = $1 AND s."paymentStatus" = 'PENDING'`,
      [requestingUser.storeId]
    );

    res.json({
      period: { start, end },
      metrics: {
        totalSales: parseFloat(totalSalesResult.rows[0].total),
        netProfit: parseFloat(totalSalesResult.rows[0].base),
        numberOfSales: parseInt(totalSalesResult.rows[0].count),
        margin: parseFloat(totalSalesResult.rows[0].total) > 0 
          ? (parseFloat(totalSalesResult.rows[0].base) / parseFloat(totalSalesResult.rows[0].total)) * 100 
          : 0,
        isProfitable: parseFloat(totalSalesResult.rows[0].base) > 0
      },
      salesByDay: salesByDayResult.rows.reduce((acc: any, curr: any) => {
        acc[curr.date.toISOString().split('T')[0]] = parseFloat(curr.total);
        return acc;
      }, {}),
      managers: managersResult.rows.map((m: any) => ({
        id: m.id,
        name: m.name,
        numberOfSales: parseInt(m.salesCount),
        totalSales: parseFloat(m.totalSales),
        profit: parseFloat(m.totalSales) * 0.2,
        numberOfGestors: parseInt(m.gestorCount)
      })),
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
