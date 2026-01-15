import { body, ValidationChain } from 'express-validator';

// ============================================================================
// Login Validation
// ============================================================================

/**
 * Validation rules for login endpoint
 */
export const validateLogin: ValidationChain[] = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Username must be between 1 and 50 characters')
    .matches(/^[a-zA-Z0-9_]+$/)
    .withMessage('Username can only contain letters, numbers, and underscores'),
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be between 6 and 100 characters'),
  body('storeId')
    .custom((value) => {
      if (value === undefined || value === null || value === '') {
        return true;
      }
      return value.length >= 1 && value.length <= 100;
    })
    .withMessage('Store ID must be between 1 and 100 characters if provided'),
];

// ============================================================================
// User Creation Validation
// ============================================================================

/**
 * Validation rules for user creation endpoint
 */
export const validateUserCreation: ValidationChain[] = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z0-9\s_]+$/)
    .withMessage('Name can only contain letters, numbers, spaces, and underscores'),
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be between 6 and 100 characters'),
  body('role')
    .isIn(['Admin', 'Director', 'Manager', 'Gestor'])
    .withMessage('Role must be Admin, Director, Manager, or Gestor'),
  body('storeId')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Store ID must be between 1 and 100 characters if provided'),
];

// ============================================================================
// User Update Validation
// ============================================================================

/**
 * Validation rules for user update endpoint
 */
export const validateUserUpdate: ValidationChain[] = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 1, max: 50 })
    .withMessage('Name must be between 1 and 50 characters')
    .matches(/^[a-zA-Z0-9\s_]+$/)
    .withMessage('Name can only contain letters, numbers, spaces, and underscores'),
  body('role')
    .optional()
    .isIn(['Admin', 'Director', 'Manager', 'Gestor'])
    .withMessage('Role must be Admin, Director, Manager, or Gestor'),
  body('storeId')
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage('Store ID must be between 1 and 100 characters if provided'),
];

// ============================================================================
// Password Change Validation
// ============================================================================

/**
 * Validation rules for password change endpoint
 */
export const validatePasswordChange: ValidationChain[] = [
  body('oldPassword')
    .optional()
    .isLength({ min: 6, max: 100 })
    .withMessage('Old password must be between 6 and 100 characters'),
  body('password')
    .optional()
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be between 6 and 100 characters'),
  body('newPassword')
    .optional()
    .isLength({ min: 6, max: 100 })
    .withMessage('New password must be between 6 and 100 characters'),
];

// ============================================================================
// Password Reset Validation (for admin-initiated resets)
// ============================================================================

/**
 * Validation rules for admin password reset endpoint
 */
export const validateAdminPasswordReset: ValidationChain[] = [
  body('password')
    .isLength({ min: 6, max: 100 })
    .withMessage('Password must be between 6 and 100 characters'),
];
