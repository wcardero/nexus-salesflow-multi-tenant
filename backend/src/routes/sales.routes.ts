import { Router } from 'express';
import { getSales, createSale, markSaleAsPaid, deleteSale } from '../controllers/sales.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.get('/sales', authenticateToken, getSales);
router.post('/sales', authenticateToken, createSale);
router.patch('/sales/:saleId/mark-as-paid', authenticateToken, markSaleAsPaid);
router.delete('/sales/:id', authenticateToken, deleteSale);

export default router;
