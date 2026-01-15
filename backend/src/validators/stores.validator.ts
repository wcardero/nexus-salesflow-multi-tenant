import { body, param, ValidationChain } from 'express-validator';

// ============================================================================
// Store Creation Validation
// ============================================================================

/**
 * Validation rules for store creation endpoint
 */
export const validateStoreCreation: ValidationChain[] = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Store name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Store name can only contain letters, numbers, spaces, hyphens, and underscores'),
];

// ============================================================================
// Store Update Validation
// ============================================================================

/**
 * Validation rules for store update endpoint
 */
export const validateStoreUpdate: ValidationChain[] = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Store name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Store name can only contain letters, numbers, spaces, hyphens, and underscores'),
];

// ============================================================================
// Store ID Parameter Validation
// ============================================================================

/**
 * Validation rules for store ID in URL parameters
 */
export const validateStoreIdParam: ValidationChain[] = [
  param('storeId')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Store ID must be between 1 and 100 characters'),
];

// ============================================================================
// Assign Manager Validation
// ============================================================================

/**
 * Validation rules for assigning a manager to a store
 */
export const validateAssignManager: ValidationChain[] = [
  body('userId')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('User ID must be between 1 and 100 characters'),
];

// ============================================================================
// Product Validation
// ============================================================================

/**
 * Validation rules for product creation/update
 */
export const validateProduct: ValidationChain[] = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Product name must be between 1 and 100 characters'),
  body('costUSD')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost USD must be a positive number'),
  body('costMN')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Cost MN must be a positive number'),
  body('margin')
    .optional()
    .isFloat({ min: 0, max: 10 })
    .withMessage('Margin must be between 0 and 10'),
  body('currency')
    .optional()
    .isIn(['USD', 'MN'])
    .withMessage('Currency must be USD or MN'),
  body('commissionRate')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Commission rate must be between 0 and 1'),
];

// ============================================================================
// Product Stock Validation
// ============================================================================

/**
 * Validation rules for product stock operations
 */
export const validateProductStock: ValidationChain[] = [
  body('productId')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Product ID must be between 1 and 100 characters'),
  body('storeId')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Store ID must be between 1 and 100 characters'),
  body('quantity')
    .isInt({ min: 0, max: 1000000 })
    .withMessage('Quantity must be a positive integer between 0 and 1,000,000'),
];

// ============================================================================
// Inventory Assignment Validation
// ============================================================================

/**
 * Validation rules for inventory assignment
 */
export const validateInventoryAssignment: ValidationChain[] = [
  body('productId')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Product ID must be between 1 and 100 characters'),
  body('gestorId')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Gestor ID must be between 1 and 100 characters'),
  body('quantity')
    .isInt({ min: 1, max: 1000000 })
    .withMessage('Quantity must be a positive integer between 1 and 1,000,000'),
];

// ============================================================================
// Exchange Rate Validation
// ============================================================================

/**
 * Validation rules for exchange rate creation
 */
export const validateExchangeRate: ValidationChain[] = [
  body('rate')
    .isFloat({ min: 0 })
    .withMessage('Exchange rate must be a positive number'),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid ISO 8601 date'),
];

// ============================================================================
// Pagination Validation
// ============================================================================

/**
 * Validation rules for pagination parameters
 */
export const validatePagination: ValidationChain[] = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
];

// Import query for pagination validation
import { query } from 'express-validator';
