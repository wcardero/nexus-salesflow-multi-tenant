import { Router } from 'express';
import {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
} from '../controllers/products.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateProduct } from '../validators/stores.validator';

const router = Router();

router.get('/products', authenticateToken, getProducts);
router.post('/products', authenticateToken, validateProduct, createProduct);
router.put('/products/:id', authenticateToken, validateProduct, updateProduct);
router.delete('/products/:id', authenticateToken, deleteProduct);

export default router;
