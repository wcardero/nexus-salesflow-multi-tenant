import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/audit-logs', authenticateToken, getAuditLogs);

export default router;
