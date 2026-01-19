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

router.use(authenticateToken);

router.get('/products', getProducts);
router.post('/products', validateProduct, createProduct);
router.put('/products/:id', validateProduct, updateProduct);
router.delete('/products/:id', deleteProduct);

export default router;
