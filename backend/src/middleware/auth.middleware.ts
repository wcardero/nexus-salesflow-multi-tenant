import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// JWT_SECRET debe estar definido en environment variables
if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required. Please set it in backend/.env');
}
const JWT_SECRET = process.env.JWT_SECRET;

// ============================================================================
// Types
// ============================================================================

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    role: string;
    storeId: string;
  };
}

// ============================================================================
// Authentication Middleware
// ============================================================================

/**
 * Middleware to authenticate and attach user from JWT token
 */
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ message: 'Access token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as {
      id: string;
      name: string;
      role: string;
      storeId: string;
    };
    (req as AuthenticatedRequest).user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// ============================================================================
// Role Checking Helpers
// ============================================================================

export type UserRole = 'Admin' | 'Director' | 'Manager' | 'Gestor';

// Helper function to safely get role or default to Gestor (most restrictive)
export const getUserRole = (role: string | undefined): UserRole => {
  const validRoles: UserRole[] = ['Admin', 'Director', 'Manager', 'Gestor'];
  return validRoles.includes(role as UserRole) ? (role as UserRole) : 'Gestor';
};

/**
 * Check if user has admin role
 */
export const isAdmin = (role: string | undefined): boolean => getUserRole(role) === 'Admin';

/**
 * Check if user has director role
 */
export const isDirector = (role: string | undefined): boolean => getUserRole(role) === 'Director';

/**
 * Check if user has manager role
 */
export const isManager = (role: string | undefined): boolean => getUserRole(role) === 'Manager';

/**
 * Check if user has gestor role
 */
export const isGestor = (role: string | undefined): boolean => getUserRole(role) === 'Gestor';

/**
 * Check if user can create users of target role
 */
export const canCreateUser = (requestingRole: string | undefined, targetRole: string | undefined): boolean => {
  const hierarchy: Record<UserRole, UserRole[]> = {
    Admin: ['Director', 'Manager'],
    Director: ['Manager'],
    Manager: ['Gestor'],
    Gestor: [],
  };

  const reqRole = getUserRole(requestingRole);
  const tgtRole = getUserRole(targetRole);
  return hierarchy[reqRole]?.includes(tgtRole) ?? false;
};

// ============================================================================
// JWT Utilities
// ============================================================================

/**
 * Generate JWT token for user
 */
export const generateToken = (user: {
  id: string;
  name: string;
  role: string;
  storeId: string;
}): string => {
  return jwt.sign(
    { id: user.id, name: user.name, role: user.role, storeId: user.storeId },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
};

/**
 * Verify and decode JWT token
 */
export const verifyToken = (token: string): {
  id: string;
  name: string;
  role: string;
  storeId: string;
} | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as {
      id: string;
      name: string;
      role: string;
      storeId: string;
    };
  } catch {
    return null;
  }
};
