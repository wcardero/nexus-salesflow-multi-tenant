import { Router } from 'express';
import { getSales, createSale, markSaleAsPaid, deleteSale } from '../controllers/sales.controller';
import { authenticateToken } from '../middleware/auth.middleware';

const router = Router();

router.use(authenticateToken);

router.get('/sales', getSales);
router.post('/sales', createSale);
router.patch('/sales/:saleId/mark-as-paid', markSaleAsPaid);
router.delete('/sales/:id', deleteSale);

export default router;
