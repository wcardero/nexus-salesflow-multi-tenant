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

// Public route (no auth)
router.get('/public', getPublicStores);

// Protected routes (require auth)
router.use(authenticateToken);

router.get('/stores', getStores);
router.post('/stores', ...withValidation(validateStoreCreation, createStore));
router.put('/stores/:id', ...withValidation(validateStoreUpdate, updateStore));
router.delete('/stores/:id', deleteStore);
router.post('/stores/:storeId/assign-manager', ...withValidation(validateAssignManager, assignManagerToStore));
router.delete('/stores/:storeId/remove-manager/:userId', removeManagerFromStore);

export default router;
