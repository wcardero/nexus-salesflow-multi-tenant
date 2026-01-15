import { Router } from 'express';
import { login, createUser } from '../controllers/auth.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

// Public routes (no authentication required)
router.post('/login', ...login);

// User creation - first user doesn't require auth
router.post('/users', ...createUser);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
