import { Request, Response, NextFunction } from 'express';
import bcrypt from 'bcrypt';
import db from '../db';
import { generateToken, AuthenticatedRequest, isAdmin } from '../middleware/auth.middleware';
import { loginLimiter } from '../middleware/rate-limit.middleware';
import { validateLogin, validateUserCreation } from '../validators/auth.validator';
import { validationResult } from 'express-validator';
import { auditUserLogin, auditUserCreation } from '../utils/audit.utils';

// ============================================================================
// Login Controller
// ============================================================================

export const login = [
  loginLimiter,
  validateLogin,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { name, password, storeId } = req.body;

    try {
      const result = await db.query('SELECT * FROM "User" WHERE name = $1', [name]);
      
      if (result.rows.length === 0) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      let user = result.rows[0];
      const passwordMatch = await bcrypt.compare(password, user.password);

      if (!passwordMatch) {
        return res.status(401).json({ message: 'Invalid credentials.' });
      }

      // For non-admin users, validate store selection
      if (!isAdmin(user.role)) {
        if (!storeId || storeId === '') {
          return res.status(400).json({ message: 'Debes seleccionar una tienda.' });
        }

        if (user.storeId !== storeId) {
          // Check if user is assigned to this store via _StoreToUser
          const storeToUserResult = await db.query(
            'SELECT "A" FROM "_StoreToUser" WHERE "B" = $1 AND "A" = $2',
            [storeId, user.id]
          );

          if (storeToUserResult.rows.length === 0) {
            return res.status(401).json({ message: 'El usuario no pertenece a esta tienda.' });
          }

          // User is assigned to store via _StoreToUser, update user object
          user = { ...user, storeId };
        }
      }

      // Create JWT token
      const token = generateToken({
        id: user.id,
        name: user.name,
        role: user.role,
        storeId: user.storeId || '',
      });

      // Log successful login
      await auditUserLogin(user.id, user.storeId);

      // Don't send password back to client
      delete user.password;

      res.json({ ...user, token });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
];

// ============================================================================
// User Creation Controller
// ============================================================================

export const createUser = [
  async (req: Request, res: Response, next: NextFunction) => {
    // Check if any users exist
    try {
      const checkResult = await db.query('SELECT COUNT(*) FROM "User"');
      const userCount = parseInt(checkResult.rows[0].count);
      
      if (userCount === 0) {
        // If no users exist, allow creating the first admin without a token
        return next();
      }
      
      // If users exist, enforce authentication
      const { authenticateToken } = await import('../middleware/auth.middleware');
      authenticateToken(req, res, next);
    } catch (error) {
      console.error('Error checking user count:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
  validateUserCreation,
  async (req: Request, res: Response) => {
    const { name, password, role, storeId } = req.body;
    let finalStoreId = storeId;
    let requestingUser: any = null;

    // Check if any users exist to see if this is the first one
    const checkResult = await db.query('SELECT COUNT(*) FROM "User"');
    const isFirstUser = parseInt(checkResult.rows[0].count) === 0;

    // If not the first user, check if the requesting user has admin role
    if (!isFirstUser) {
      requestingUser = (req as AuthenticatedRequest).user;

      // Admins can create Directors and Managers
      if (requestingUser?.role === 'Admin') {
        // Prevent creating additional Admins after the first one
        if (role === 'Admin') {
          return res.status(403).json({ message: 'Only the first user can be an Admin. Cannot create additional Admins.' });
        }

        // Managers must be assigned to a store
        if (role === 'Manager' && !storeId) {
          return res.status(400).json({ message: 'No puedes agregar un manager sin antes asociarle una tienda.' });
        }

        // Directors must be assigned to a store
        if (role === 'Director' && !storeId) {
          return res.status(400).json({ message: 'No puedes agregar un director sin antes asociarle una tienda.' });
        }
      }
      // Directors can create Managers for their own store
      else if (requestingUser?.role === 'Director') {
        if (role !== 'Manager') {
          return res.status(403).json({ message: 'Directors can only create Managers.' });
        }
        // Managers are automatically assigned to Director's store
        finalStoreId = requestingUser.storeId || null;
        if (!finalStoreId) {
          return res.status(400).json({ message: 'You must be assigned to a store to create Managers.' });
        }
      }
      // Managers can only create Gestors for their own store
      else if (requestingUser?.role === 'Manager') {
        if (role !== 'Gestor') {
          return res.status(403).json({ message: 'Managers can only create Gestors.' });
        }
        finalStoreId = requestingUser.storeId || null;
        if (!finalStoreId) {
          return res.status(400).json({ message: 'You must be assigned to a store to create Gestors.' });
        }
      }
      // No other roles can create users
      else {
        return res.status(403).json({ message: 'Access denied.' });
      }
    }

    // Check if user with same name already exists
    let nameCheckQuery = 'SELECT COUNT(*) FROM "User" WHERE name = $1';
    let nameCheckParams = [name];

    if (requestingUser && (requestingUser.role === 'Manager' || requestingUser.role === 'Director')) {
      if (role === 'Gestor' && requestingUser.role === 'Manager') {
        nameCheckQuery = 'SELECT COUNT(*) FROM "User" WHERE name = $1 AND "storeId" = $2 AND role = $3';
        nameCheckParams = [name, finalStoreId, 'Gestor'];
      } else if (role === 'Manager' && requestingUser.role === 'Director') {
        nameCheckQuery = 'SELECT COUNT(*) FROM "User" WHERE name = $1 AND "storeId" = $2 AND role = $3';
        nameCheckParams = [name, requestingUser.storeId, 'Manager'];
      } else {
        nameCheckQuery = 'SELECT COUNT(*) FROM "User" WHERE name = $1 AND "storeId" = $2';
        nameCheckParams = [name, requestingUser.storeId];
      }
    }

    if (!requestingUser && storeId) {
      nameCheckQuery = 'SELECT COUNT(*) FROM "User" WHERE name = $1 AND "storeId" = $2';
      nameCheckParams = [name, storeId];
    }

    try {
      const nameCheckResult = await db.query(nameCheckQuery, nameCheckParams);
      const nameCount = parseInt(nameCheckResult.rows[0].count);

      if (nameCount > 0) {
        return res.status(400).json({ message: 'Ya existe un usuario con ese nombre en esta tienda.' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);
      const newUserId = `user-${Date.now()}`;
      const storeIdToUse = finalStoreId !== undefined ? finalStoreId : (storeId || null);
      
      const result = await db.query(
        'INSERT INTO "User" (id, name, password, role, "storeId", "createdBy") VALUES ($1, $2, $3, $4, $5, $6) RETURNING id, name, role, "storeId", "createdBy"',
        [newUserId, name, hashedPassword, role, storeIdToUse, requestingUser ? requestingUser.id : null]
      );

      // If user has a storeId, insert into _StoreToUser relation
      if (storeIdToUse) {
        await db.query(
          'INSERT INTO "_StoreToUser" ("A", "B") VALUES ($1, $2)',
          [storeIdToUse, newUserId]
        );
      }

      // Audit log
      const requestingId = requestingUser?.id || newUserId; // First user creates themselves
      await auditUserCreation(requestingId, newUserId, result.rows[0], storeIdToUse);

      res.status(201).json(result.rows[0]);
    } catch (error) {
      console.error('User creation error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
];
