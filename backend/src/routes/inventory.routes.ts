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

router.get('/inventory', authenticateToken, getInventory);
router.get('/product-stock', authenticateToken, getProductStock);
router.post('/product-stock', authenticateToken, ...withValidation(validateProductStock, createOrUpdateProductStock));
router.delete('/product-stock/:stockId', authenticateToken, deleteProductStock);

router.get('/assigned-inventory', authenticateToken, getAssignedInventory);
router.post('/assigned-inventory', authenticateToken, ...withValidation(validateInventoryAssignment, assignInventory));
router.post('/assigned-inventory/:id/confirm', authenticateToken, confirmInventory);
router.post('/assigned-inventory/:id/reject', authenticateToken, rejectInventory);

router.get('/inventory-conflicts', authenticateToken, getInventoryConflicts);
router.post('/inventory-conflicts/:id/resolve', authenticateToken, resolveInventoryConflict);

export default router;
