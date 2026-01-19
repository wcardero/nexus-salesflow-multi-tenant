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

// User management routes
router.get('/users', authenticateToken, getUsers);
router.put('/users/:id', authenticateToken, ...withValidation(validateUserUpdate, updateUser));
router.put('/users/:id/password', authenticateToken, ...withValidation(validatePasswordChange, changePassword));
router.delete('/users/:id', authenticateToken, deleteUser);

export default router;
