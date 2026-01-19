import { Router } from 'express';
import { getDirectorMetrics } from '../controllers/director.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/director/metrics', authenticateToken, getDirectorMetrics);

export default router;
