import { Router } from 'express';
import { login, createUser } from '../controllers/auth.controller';
import db from '../db';

const router = Router();

// Public routes (no authentication required)
router.post('/login', ...login);

// Check if any users exist
router.get('/users/exists', async (req, res) => {
  try {
    const result = await db.query('SELECT COUNT(*) FROM "User"');
    const exists = parseInt(result.rows[0].count) > 0;
    res.json({ exists });
  } catch (error) {
    console.error('Error checking user existence:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// User creation - first user doesn't require auth
router.post('/users', ...createUser);

// Health check
router.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
