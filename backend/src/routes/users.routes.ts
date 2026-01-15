import { Router } from 'express';
import { getUsers, updateUser, changePassword, deleteUser } from '../controllers/users.controller';
import { authenticateToken } from '../middleware/auth.middleware';
import { validateUserUpdate, validatePasswordChange } from '../validators/auth.validator';
import { validationResult, ValidationChain } from 'express-validator';

// Helper function to wrap validation chains with error handler
const withValidation = (validations: ValidationChain[], handler: any) => {
  return [validations, handler];
};

const router = Router();

// All routes require authentication
router.use(authenticateToken);

// User management routes
router.get('/users', getUsers);
router.put('/users/:id', ...withValidation(validateUserUpdate, updateUser));
router.put('/users/:id/password', ...withValidation(validatePasswordChange, changePassword));
router.delete('/users/:id', deleteUser);

export default router;
