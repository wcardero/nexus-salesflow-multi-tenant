import { Router } from 'express';
import {
  getStockGestores,
  getManagerGestores,
  getGestorProducts,
} from '../controllers/manager.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/manager/stock-gestores', authenticateToken, getStockGestores);
router.get('/manager/gestores', authenticateToken, getManagerGestores);
router.get('/manager/gestor-products', authenticateToken, getGestorProducts);

export default router;
