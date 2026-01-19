import { Request, Response } from 'express';
import db from '../db';
import { AuthenticatedRequest, isAdmin, isManager, isDirector } from '../middleware/auth.middleware';

export const getAuditLogs = async (req: Request, res: Response) => {
  const requestingUser = (req as AuthenticatedRequest).user;
  const storeId = requestingUser?.storeId;

  let query = 'SELECT * FROM "AuditLog"';
  const params: any[] = [];

  if (isAdmin(requestingUser?.role)) {
    // Admin sees all
  } else if (isDirector(requestingUser?.role) || isManager(requestingUser?.role)) {
    if (storeId) {
      query += ' WHERE "storeId" = $1';
      params.push(storeId);
    } else {
       // Manager/Director sees logs for their assigned stores
       query = `
        SELECT al.* FROM "AuditLog" al
        WHERE al."storeId" IN (
            SELECT "A" FROM "_StoreToUser" WHERE "B" = $1
        )
      `;
      params.push(requestingUser?.id);
    }
  } else {
    // Gestors see only their own logs
    query += ' WHERE "userId" = $1';
    params.push(requestingUser?.id);
  }

  query += ' ORDER BY "timestamp" DESC LIMIT 500';

  try {
    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
