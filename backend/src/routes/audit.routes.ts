import { Router } from 'express';
import { getAuditLogs } from '../controllers/audit.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/audit-logs', getAuditLogs);

export default router;
