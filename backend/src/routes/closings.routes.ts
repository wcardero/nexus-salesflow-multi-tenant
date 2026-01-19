import { Router } from 'express';
import { getClosings, createClosing, completeClosing } from '../controllers/closings.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/closings', authenticateToken, getClosings);
router.post('/closings', authenticateToken, createClosing);
router.patch('/closings/:id/complete', authenticateToken, completeClosing);

export default router;
