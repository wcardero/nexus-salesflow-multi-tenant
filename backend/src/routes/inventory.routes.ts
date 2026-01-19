import { Router } from 'express';
import {
  getInventory,
  getProductStock,
  createOrUpdateProductStock,
  deleteProductStock,
  getAssignedInventory,
  assignInventory,
  confirmInventory,
  rejectInventory,
  getInventoryConflicts,
  resolveInventoryConflict,
} from '../controllers/inventory.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateProductStock, validateInventoryAssignment } from '../validators/stores.validator';
import { validationResult, ValidationChain } from 'express-validator';

const withValidation = (validations: ValidationChain[], handler: any) => {
  return [validations, handler];
};

const router = Router();

router.use(authenticateToken);

router.get('/inventory', getInventory);
router.get('/product-stock', getProductStock);
router.post('/product-stock', ...withValidation(validateProductStock, createOrUpdateProductStock));
router.delete('/product-stock/:stockId', deleteProductStock);

router.get('/assigned-inventory', getAssignedInventory);
router.post('/assigned-inventory', ...withValidation(validateInventoryAssignment, assignInventory));
router.post('/assigned-inventory/:id/confirm', confirmInventory);
router.post('/assigned-inventory/:id/reject', rejectInventory);

router.get('/inventory-conflicts', getInventoryConflicts);
router.post('/inventory-conflicts/:id/resolve', resolveInventoryConflict);

export default router;
