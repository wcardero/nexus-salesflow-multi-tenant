import { Router } from 'express';
import { getClosings, createClosing, completeClosing } from '../controllers/closings.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/closings', getClosings);
router.post('/closings', createClosing);
router.patch('/closings/:id/complete', completeClosing);

export default router;
