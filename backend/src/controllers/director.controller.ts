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
    const startStr = (startDate as string).split('T')[0];
    const endStr = (endDate as string).split('T')[0];
    start = new Date(startStr + 'T00:00:00');
    end = new Date(endStr + 'T23:59:59.999');
  } else {
    // Default fallback logic
    switch (period) {
      case 'today':
        start = new Date(new Date().setHours(0, 0, 0, 0));
        end = new Date(new Date().setHours(23, 59, 59, 999));
        break;
      case '30d':
        start = new Date(new Date().getTime() - 30 * 24 * 60 * 60 * 1000);
        end = new Date(new Date().setHours(23, 59, 59, 999));
        break;
      default: // '7d'
        start = new Date(new Date().getTime() - 7 * 24 * 60 * 60 * 1000);
        end = new Date(new Date().setHours(23, 59, 59, 999));
    }
  }
  
  if (!requestingUser?.storeId) {
    return res.status(400).json({ message: 'Director not assigned to a store.' });
  }

  try {
    const totalSalesResult = await db.query(
      `SELECT 
         COUNT(*) as count, 
         COALESCE(SUM("finalMN"), 0) as total, 
         COALESCE(SUM("baseMN"), 0) as base, 
         COALESCE(SUM("commission"), 0) as commission,
         COALESCE(SUM(
           CASE 
             WHEN s."costMN" > 0 THEN s."costMN"
             WHEN s."costUSD" > 0 AND s."exchangeRateUsed" > 0 THEN s."costUSD" * s."exchangeRateUsed"
             ELSE 0
           END
         ), 0) as "totalCost"
       FROM "Sale" s
       JOIN "Product" p ON s."productId" = p.id
       WHERE p."storeId" = $1 AND s."accountingDate" BETWEEN $2 AND $3`,
      [requestingUser.storeId, start, end]
    );

    const salesByDayResult = await db.query(
      `SELECT "accountingDate" as date, COUNT(*) as count, COALESCE(SUM("finalMN"), 0) as total
       FROM "Sale" s
       JOIN "Product" p ON s."productId" = p.id
       WHERE p."storeId" = $1 AND s."accountingDate" BETWEEN $2 AND $3
       GROUP BY "accountingDate"
       ORDER BY date`,
      [requestingUser.storeId, start, end]
    );

    const managersResult = await db.query(
      `SELECT manager.id, manager.name, 
        (SELECT COUNT(*) FROM "User" WHERE "createdBy" = manager.id AND role = 'Gestor') as "gestorCount",
        COALESCE((
          SELECT COUNT(*) FROM "Sale" s2
          JOIN "User" gestor ON s2."gestorId" = gestor.id
          WHERE gestor."createdBy" = manager.id AND s2."accountingDate" BETWEEN $2 AND $3
        ), 0) as "salesCount",
        COALESCE((
          SELECT SUM("finalMN") FROM "Sale" s3
          JOIN "User" gestor ON s3."gestorId" = gestor.id
          WHERE gestor."createdBy" = manager.id AND s3."accountingDate" BETWEEN $2 AND $3
        ), 0) as "totalSales",
        COALESCE((
          SELECT SUM(
            "finalMN" - "commission" - (
              CASE 
                WHEN "costMN" > 0 THEN "costMN"
                WHEN "costUSD" > 0 AND "exchangeRateUsed" > 0 THEN "costUSD" * "exchangeRateUsed"
                ELSE 0
              END
            )
          ) FROM "Sale" s4
          JOIN "User" gestor ON s4."gestorId" = gestor.id
          WHERE gestor."createdBy" = manager.id AND s4."accountingDate" BETWEEN $2 AND $3
        ), 0) as "netProfit"
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

    const totalRevenue = parseFloat(totalSalesResult.rows[0].total);
    const totalCost = parseFloat(totalSalesResult.rows[0].totalCost);
    const totalCommission = parseFloat(totalSalesResult.rows[0].commission);
    const netProfit = totalRevenue - totalCost - totalCommission;

    res.json({
      period: { start, end },
      metrics: {
        totalSales: totalRevenue,
        netProfit: netProfit,
        numberOfSales: parseInt(totalSalesResult.rows[0].count),
        margin: totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0,
        isProfitable: netProfit > 0
      },
      salesByDay: salesByDayResult.rows.reduce((acc: any, curr: any) => {
        const dateStr = curr.date instanceof Date 
          ? curr.date.toISOString().split('T')[0] 
          : String(curr.date).split('T')[0];
        acc[dateStr] = parseFloat(curr.total);
        return acc;
      }, {}),
      managers: managersResult.rows.map((m: any) => ({
        id: m.id,
        name: m.name,
        numberOfSales: parseInt(m.salesCount),
        totalSales: parseFloat(m.totalSales),
        profit: parseFloat(m.netProfit),
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
