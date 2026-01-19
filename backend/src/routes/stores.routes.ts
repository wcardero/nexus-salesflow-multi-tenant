import { Router } from 'express';
import {
  getPublicStores,
  getStores,
  createStore,
  updateStore,
  deleteStore,
  assignManagerToStore,
  removeManagerFromStore,
} from '../controllers/stores.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateStoreCreation, validateStoreUpdate, validateAssignManager } from '../validators/stores.validator';
import { validationResult, ValidationChain } from 'express-validator';

// Helper function to wrap validation chains with error handler
const withValidation = (validations: ValidationChain[], handler: any) => {
  return [validations, handler];
};

const router = Router();

// Public routes (no auth)
router.get('/public', getPublicStores);
router.get('/stores/public', getPublicStores);

// Protected routes (require auth)
router.get('/stores', authenticateToken, getStores);
router.post('/stores', authenticateToken, ...withValidation(validateStoreCreation, createStore));
router.put('/stores/:id', authenticateToken, ...withValidation(validateStoreUpdate, updateStore));
router.delete('/stores/:id', authenticateToken, deleteStore);
router.post('/stores/:storeId/assign-manager', authenticateToken, ...withValidation(validateAssignManager, assignManagerToStore));
router.delete('/stores/:storeId/remove-manager/:userId', authenticateToken, removeManagerFromStore);

export default router;
