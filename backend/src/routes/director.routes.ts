import { Router } from 'express';
import { getDirectorMetrics } from '../controllers/director.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/director/metrics', getDirectorMetrics);

export default router;
