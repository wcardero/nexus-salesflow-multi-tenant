// backend/src/index.ts
import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import * as path from 'path';
import * as fs from 'fs';
import { body, param, query, validationResult } from 'express-validator';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from './db';

// Secret for JWT tokens (should be in environment variables)
const JWT_SECRET = process.env.JWT_SECRET || 'nexus_salesflow_secret';

const app = express();
const PORT = process.env.PORT || 3001;

// Rate limiting middleware
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  handler: (req: Request, res: any) => {
    res.status(429).json({ message: 'Too many requests from this IP, please try again later.' });
  }
});

// Login rate limiting (more restrictive)
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 login requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req: Request, res: any) => {
    res.status(429).json({ message: 'Too many login attempts, please try again later.' });
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(limiter); // Apply general rate limiting to all requests

// Helper function to create audit logs
const createAuditLog = async (userId: string, action: string, entityType: string, entityId?: string, oldValues?: any, newValues?: any, storeId?: string) => {
  try {
    const auditId = `audit-${Date.now()}`;
    await db.query(
      'INSERT INTO "AuditLog" (id, "userId", "action", "entityType", "entityId", "oldValues", "newValues", "storeId") VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
      [auditId, userId, action, entityType, entityId, oldValues, newValues, storeId]
    );
  } catch (error) {
    console.error('Error creating audit log:', error);
    // Don't throw error as audit logging shouldn't break the main functionality
  }
};

// ======================================================================
// API Routes
// ======================================================================

app.get('/', (req: Request, res: Response) => {
  res.send('Nexus SalesFlow API is running!');
});

// Public endpoint to check if any users exist (for initial setup)
app.get('/api/users/exists', async (req: Request, res: Response) => {
  try {
    const result = await db.query('SELECT COUNT(*) FROM "User"');
    const userCount = parseInt(result.rows[0].count);
    res.json({ exists: userCount > 0, count: userCount });
  } catch (error) {
    console.error('Check users exists error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Authentication middleware
// Middleware to authenticate and attach user from JWT token
const authenticateToken = (req: Request, res: Response, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    console.log('[authenticateToken] No token found in request');
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: string; name: string; role: string; storeId: string };
    console.log('[authenticateToken] Token decoded:', { id: decoded.id, name: decoded.name, role: decoded.role, storeId: decoded.storeId });
    (req as any).user = decoded;
    next();
  } catch (err) {
    console.log('[authenticateToken] Token verification failed:', err);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Validation middleware for login
const validateLogin = [
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
  (req: Request, res: Response, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    next();
  }
];

// --- AUTH Endpoints ---
app.post('/api/login', loginLimiter, validateLogin, async (req: Request, res: Response) => {
    const { name, password, storeId } = req.body;
    try {
        const result = await db.query('SELECT * FROM "User" WHERE name = $1', [name]);
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }
        let user = result.rows[0];
        console.log('[login] User found:', { id: user.id, name: user.name, role: user.role, userStoreId: user.storeId, selectedStoreId: storeId });
        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) {
            return res.status(401).json({ message: 'Invalid credentials.' });
        }

        // For non-admin users, validate store selection
        if (user.role !== 'Admin') {
            if (!storeId || storeId === '') {
                return res.status(400).json({ message: 'Debes seleccionar una tienda.' });
            }
            if (user.storeId !== storeId) {
                // Check if user is assigned to this store via _StoreToUser
                const storeToUserResult = await db.query(
                    'SELECT "A" FROM "_StoreToUser" WHERE "B" = $1 AND "A" = $2',
                    [storeId, user.id]
                );
                console.log('[login] StoreToUser check:', { storeId, userId: user.id, found: storeToUserResult.rows.length > 0 });
                if (storeToUserResult.rows.length === 0) {
                    return res.status(401).json({ message: 'El usuario no pertenece a esta tienda.' });
                }
                // User is assigned to store via _StoreToUser, update user object
                user = { ...user, storeId };
                console.log('[login] Updated user with storeId from _StoreToUser:', { userId: user.id, newStoreId: user.storeId });
            }
        }

        // Create JWT token
        const token = jwt.sign(
            { id: user.id, name: user.name, role: user.role, storeId: user.storeId },
            JWT_SECRET,
            { expiresIn: '24h' }
        );
        console.log('[login] JWT created with storeId:', user.storeId);

        // Don't send password back to client
        delete user.password;

        res.json({ ...user, token });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Public endpoint to fetch all stores
app.get('/api/stores/public', async (req: Request, res: Response) => {
    try {
        const result = await db.query('SELECT id, name FROM "Store" ORDER BY name');
        res.json(result.rows);
    } catch (error) {
        console.error('Fetch stores error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Validation middleware for user creation
const validateUserCreation = [
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
  (req: Request, res: Response, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    next();
  }
];

app.post('/api/users', async (req: Request, res: Response, next: any) => {
    // Check if any users exist
    try {
        const checkResult = await db.query('SELECT COUNT(*) FROM "User"');
        const userCount = parseInt(checkResult.rows[0].count);
        
        if (userCount === 0) {
            // If no users exist, allow creating the first admin without a token
            return next();
        }
        
        // If users exist, enforce authentication
        authenticateToken(req, res, next);
    } catch (error) {
        console.error('Error checking user count:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
}, validateUserCreation, async (req: Request, res: Response) => {
    const { name, password, role, storeId } = req.body;
    let finalStoreId = storeId;
    let requestingUser: any = null;

    // Check if any users exist to see if this is the first one
    const checkResult = await db.query('SELECT COUNT(*) FROM "User"');
    const isFirstUser = parseInt(checkResult.rows[0].count) === 0;

    // If not the first user, check if the requesting user has admin role
    if (!isFirstUser) {
        requestingUser = (req as any).user;

        // Admins can create Directors and Managers
        if (requestingUser.role === 'Admin') {
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
        else if (requestingUser.role === 'Director') {
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
        else if (requestingUser.role === 'Manager') {
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

    // For Managers and Directors, check within their store only AND same role
    if (requestingUser && (requestingUser.role === 'Manager' || requestingUser.role === 'Director')) {
        // For Managers creating Gestors, check if a Gestor with same name exists in that store
        if (role === 'Gestor' && requestingUser.role === 'Manager') {
            nameCheckQuery = 'SELECT COUNT(*) FROM "User" WHERE name = $1 AND "storeId" = $2 AND role = $3';
            nameCheckParams = [name, finalStoreId, 'Gestor'];
            console.log('[create-user] Checking duplicate Gestor:', { name, storeId: finalStoreId, query: nameCheckQuery, params: nameCheckParams });
        }
        // For Directors creating Managers, check if a Manager with same name exists in that store
        else if (role === 'Manager' && requestingUser.role === 'Director') {
            nameCheckQuery = 'SELECT COUNT(*) FROM "User" WHERE name = $1 AND "storeId" = $2 AND role = $3';
            nameCheckParams = [name, requestingUser.storeId, 'Manager'];
            console.log('[create-user] Checking duplicate Manager:', { name, storeId: requestingUser.storeId, query: nameCheckQuery, params: nameCheckParams });
        }
        // For other cases, check within store
        else {
            nameCheckQuery = 'SELECT COUNT(*) FROM "User" WHERE name = $1 AND "storeId" = $2';
            nameCheckParams = [name, requestingUser.storeId];
        }
    }

    // For non-authenticated first user (Admin creation), check within storeId if provided
    if (!requestingUser && storeId) {
        nameCheckQuery = 'SELECT COUNT(*) FROM "User" WHERE name = $1 AND "storeId" = $2';
        nameCheckParams = [name, storeId];
    }

    const nameCheckResult = await db.query(nameCheckQuery, nameCheckParams);
    const nameCount = parseInt(nameCheckResult.rows[0].count);

    if (nameCount > 0) {
        return res.status(400).json({ message: 'Ya existe un usuario con ese nombre en esta tienda.' });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUserId = `user-${Date.now()}`;
        // For Manager creating Gestor, use Manager's storeId
        const storeIdToUse = finalStoreId !== undefined ? finalStoreId : (storeId || null);
        
        console.log('[create-user] Creating user:', { name, role, storeId, finalStoreId, storeIdToUse });
        
        const result = await db.query(
            'INSERT INTO "User" (id, name, password, role, "storeId") VALUES ($1, $2, $3, $4, $5) RETURNING id, name, role, "storeId"',
            [newUserId, name, hashedPassword, role, storeIdToUse]
        );

        console.log('[create-user] User created:', result.rows[0]);

        // If user has a storeId, insert into _StoreToUser relation
        if (storeIdToUse) {
            console.log('[create-user] Inserting into _StoreToUser:', { storeId: storeIdToUse, userId: newUserId });
            await db.query(
                'INSERT INTO "_StoreToUser" ("A", "B") VALUES ($1, $2)',
                [storeIdToUse, newUserId]
            );
            console.log('[create-user] Inserted into _StoreToUser successfully');
        } else {
            console.log('[create-user] Skipping _StoreToUser insertion (no storeId)');
        }

        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('User creation error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.put('/api/users/:id/password', authenticateToken, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { oldPassword, password, newPassword } = req.body;
    const requestingUser = (req as any).user;

    // Only allow users to change their own password or admins to change any password
    if (requestingUser.id !== id && requestingUser.role !== 'Admin') {
        return res.status(403).json({ message: 'Access denied. You can only change your own password.' });
    }

    // Accept both 'password' and 'newPassword' field names for compatibility
    const targetPassword = newPassword || password;

    if (!targetPassword) {
        return res.status(400).json({ message: 'New password is required.' });
    }

    try {
        const result = await db.query('SELECT * FROM "User" WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const user = result.rows[0];

        // For user changing their own password, verify old password
        if (requestingUser.id === id) {
            if (!oldPassword) {
                return res.status(400).json({ message: 'Old password is required when changing your own password.' });
            }
            const passwordMatch = await bcrypt.compare(oldPassword, user.password);
            if (!passwordMatch) {
                return res.status(400).json({ message: 'Invalid old password.' });
            }
        }
        // For admin changing other user's password, no old password check needed

        const hashedNewPassword = await bcrypt.hash(targetPassword, 10);
        await db.query('UPDATE "User" SET password = $1 WHERE id = $2', [hashedNewPassword, id]);
        res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error) {
        console.error('Password update error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Update user endpoint
app.put('/api/users/:id', authenticateToken, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, role, storeId } = req.body;
    const requestingUser = (req as any).user;
    console.log('[update-user] Request:', { userId: requestingUser.id, role: requestingUser.role, targetId: id, name, newRole: role, newStoreId: storeId });

    // Admins can update any user
    if (requestingUser.role !== 'Admin') {
        // Managers can only update gestors (not themselves or other roles)
        if (requestingUser.role === 'Manager') {
            const targetUser = await db.query('SELECT * FROM "User" WHERE id = $1', [id]);
            if (targetUser.rows.length === 0) {
                return res.status(404).json({ message: 'User not found.' });
            }
            const userToUpdate = targetUser.rows[0];

            // Managers can only update gestors from their store
            if (userToUpdate.role !== 'Gestor') {
                return res.status(403).json({ message: 'Managers can only update gestors.' });
            }

            // Managers cannot change role or storeId
            if (role || storeId) {
                return res.status(403).json({ message: 'Managers cannot change role or storeId.' });
            }

            // Gestor must belong to manager's store
            if (userToUpdate.storeId !== requestingUser.storeId) {
                return res.status(403).json({ message: 'Gestor does not belong to your store.' });
            }

            // Managers can only update name
            if (!name) {
                return res.status(400).json({ message: 'Name is required.' });
            }

            // Update gestor name
            await db.query('UPDATE "User" SET name = $1 WHERE id = $2', [name.trim(), id]);
            res.status(200).json({ message: 'Gestor updated successfully.' });
            return;
        }

        return res.status(403).json({ message: 'Access denied. Only admins can update users.' });
    }

    // Prevent admin from changing their own role
    if (id === requestingUser.id && role && role !== requestingUser.role) {
        return res.status(403).json({ message: 'You cannot change your own role.' });
    }

    // Prevent admin from assigning themselves a store
    if (id === requestingUser.id && storeId && storeId !== requestingUser.storeId) {
        return res.status(403).json({ message: 'You cannot assign yourself to a store.' });
    }

    try {
        // Get current user for comparison and audit logging
        const currentUser = await db.query('SELECT * FROM "User" WHERE id = $1', [id]);
        if (currentUser.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const existingUser = currentUser.rows[0];

        // Prevent creating additional admins
        if (role && role === 'Admin' && existingUser.role !== 'Admin') {
            const adminCount = await db.query('SELECT COUNT(*) FROM "User" WHERE role = $1', ['Admin']);
            const count = parseInt(adminCount.rows[0].count);
            if (count > 0) {
                return res.status(403).json({ message: 'Cannot promote additional users to Admin.' });
            }
        }

        // Build update query dynamically based on provided fields
        const updates: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (name !== undefined) {
            updates.push(`name = $${paramIndex}`);
            values.push(name);
            paramIndex++;
        }

        if (role !== undefined) {
            updates.push(`role = $${paramIndex}`);
            values.push(role);
            paramIndex++;
        }

        if (storeId !== undefined) {
            updates.push(`"storeId" = $${paramIndex}`);
            values.push(storeId || null);
            paramIndex++;
        }

        if (updates.length === 0) {
            return res.status(400).json({ message: 'No fields to update.' });
        }

        values.push(id);
        const query = `UPDATE "User" SET ${updates.join(', ')} WHERE id = $${paramIndex} RETURNING id, name, role, "storeId"`;

        const result = await db.query(query, values);

        // Create audit log
        await createAuditLog(
            requestingUser.id,
            'UPDATE_USER',
            'User',
            id,
            { ...existingUser, password: '[REDACTED]' },
            { ...result.rows[0], password: '[REDACTED]' },
            existingUser.storeId
        );

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('User update error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// --- GET Endpoints ---
app.get('/api/users', authenticateToken, async (req, res) => {
  const requestingUser = (req as any).user;
  console.log('[get-users] Request:', { userId: requestingUser.id, role: requestingUser.role, storeId: requestingUser.storeId });

  // Only admins can see all users
  if (requestingUser.role !== 'Admin') {
    // For Directors and Managers, get their store ID from _StoreToUser if not in User
    let storeIdToUse = requestingUser.storeId;
    console.log('[get-users] Initial storeId:', storeIdToUse);
    if (!storeIdToUse) {
      const storeResult = await db.query(
        'SELECT "A" as storeId FROM "_StoreToUser" WHERE "B" = $1 LIMIT 1',
        [requestingUser.id]
      );
      console.log('[get-users] _StoreToUser query result:', storeResult.rows);
      if (storeResult.rows.length > 0) {
        storeIdToUse = storeResult.rows[0].storeId;
        console.log('[get-users] Got storeId from _StoreToUser:', storeIdToUse);
      }
    }

    // Directors can see managers from their store
    if (requestingUser.role === 'Director') {
      if (!storeIdToUse) {
        return res.status(400).json({ message: 'You must be assigned to a store.' });
      }
      const { rows } = await db.query(
        'SELECT id, name, role, "storeId" FROM "User" WHERE role = $1 AND "storeId" = $2',
        ['Manager', storeIdToUse]
      );
      console.log('[get-users] Returning Managers for store:', { storeId: storeIdToUse, count: rows.length });
      return res.json(rows);
    }
    // Managers can see gestors from their store
    if (requestingUser.role === 'Manager') {
      if (!storeIdToUse) {
        return res.status(400).json({ message: 'You must be assigned to a store.' });
      }
      const { rows } = await db.query(
        'SELECT id, name, role, "storeId" FROM "User" WHERE role = $1 AND "storeId" = $2',
        ['Gestor', storeIdToUse]
      );
      console.log('[get-users] Returning Gestores for store:', { storeId: storeIdToUse, count: rows.length });
      return res.json(rows);
    }
    // Gestors cannot see other users
    return res.status(403).json({ message: 'Access denied.' });
  }

  const { rows } = await db.query('SELECT id, name, role, "storeId" FROM "User"', []);
  res.json(rows);
});

app.get('/api/stores', authenticateToken, async (req: Request, res: Response) => {
  const requestingUser = (req as any).user;

  // Managers can only see their assigned stores
  let storeCondition = '';
  const params: any[] = [];

  if (requestingUser.role === 'Manager') {
    if (requestingUser.storeId) {
      // Return the manager's primary store AND stores assigned via _StoreToUser
      storeCondition = `WHERE s.id = $1 OR s.id IN (
        SELECT stum."A" FROM "_StoreToUser" stum
        WHERE stum."B" = $2
      )`;
      params.push(requestingUser.storeId, requestingUser.id);
    } else {
      // Fallback to the many-to-many relation if needed
      storeCondition = `WHERE s.id IN (
        SELECT stum."A" FROM "_StoreToUser" stum
        JOIN "User" u ON stum."B" = u.id
        WHERE u.id = $1
      )`;
      params.push(requestingUser.id);
    }
  } else if (requestingUser.role === 'Gestor') {
    // Gestors can only see their store
    if (requestingUser.storeId) {
      storeCondition = 'WHERE s.id = $1';
      params.push(requestingUser.storeId);
    } else {
      return res.status(403).json({ message: 'Gestor not assigned to a store.' });
    }
  }

  const query = `SELECT s.* FROM "Store" s ${storeCondition}`;
  const { rows: stores } = await db.query(query, params);

  const storesWithRatesAndManagers = await Promise.all(stores.map(async (store) => {
    const { rows: exchangeRates } = await db.query('SELECT * FROM "ExchangeRate" WHERE "storeId" = $1', [store.id]);

    // Get managers for this store using the junction table
    const { rows: storeManagers } = await db.query(`
      SELECT u.id FROM "_StoreToUser" stum
      JOIN "User" u ON stum."B" = u.id
      WHERE stum."A" = $1 AND u.role = 'Manager'
    `, [store.id]);

    const managerIds = storeManagers.map(row => row.id);

    return { ...store, exchangeRates, managerIds };
  }));
  res.json(storesWithRatesAndManagers);
});

// Validation middleware for store creation
const validateStoreCreation = [
  body('name')
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage('Store name must be between 1 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Store name can only contain letters, numbers, spaces, hyphens, and underscores'),
  body('defaultCommissionRate')
    .optional()
    .isFloat({ min: 0, max: 1 })
    .withMessage('Default commission rate must be a number between 0 and 1'),
  (req: Request, res: Response, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    next();
  }
];

app.post('/api/stores', authenticateToken, validateStoreCreation, async (req: Request, res: Response) => {
    const { name, defaultCommissionRate } = req.body;
    const requestingUser = (req as any).user;

    if (requestingUser.role !== 'Admin') {
        return res.status(403).json({ message: 'Access denied. Only admins can create stores.' });
    }

    try {
        const newStoreId = `store-${Date.now()}`;

        // Check if store name already exists
        const nameCheckResult = await db.query('SELECT COUNT(*) FROM "Store" WHERE name = $1', [name]);
        const nameCount = parseInt(nameCheckResult.rows[0].count);

        if (nameCount > 0) {
            return res.status(400).json({ message: 'Ya existe una tienda con ese nombre.' });
        }

        const result = await db.query(
            'INSERT INTO "Store" (id, name, "defaultCommissionRate") VALUES ($1, $2, $3) RETURNING *',
            [newStoreId, name, defaultCommissionRate || 0.10]
        );
        // Create audit log for store creation
        await createAuditLog(requestingUser.id, 'CREATE_STORE', 'Store', result.rows[0].id, null, result.rows[0], result.rows[0].id);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Store creation error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.put('/api/stores/:id', authenticateToken, async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;
    const requestingUser = (req as any).user;

    if (requestingUser.role !== 'Admin') {
        return res.status(403).json({ message: 'Access denied. Only admins can update stores.' });
    }

    if (!name) {
        return res.status(400).json({ message: 'Store name is required.' });
    }

    // Get the current store for audit logging
    const currentStoreResult = await db.query('SELECT * FROM "Store" WHERE id = $1', [id]);
    if (currentStoreResult.rows.length === 0) {
        return res.status(404).json({ message: 'Store not found.' });
    }

    try {
        const result = await db.query('UPDATE "Store" SET name = $1 WHERE id = $2 RETURNING *', [name, id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Store not found.' });
        }

        // Create audit log for store update
        await createAuditLog(
          requestingUser.id,
          'UPDATE_STORE',
          'Store',
          id,
          currentStoreResult.rows[0],
          result.rows[0],
          id
        );

        res.status(200).json(result.rows[0]);
    } catch (error) {
        console.error('Store update error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Endpoint to assign a manager to a store
app.post('/api/stores/:storeId/assign-manager', authenticateToken, async (req: Request, res: Response) => {
  const { storeId } = req.params;
  const { userId } = req.body;
  const requestingUser = (req as any).user;

  // Only admins can assign managers to stores
  if (requestingUser.role !== 'Admin') {
    return res.status(403).json({ message: 'Access denied. Only admins can assign managers to stores.' });
  }

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required.' });
  }

  try {
    // Check if the store exists
    const storeResult = await db.query('SELECT id FROM "Store" WHERE id = $1', [storeId]);
    if (storeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Store not found.' });
    }

    // Check if the user exists and is a manager
    const userResult = await db.query('SELECT id, role FROM "User" WHERE id = $1', [userId]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    if (userResult.rows[0].role !== 'Manager') {
      return res.status(400).json({ message: 'User is not a manager.' });
    }

    // Assign the manager to the store
    await db.query(
      'INSERT INTO "_StoreToUser" ("A", "B") VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [storeId, userId]
    );

    // Create audit log for manager assignment
    await createAuditLog(
      requestingUser.id,
      'ASSIGN_MANAGER_TO_STORE',
      'StoreUser',
      storeId,
      null,
      { storeId, userId },
      storeId
    );

    res.status(200).json({ message: 'Manager assigned to store successfully.' });
  } catch (error) {
    console.error('Assign manager to store error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint to remove a manager from a store
app.delete('/api/stores/:storeId/remove-manager/:userId', authenticateToken, async (req: Request, res: Response) => {
  const { storeId, userId } = req.params;
  const requestingUser = (req as any).user;

  // Only admins can remove managers from stores
  if (requestingUser.role !== 'Admin') {
    return res.status(403).json({ message: 'Access denied. Only admins can remove managers from stores.' });
  }

  try {
    await db.query(
      'DELETE FROM "_StoreToUser" WHERE "A" = $1 AND "B" = $2',
      [storeId, userId]
    );

    // Create audit log for manager removal
    await createAuditLog(
      requestingUser.id,
      'REMOVE_MANAGER_FROM_STORE',
      'StoreUser',
      storeId,
      { storeId, userId },
      null,
      storeId
    );

    res.status(200).json({ message: 'Manager removed from store successfully.' });
  } catch (error) {
    console.error('Remove manager from store error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/users/:id', authenticateToken, async (req: Request, res: Response) => {
    const { id } = req.params;
    const requestingUser = (req as any).user;

    // Only admins can delete users
    if (requestingUser.role !== 'Admin') {
        return res.status(403).json({ message: 'Access denied. Only admins can delete users.' });
    }

    // Prevent admin from deleting themselves
    if (id === requestingUser.id) {
        return res.status(400).json({ message: 'Cannot delete your own account.' });
    }

    try {
        console.log('[delete-user] Deleting user:', id);

        // Get user info before deletion for audit log
        const userResult = await db.query('SELECT * FROM "User" WHERE id = $1', [id]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }
        const user = userResult.rows[0];

        // Delete audit logs created by this user (userId foreign key)
        console.log('[delete-user] Deleting audit logs for user...');
        await db.query('DELETE FROM "AuditLog" WHERE "userId" = $1', [id]);

        // Delete inventory items where user is the gestor
        console.log('[delete-user] Deleting inventory items where gestorId = user...');
        await db.query('DELETE FROM "InventoryItem" WHERE "gestorId" = $1', [id]);

        // Delete _StoreToUser relations
        console.log('[delete-user] Deleting _StoreToUser relations...');
        await db.query('DELETE FROM "_StoreToUser" WHERE "B" = $1', [id]);

        // Finally, delete the user
        console.log('[delete-user] Deleting user...');
        const result = await db.query('DELETE FROM "User" WHERE id = $1 RETURNING id', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'User not found.' });
        }

        console.log('[delete-user] User deleted successfully:', id);

        // Create audit log for user deletion
        await createAuditLog(
          requestingUser.id,
          'DELETE_USER',
          'User',
          id,
          user,
          null,
          undefined
        );

        res.status(200).json({ message: 'User deleted successfully.' });
    } catch (error) {
        console.error('User deletion error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

app.delete('/api/stores/:id', authenticateToken, async (req: Request, res: Response) => {
    const { id } = req.params;
    const requestingUser = (req as any).user;
    // Only admins can delete stores
    if (requestingUser.role !== 'Admin') {
        return res.status(403).json({ message: 'Access denied. Only admins can delete stores.' });
    }

    try {
        // Get store for audit logging
        const storeResult = await db.query('SELECT * FROM "Store" WHERE id = $1', [id]);
        if (storeResult.rows.length === 0) {
            return res.status(404).json({ message: 'Store not found.' });
        }

        await db.query('DELETE FROM "Store" WHERE id = $1', [id]);

        // Create audit log for store deletion
        await createAuditLog(
          requestingUser.id,
          'DELETE_STORE',
          'Store',
          id,
          storeResult.rows[0],
          null,
          id
        );

        res.status(200).json({ message: 'Store deleted successfully.' });
    } catch (error) {
        console.error('Store deletion error:', error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Endpoint to get product stock
app.get('/api/product-stock', authenticateToken, async (req, res) => {
  const requestingUser = (req as any).user;

  let storeCondition = '';
  const params: any[] = [];

  if (requestingUser.role === 'Manager') {
    storeCondition = `WHERE ps."storeId" IN (
      SELECT stum."A" FROM "_StoreToUser" stum
      JOIN "User" u ON stum."B" = u.id
      WHERE u.id = $1
    )`;
    params.push(requestingUser.id);
  } else if (requestingUser.role === 'Gestor') {
    if (requestingUser.storeId) {
      storeCondition = 'WHERE ps."storeId" = $1';
      params.push(requestingUser.storeId);
    } else {
      return res.status(403).json({ message: 'Gestor not assigned to a store.' });
    }
  }

  const query = `
    SELECT ps.*, p.name as productName, s.name as storeName
    FROM "ProductStock" ps
    JOIN "Product" p ON ps."productId" = p.id
    JOIN "Store" s ON ps."storeId" = s.id
    ${storeCondition}
  `;
  const { rows } = await db.query(query, params);
  res.json(rows);
});

// Validation middleware for product stock
const validateProductStock = [
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
  (req: Request, res: Response, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    next();
  }
];

// Endpoint to delete product stock
app.delete('/api/product-stock/:stockId', authenticateToken, async (req: Request, res: Response) => {
  const { stockId } = req.params;
  const requestingUser = (req as any).user;

  if (requestingUser.role !== 'Manager' && requestingUser.role !== 'Director') {
    return res.status(403).json({ message: 'Access denied. Only managers can delete product stock.' });
  }

  try {
    // Check if stock exists and get product info
    const stockResult = await db.query(
      'SELECT * FROM "ProductStock" WHERE id = $1',
      [stockId]
    );

    if (stockResult.rows.length === 0) {
      return res.status(404).json({ message: 'Stock record not found.' });
    }

    const stock = stockResult.rows[0];

    // Check if manager has access to this store
    const storeAccess = await db.query(
      'SELECT * FROM "_StoreToUser" WHERE "A" = $1 AND "B" = $2',
      [stock.storeId, requestingUser.id]
    );
    if (storeAccess.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied. You do not have access to this store.' });
    }

    // Check if product is assigned to any gestor
    const assignedCheck = await db.query(
      'SELECT COUNT(*) FROM "AssignedInventory" WHERE "productId" = $1',
      [stock.productId]
    );
    const isAssigned = parseInt(assignedCheck.rows[0].count) > 0;

    if (isAssigned) {
      return res.status(400).json({ message: 'El producto no puede ser eliminado del stock porque se encuentra asignado a un gestor.' });
    }

    await db.query('DELETE FROM "ProductStock" WHERE id = $1', [stockId]);

    // Create audit log for stock deletion
    await createAuditLog(
      requestingUser.id,
      'DELETE_STOCK',
      'ProductStock',
      stockId,
      stock,
      null,
      stock.storeId
    );

    res.status(200).json({ message: 'Stock deleted successfully.' });
  } catch (error) {
    console.error('Product stock deletion error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint to set product stock
app.post('/api/product-stock', authenticateToken, validateProductStock, async (req: Request, res: Response) => {
  const { productId, storeId, quantity } = req.body;
  const requestingUser = (req as any).user;

  if (requestingUser.role !== 'Manager') {
    return res.status(403).json({ message: 'Access denied. Only managers can set product stock.' });
  }

  // Check if manager has access to this store
  console.log('[product-stock] requestingUser:', requestingUser.id, 'storeId:', storeId, 'user.role:', requestingUser.role);
  const storeAccess = await db.query(
    'SELECT * FROM "_StoreToUser" WHERE "A" = $1 AND "B" = $2',
    [storeId, requestingUser.id]
  );
  console.log('[product-stock] storeAccess result:', storeAccess.rows);
  if (storeAccess.rows.length === 0) {
    console.error('[product-stock] Access denied - user:', requestingUser.id, 'store:', storeId);
    return res.status(403).json({ message: 'Access denied. You do not have access to this store.' });
  }


  try {
    // Check if stock record already exists
    const existingStock = await db.query(
      'SELECT * FROM "ProductStock" WHERE "productId" = $1 AND "storeId" = $2',
      [productId, storeId]
    );

    let result;
    if (existingStock.rows.length > 0) {
      // Update existing stock
      result = await db.query(
        'UPDATE "ProductStock" SET "quantity" = $1 WHERE "productId" = $2 AND "storeId" = $3 RETURNING *',
        [quantity, productId, storeId]
      );
    } else {
      // Create new stock record
      const stockId = `stock-${Date.now()}`;
      result = await db.query(
        'INSERT INTO "ProductStock" (id, "productId", "storeId", "quantity") VALUES ($1, $2, $3, $4) RETURNING *',
        [stockId, productId, storeId, quantity]
      );
    }

    // Create audit log for stock update
    await createAuditLog(
      requestingUser.id,
      'UPDATE_STOCK',
      'ProductStock',
      result.rows[0]?.id,
      existingStock.rows[0] || null,
      result.rows[0],
      storeId
    );

    res.status(200).json(result.rows[0]);
  } catch (error) {
    console.error('Product stock error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint to get assigned inventory
app.get('/api/assigned-inventory', authenticateToken, async (req, res) => {
  const requestingUser = (req as any).user;

  let condition = '';
  const params: any[] = [];

  if (requestingUser.role === 'Manager') {
    condition = `WHERE ai."gestorId" IN (
      SELECT u.id FROM "User" u
      WHERE u."storeId" IN (
        SELECT stum."A" FROM "_StoreToUser" stum
        JOIN "User" mgr ON stum."B" = mgr.id
        WHERE mgr.id = $1
      )
    )`;
    params.push(requestingUser.id);
  } else if (requestingUser.role === 'Gestor') {
    condition = 'WHERE ai."gestorId" = $1';
    params.push(requestingUser.id);
  }

  const query = `
    SELECT ai.*, p.name as productName, u.name as gestorName
    FROM "AssignedInventory" ai
    JOIN "Product" p ON ai."productId" = p.id
    JOIN "User" u ON ai."gestorId" = u.id
    ${condition}
  `;
  const { rows } = await db.query(query, params);
  res.json(rows);
});

// Validation middleware for inventory assignment
const validateInventoryAssignment = [
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
  (req: Request, res: Response, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }
    next();
  }
];

// Endpoint to assign inventory to gestor
app.post('/api/assigned-inventory', authenticateToken, validateInventoryAssignment, async (req: Request, res: Response) => {
  const { productId, gestorId, quantity } = req.body;
  const requestingUser = (req as any).user;

  if (requestingUser.role !== 'Manager') {
    return res.status(403).json({ message: 'Access denied. Only managers can assign inventory.' });
  }

  try {
    // Check if the manager has access to the gestor's store
    const gestor = await db.query('SELECT "storeId" FROM "User" WHERE id = $1', [gestorId]);
    if (gestor.rows.length === 0 || !gestor.rows[0].storeId) {
      return res.status(400).json({ message: 'Gestor not assigned to a store.' });
    }

    const storeId = gestor.rows[0].storeId;

    // Check if the manager has access to this store
    const storeAccess = await db.query(
      'SELECT * FROM "_StoreToUser" WHERE "A" = $1 AND "B" = $2',
      [storeId, requestingUser.id]
    );
    if (storeAccess.rows.length === 0) {
      return res.status(403).json({ message: 'Access denied. You do not have access to this store.' });
    }

    const stockResult = await db.query(
      'SELECT "quantity" FROM "ProductStock" WHERE "productId" = $1 AND "storeId" = $2',
      [productId, storeId]
    );

    if (stockResult.rows.length === 0) {
      return res.status(400).json({ message: 'Product stock not found for this store.' });
    }

    const availableStock = stockResult.rows[0].quantity;
    if (availableStock < quantity) {
      return res.status(400).json({ message: `Not enough stock available. Requested: ${quantity}, Available: ${availableStock}` });
    }

    // Create or update assigned inventory
    const assignedId = `assign-${Date.now()}`;
    const result = await db.query(
      'INSERT INTO "AssignedInventory" (id, "productId", "gestorId", "quantity") VALUES ($1, $2, $3, $4) RETURNING *',
      [assignedId, productId, gestorId, quantity]
    );

    // Update product stock by reducing the assigned quantity
    await db.query(
      'UPDATE "ProductStock" SET "quantity" = "quantity" - $1 WHERE "productId" = $2 AND "storeId" = $3',
      [quantity, productId, storeId]
    );

    // Create audit log for inventory assignment
    await createAuditLog(
      requestingUser.id,
      'ASSIGN_INVENTORY',
      'AssignedInventory',
      result.rows[0]?.id,
      null,
      result.rows[0],
      storeId
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Assign inventory error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/products', authenticateToken, async (req, res) => {
  const requestingUser = (req as any).user;

  let storeCondition = '';
  const params: any[] = [];

  if (requestingUser.role === 'Manager') {
    storeCondition = 'WHERE "storeId" IN (SELECT "A" FROM "_StoreToUser" WHERE "B" = $1)';
    params.push(requestingUser.id);
  } else if (requestingUser.role === 'Gestor') {
    if (requestingUser.storeId) {
      storeCondition = 'WHERE "storeId" = $1';
      params.push(requestingUser.storeId);
    } else {
      return res.status(403).json({ message: 'Gestor not assigned to a store.' });
    }
  }

  const query = `SELECT * FROM "Product" ${storeCondition}`;
  const { rows } = await db.query(query, params);
  res.json(rows);
});

app.get('/api/inventory', authenticateToken, async (req, res) => {
  const requestingUser = (req as any).user;
// Validation middleware for product creation/update
const validateProduct = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Product name must be between 1 and 100 characters'),
  body('costUSD').isFloat({ min: 0.01 }).withMessage('Cost must be a positive number'),
  body('margin').isFloat({ min: 0, max: 1 }).withMessage('Margin must be between 0 and 100%'),
  body('commissionRate').optional().isFloat({ min: 0, max: 1 }).withMessage('Commission rate must be between 0 and 100%'),
  body('storeId').optional().isUUID().withMessage('Store ID must be a valid UUID'),
];

app.post('/api/products', authenticateToken, validateProduct, async (req, res) => {
  const requestingUser = (req as any).user;

  if (requestingUser.role !== 'Manager' && requestingUser.role !== 'Director') {
    return res.status(403).json({ message: 'Only Managers and Directors can create products.' });
  }

  const { name, costUSD, margin, commissionRate, storeId } = req.body;

  if (!name || !costUSD || margin === undefined) {
    return res.status(400).json({ message: 'Name, cost, and margin are required' });
  }

  const finalStoreId = storeId || requestingUser.storeId;

  if (requestingUser.role === 'Director' && !finalStoreId) {
    return res.status(400).json({ message: 'Directors must provide their store ID when creating products.' });
  }

  try {
    const productId = 'prod-' + Date.now();
    const result = await db.query(
      'INSERT INTO "Product" (id, name, "costUSD", margin, "commissionRate", "storeId") VALUES ($1, $2, $3, $4, $5) RETURNING *',
      [productId, name, parseFloat(costUSD), parseFloat(margin), commissionRate ? parseFloat(commissionRate) : null, finalStoreId]
    );

    console.log('[create-product] Product created:', result.rows[0]);

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/products/:id', authenticateToken, validateProduct, async (req, res) => {
  const requestingUser = (req as any).user;
  const { id } = req.params;

  if (requestingUser.role !== 'Manager' && requestingUser.role !== 'Director') {
    return res.status(403).json({ message: 'Only Managers and Directors can update products.' });
  }

  const { name, costUSD, margin, commissionRate } = req.body;

  if (!name || !costUSD || margin === undefined) {
    return res.status(400).json({ message: 'Name, cost, and margin are required' });
  }

  try {
    const existingProduct = await db.query('SELECT * FROM "Product" WHERE id = $1', [id]);
    if (existingProduct.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const product = existingProduct.rows[0];

    // Check if product is assigned to any gestor
    const assignedCheck = await db.query(
      'SELECT COUNT(*) FROM "InventoryItem" WHERE "productId" = $1',
      [id]
    );
    const isAssigned = parseInt(assignedCheck.rows[0].count) > 0;

    if (isAssigned) {
      return res.status(400).json({ message: 'El producto no puede ser editado ni eliminado porque se encuentra asignado a un gestor.' });
    }

    const updateFields = [];
    const updateValues = [];

    if (name !== undefined) {
      updateFields.push('name');
      updateValues.push(name);
    }
    if (costUSD !== undefined) {
      updateFields.push('"costUSD"');
      updateValues.push(parseFloat(costUSD));
    }
    if (margin !== undefined) {
      updateFields.push('margin');
      updateValues.push(parseFloat(margin));
    }
    if (commissionRate !== undefined) {
      updateFields.push('"commissionRate"');
      updateValues.push(parseFloat(commissionRate));
    }

    const updateSetClause = updateFields.map((f, i) => '"' + f + '" = $' + (i + 1)).join(', ');

    const result = await db.query(
      'UPDATE "Product" SET ' + updateSetClause + ' WHERE id = $1 RETURNING *',
      updateValues.concat([id])
    );

    console.log('[update-product] Product updated:', result.rows[0]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/products/:id', authenticateToken, async (req, res) => {
  const requestingUser = (req as any).user;
  const { id } = req.params;

  if (requestingUser.role !== 'Manager' && requestingUser.role !== 'Director') {
    return res.status(403).json({ message: 'Only Managers and Directors can delete products.' });
  }

  try {
    const existingProduct = await db.query('SELECT * FROM "Product" WHERE id = $1', [id]);
    if (existingProduct.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const product = existingProduct.rows[0];

    // Check if product is assigned to any gestor
    const assignedCheck = await db.query(
      'SELECT COUNT(*) FROM "InventoryItem" WHERE "productId" = $1',
      [id]
    );
    const isAssigned = parseInt(assignedCheck.rows[0].count) > 0;

    if (isAssigned) {
      return res.status(400).json({ message: 'El producto no puede ser editado ni eliminado porque se encuentra asignado a un gestor.' });
    }

    await db.query('DELETE FROM "Product" WHERE id = $1', [id]);

    console.log('[delete-product] Product deleted:', id);

    res.json({ message: 'Product deleted successfully.' });
  } catch (error) {
    console.error('Product deletion error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
  let condition = '';
  const params: any[] = [];

  if (requestingUser.role === 'Manager') {
    // Managers can see inventory for their stores
    condition = `WHERE "gestorId" IN (
      SELECT u.id FROM "User" u
      WHERE u."storeId" IN (
        SELECT stum."A" FROM "_StoreToUser" stum
        JOIN "User" mgr ON stum."B" = mgr.id
        WHERE mgr.id = $1
      )
    )`;
    params.push(requestingUser.id);
  } else if (requestingUser.role === 'Gestor') {
    // Gestors can only see their own inventory
    condition = 'WHERE "gestorId" = $1';
    params.push(requestingUser.id);
  }

  const query = `SELECT * FROM "InventoryItem" ${condition}`;
  const { rows } = await db.query(query, params);
  res.json(rows);
});

app.get('/api/sales', authenticateToken, async (req, res) => {
  const requestingUser = (req as any).user;

  let condition = '';
  const params: any[] = [];

  if (requestingUser.role === 'Manager') {
    // Managers can see sales for gestors in their stores
    condition = `WHERE "gestorId" IN (
      SELECT u.id FROM "User" u
      WHERE u."storeId" IN (
        SELECT stum."A" FROM "_StoreToUser" stum
        JOIN "User" mgr ON stum."B" = mgr.id
        WHERE mgr.id = $1
      )
    )`;
    params.push(requestingUser.id);
  } else if (requestingUser.role === 'Gestor') {
    // Gestors can only see their own sales
    condition = 'WHERE "gestorId" = $1';
    params.push(requestingUser.id);
  }

  const query = `SELECT * FROM "Sale" ${condition}`;
  const { rows } = await db.query(query, params);
  res.json(rows);
});

app.get('/api/closings', authenticateToken, async (req, res) => {
  const requestingUser = (req as any).user;

  let condition = '';
  const params: any[] = [];

  if (requestingUser.role === 'Manager') {
    // Managers can see closings for gestors in their stores
    condition = `WHERE "gestorId" IN (
      SELECT u.id FROM "User" u
      WHERE u."storeId" IN (
        SELECT stum."A" FROM "_StoreToUser" stum
        JOIN "User" mgr ON stum."B" = mgr.id
        WHERE mgr.id = $1
      )
    )`;
    params.push(requestingUser.id);
  } else if (requestingUser.role === 'Gestor') {
    // Gestors can only see their own closings
    condition = 'WHERE "gestorId" = $1';
    params.push(requestingUser.id);
  }

  // This would require a JOIN for sales
  const query = `SELECT * FROM "Closing" ${condition}`;
  const { rows } = await db.query(query, params);
  res.json(rows);
});

// Endpoint to create an audit log entry
app.post('/api/audit-logs', authenticateToken, async (req: Request, res: Response) => {
  const { userId, action, entityType, entityId, oldValues, newValues, storeId } = req.body;
  const requestingUser = (req as any).user;

  // Only admins can create audit logs for other users
  if (requestingUser.role !== 'Admin' && userId !== requestingUser.id) {
    return res.status(403).json({ message: 'Access denied. You can only create audit logs for yourself.' });
  }

  if (!userId || !action || !entityType) {
    return res.status(400).json({ message: 'User ID, action, and entity type are required.' });
  }

  try {
    const auditId = `audit-${Date.now()}`;
    const result = await db.query(
      'INSERT INTO "AuditLog" (id, "userId", "action", "entityType", "entityId", "oldValues", "newValues", "storeId") VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *',
      [auditId, userId, action, entityType, entityId, oldValues, newValues, storeId]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Audit log error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint to create/update exchange rate
app.post('/api/exchange-rates', authenticateToken, async (req: Request, res: Response) => {
  const { rate, startDate, storeId } = req.body;
  const requestingUser = (req as any).user;

  if (requestingUser.role !== 'Manager' && requestingUser.role !== 'Director') {
    return res.status(403).json({ message: 'Only Managers and Directors can set exchange rates.' });
  }

  if (!rate || !startDate || !storeId) {
    return res.status(400).json({ message: 'Rate, start date, and store ID are required.' });
  }

  const parsedRate = parseFloat(rate);
  if (isNaN(parsedRate) || parsedRate <= 0) {
    return res.status(400).json({ message: 'Rate must be a positive number.' });
  }

  try {
    const parsedStartDate = new Date(startDate);

    const currentRateResult = await db.query(
      'SELECT * FROM "ExchangeRate" WHERE "storeId" = $1 AND "endDate" IS NULL',
      [storeId]
    );

    if (currentRateResult.rows.length > 0) {
      await db.query(
        'UPDATE "ExchangeRate" SET "endDate" = $1 WHERE id = $2',
        [parsedStartDate, currentRateResult.rows[0].id]
      );
    }

    const newExchangeRateId = `xr-${Date.now()}`;
    const result = await db.query(
      'INSERT INTO "ExchangeRate" (id, rate, "startDate", "storeId") VALUES ($1, $2, $3, $4) RETURNING *',
      [newExchangeRateId, parsedRate, parsedStartDate, storeId]
    );

    await createAuditLog(
      requestingUser.id,
      'SET_EXCHANGE_RATE',
      'ExchangeRate',
      newExchangeRateId,
      currentRateResult.rows[0] || null,
      result.rows[0],
      storeId
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Exchange rate creation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Endpoint to get audit logs
app.get('/api/audit-logs', authenticateToken, async (req, res) => {
  const { storeId, userId, entityType, action, limit = 50, offset = 0 } = req.query;
  const requestingUser = (req as any).user;

  try {
    // Non-admins can only see their own audit logs or logs for their stores
    let query = 'SELECT * FROM "AuditLog" WHERE 1=1';
    const params: any[] = [];
    let paramIndex = 1;

    if (requestingUser.role === 'Manager') {
      // Managers can see logs for their stores
      query += ` AND ("userId" = $${paramIndex} OR "storeId" IN (
        SELECT stum."A" FROM "_StoreToUser" stum
        WHERE stum."B" = $${paramIndex}
      ))`;
      params.push(requestingUser.id);
      paramIndex++;
    } else if (requestingUser.role === 'Gestor') {
      // Gestors can only see their own logs
      query += ` AND "userId" = $${paramIndex}`;
      params.push(requestingUser.id);
      paramIndex++;
    } else if (requestingUser.role === 'Admin') {
      // Admins can see all logs, but can still filter
      if (storeId) {
        query += ` AND "storeId" = $${paramIndex}`;
        params.push(storeId);
        paramIndex++;
      }
      if (userId) {
        query += ` AND "userId" = $${paramIndex}`;
        params.push(userId);
        paramIndex++;
      }
    } else {
      // If not admin, gestor, or manager, restrict access
      query += ` AND "userId" = $${paramIndex}`;
      params.push(requestingUser.id);
      paramIndex++;
    }

    if (entityType) {
      query += ` AND "entityType" = $${paramIndex}`;
      params.push(entityType);
      paramIndex++;
    }
    if (action) {
      query += ` AND "action" = $${paramIndex}`;
      params.push(action);
      paramIndex++;
    }

    query += ` ORDER BY "timestamp" DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit as string), parseInt(offset as string));

    const { rows } = await db.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Get audit logs error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Function to initialize database tables if they don't exist
async function initializeDatabase() {
  try {
    console.log('Checking database tables...');

    // Just check if a key table exists instead of dropping everything
    const tableCheck = await db.query("SELECT 1 FROM information_schema.tables WHERE table_name = 'User'");
    
    if (tableCheck.rows.length > 0) {
      console.log('Database already initialized.');
      return;
    }

    console.log('Initializing database tables...');

    // Check if main tables exist, if not create them
    const dbSchema = `-- SQL for Nexus SalesFlow Database
CREATE TABLE "Store" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL UNIQUE,
    "defaultCommissionRate" DOUBLE PRECISION NOT NULL DEFAULT 0.10,
    "directorId" TEXT,
    CONSTRAINT "Store_directorId_fkey" FOREIGN KEY ("directorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL, -- Added password field
    "role" TEXT NOT NULL CHECK (role IN ('Admin', 'Director', 'Manager', 'Gestor')),
    "storeId" TEXT,
    CONSTRAINT "User_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "rate" DOUBLE PRECISION NOT NULL,
    "startDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "endDate" TIMESTAMP(3),
    "storeId" TEXT NOT NULL,
    CONSTRAINT "ExchangeRate_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Product" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "costUSD" DOUBLE PRECISION NOT NULL,
    "margin" DOUBLE PRECISION NOT NULL,
    "storeId" TEXT NOT NULL,
    CONSTRAINT "Product_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "InventoryItem" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "InventoryStatus" NOT NULL DEFAULT 'Available',
    "productId" TEXT NOT NULL,
    "gestorId" TEXT NOT NULL,
    CONSTRAINT "InventoryItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "InventoryItem_gestorId_fkey" FOREIGN KEY ("gestorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Table for tracking product quantities per store (for initial stock)
CREATE TABLE "ProductStock" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "storeId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProductStock_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "ProductStock_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Table for tracking assigned quantities to gestors
CREATE TABLE "AssignedInventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "productId" TEXT NOT NULL,
    "gestorId" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AssignedInventory_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AssignedInventory_gestorId_fkey" FOREIGN KEY ("gestorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Table for audit trail
CREATE TABLE "AuditLog" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT,
    "oldValues" JSONB,
    "newValues" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "storeId" TEXT,
    CONSTRAINT "AuditLog_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "AuditLog_storeId_fkey" FOREIGN KEY ("storeId") REFERENCES "Store"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE "Sale" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "soldAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "exchangeRateUsed" DOUBLE PRECISION NOT NULL,
    "costUSD" DOUBLE PRECISION NOT NULL,
    "margin" DOUBLE PRECISION NOT NULL,
    "saleUSD" DOUBLE PRECISION NOT NULL,
    "baseMN" DOUBLE PRECISION NOT NULL,
    "commission" DOUBLE PRECISION NOT NULL,
    "finalMN" DOUBLE PRECISION NOT NULL,
    "inventoryItemId" TEXT NOT NULL UNIQUE,
    "gestorId" TEXT NOT NULL,
    CONSTRAINT "Sale_inventoryItemId_fkey" FOREIGN KEY ("inventoryItemId") REFERENCES "InventoryItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Sale_gestorId_fkey" FOREIGN KEY ("gestorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

CREATE TABLE "Closing" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" "ClosingStatus" NOT NULL DEFAULT 'PENDING',
    "totalBaseMN" DOUBLE PRECISION NOT NULL,
    "totalCommission" DOUBLE PRECISION NOT NULL,
    "totalFinalMN" DOUBLE PRECISION NOT NULL,
    "gestorId" TEXT NOT NULL,
    CONSTRAINT "Closing_gestorId_fkey" FOREIGN KEY ("gestorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- Many-to-many relation for Sales in a Closing
CREATE TABLE "_ClosingToSale" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_ClosingToSale_A_fkey" FOREIGN KEY ("A") REFERENCES "Closing"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_ClosingToSale_B_fkey" FOREIGN KEY ("B") REFERENCES "Sale"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Many-to-many relation for Stores and Managers
CREATE TABLE "_StoreToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_StoreToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Store"("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_StoreToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "_ClosingToSale_AB_unique" ON "_ClosingToSale"("A", "B");
CREATE INDEX "_ClosingToSale_B_index" ON "_ClosingToSale"("B");

CREATE UNIQUE INDEX "_StoreToUser_AB_unique" ON "_StoreToUser"("A", "B");
CREATE INDEX "_StoreToUser_B_index" ON "_StoreToUser"("B");
`;

    await db.query(dbSchema);
    console.log('Database tables created successfully!');
  } catch (error) {
    console.error('Error initializing database:', error);
    throw error;
  }
}

// Start Server
try {
  db.connect().then(async () => {
    // Initialize database tables on startup
    await initializeDatabase();

// Temporary endpoint to execute migration
app.post('/api/admin/migrate-inventory-status', authenticateToken, async (req: Request, res: Response) => {
  const requestingUser = (req as any).user;

  if (requestingUser.role !== 'Admin') {
    return res.status(403).json({ message: 'Only admins can execute migrations.' });
  }

  try {
    const migrationPath = (path as any).join(__dirname, '../migrations/migrate_assigned_inventory_status.sql');
    const migrationSql = (fs as any).readFileSync(migrationPath, 'utf8');

    await db.query('BEGIN');
    await db.query(migrationSql);
    await db.query('COMMIT');

    console.log('[migration] Inventory status migration executed successfully');
    res.json({ success: true, message: 'Migration executed successfully' });
  } catch (error: any) {
    await db.query('ROLLBACK');
    console.error('[migration] Error executing migration:', error);
    res.status(500).json({ message: 'Migration failed', error: String(error) });
  }
});

app.listen(PORT, () => {
    console.log(`Server is listening on port ${PORT}`);
});
  });
} catch (error) {
  console.error('Server failed to start:', error);
  process.exit(1);
}

// Validation middleware for product creation/update
const validateProduct = [
  body('name').trim().isLength({ min: 1, max: 100 }).withMessage('Product name must be between 1 and 100 characters'),
  body('costUSD').isFloat({ min: 0.01 }).withMessage('Cost must be a positive number'),
  body('margin').isFloat({ min: 0, max: 1 }).withMessage('Margin must be between 0 and 100%'),
  body('commissionRate').optional().isFloat({ min: 0, max: 1 }).withMessage('Commission rate must be between 0 and 100%'),
  body('storeId').optional().isUUID().withMessage('Store ID must be a valid UUID'),
];

app.post('/api/products', authenticateToken, validateProduct, async (req: Request, res: Response, next: any) => {
  const requestingUser = (req as any).user;

  if (requestingUser.role !== 'Manager' && requestingUser.role !== 'Director') {
    return res.status(403).json({ message: 'Only Managers and Directors can create products.' });
  }

  const { name, costUSD, costMN, margin, commissionRate, storeId, currency } = req.body;

  if (!name || margin === undefined) {
    return res.status(400).json({ message: 'Name and margin are required.' });
  }

  if (!costUSD && !costMN) {
    return res.status(400).json({ message: 'Cost (USD or MN) is required.' });
  }

  if (costUSD && costMN) {
    return res.status(400).json({ message: 'Please specify cost in either USD or MN, not both.' });
  }

  if (costMN && !currency) {
    return res.status(400).json({ message: 'Currency is required when cost is in MN.' });
  }

  if (currency && currency !== 'USD' && currency !== 'MN') {
    return res.status(400).json({ message: 'Currency must be either USD or MN.' });
  }

  const finalStoreId = storeId || requestingUser.storeId;

  if (requestingUser.role === 'Director' && !finalStoreId) {
    return res.status(400).json({ message: 'Directors must provide their store ID when creating products.' });
  }

  try {
    // Get store for exchange rate
    const storeResult = await db.query('SELECT * FROM "Store" WHERE id = $1', [finalStoreId]);
    if (storeResult.rows.length === 0) {
      return res.status(404).json({ message: 'Store not found.' });
    }
    const store = storeResult.rows[0];
    const exchangeRate = store.exchangeRates.find(xr => !xr.endDate);

    if (!exchangeRate && currency === 'USD') {
      return res.status(400).json({ message: 'No hay un tipo de cambio vigente. Por favor, configure un tipo de cambio antes de agregar productos con costo en USD.' });
    }

    const parsedMargin = parseFloat(margin) / 100;
    let priceMN: number;
    let gestorCommissionMN: number;

    // Calculate prices based on currency
    if (currency === 'MN') {
      // Cost is in MN, no exchange rate needed
      const baseMN = costMN * (1 + parsedMargin);
      priceMN = baseMN;
      gestorCommissionMN = priceMN * (store.defaultCommissionRate);
    } else {
      // Cost is in USD, use exchange rate
      const costUSDNum = parseFloat(costUSD);
      const saleUSD = costUSDNum * (1 + parsedMargin);
      const baseMN = saleUSD * exchangeRate.rate;
      priceMN = baseMN;
      gestorCommissionMN = priceMN * (store.defaultCommissionRate);
    }

    const parsedCommissionRate = commissionRate ? parseFloat(commissionRate) : store.defaultCommissionRate;

    // Check for duplicate product name within manager's store
    const nameCheckQuery = 'SELECT COUNT(*) FROM "Product" WHERE name = $1 AND "createdBy" = $2 AND id != $3';
    const nameCheckParams = [name, requestingUser.id, 'ignore'];
    const nameCheckResult = await db.query(nameCheckQuery, nameCheckParams);
    const nameCount = parseInt(nameCheckResult.rows[0].count);

    if (nameCount > 0) {
      return res.status(409).json({ message: 'Ya tienes un producto con ese nombre.' });
    }

    const productId = 'prod-' + Date.now();
    const result = await db.query(
      'INSERT INTO "Product" (id, name, "costUSD", margin, "commissionRate", "storeId", "createdBy", currency, "priceMN", "gestorCommissionMN") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10) RETURNING *',
      [productId, name, costUSD || null, parsedMargin, commissionRate ? parsedCommissionRate : null, finalStoreId, requestingUser.id, currency || 'USD', priceMN, gestorCommissionMN]
    );

    console.log('[create-product] Product created:', result.rows[0]);

    // Create audit log
    await createAuditLog(
      requestingUser.id,
      'CREATE_PRODUCT',
      'Product',
      productId,
      null,
      result.rows[0],
      finalStoreId
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Product creation error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.put('/api/products/:id', authenticateToken, validateProduct, async (req: Request, res: Response, next: any) => {
  const requestingUser = (req as any).user;
  const { id } = req.params;

  if (requestingUser.role !== 'Manager' && requestingUser.role !== 'Director') {
    return res.status(403).json({ message: 'Only Managers and Directors can update products.' });
  }

  const { name, costUSD, margin, commissionRate } = req.body;

  if (!name || !costUSD || margin === undefined) {
    return res.status(400).json({ message: 'Name, cost, and margin are required' });
  }

  try {
    const existingProduct = await db.query('SELECT * FROM "Product" WHERE id = $1', [id]);
    if (existingProduct.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const product = existingProduct.rows[0];

    const assignedCheck = await db.query(
      'SELECT COUNT(*) FROM "InventoryItem" WHERE "productId" = $1',
      [id]
    );
    const isAssigned = parseInt(assignedCheck.rows[0].count) > 0;

    if (isAssigned) {
      return res.status(400).json({ message: 'El producto no puede ser editado ni eliminado porque se encuentra asignado a un gestor.' });
    }

    if (name !== undefined && name !== product.name) {
      const duplicateCheck = await db.query(
        'SELECT id FROM "Product" WHERE name = $1 AND "createdBy" = $2 AND id != $3',
        [name, requestingUser.id, id]
      );
      if (duplicateCheck.rows.length > 0) {
        return res.status(409).json({ message: 'Ya tienes un producto con ese nombre.' });
      }
    }

    const updateFields = [];
    const updateValues = [];
    if (name !== undefined) { updateFields.push('name'); updateValues.push(name); }
    if (costUSD !== undefined) { updateFields.push('"costUSD"'); updateValues.push(parseFloat(costUSD)); }
    if (margin !== undefined) { updateFields.push('margin'); updateValues.push(parseFloat(margin)); }
    if (commissionRate !== undefined) { updateFields.push('"commissionRate"'); updateValues.push(parseFloat(commissionRate)); }

    const updateSetClause = updateFields.map((f, i) => '"' + f + '" = $' + (i + 1)).join(', ');

    const result = await db.query(
      'UPDATE "Product" SET ' + updateSetClause + ' WHERE id = $1 RETURNING *',
      updateValues.concat([id])
    );

    console.log('[update-product] Product updated:', result.rows[0]);

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Product update error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.delete('/api/products/:id', authenticateToken, async (req: Request, res: Response, next: any) => {
  const requestingUser = (req as any).user;
  const { id } = req.params;

  if (requestingUser.role !== 'Manager' && requestingUser.role !== 'Director') {
    return res.status(403).json({ message: 'Only Managers and Directors can delete products.' });
  }

  try {
    const existingProduct = await db.query('SELECT * FROM "Product" WHERE id = $1', [id]);
    if (existingProduct.rows.length === 0) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    const assignedCheck = await db.query(
      'SELECT COUNT(*) FROM "InventoryItem" WHERE "productId" = $1',
      [id]
    );
    const isAssigned = parseInt(assignedCheck.rows[0].count) > 0;

    if (isAssigned) {
      return res.status(400).json({ message: 'El producto no puede ser editado ni eliminado porque se encuentra asignado a un gestor.' });
    }

    await db.query('DELETE FROM "Product" WHERE id = $1', [id]);

    const deletedProduct = await db.query('SELECT * FROM "Product" WHERE id = $1', [id]);
    
    if (deletedProduct.rows.length > 0) {
      console.log('[delete-product] Returning deleted product:', deletedProduct.rows[0]);
      res.json(deletedProduct.rows[0]);
    } else {
      console.log('[delete-product] Product not found in database');
      res.status(404).json({ message: 'Product not found.' });
    }
  } catch (error) {
    console.error('Product deletion error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

app.get('/api/inventory', authenticateToken, async (req: Request, res: Response, next: any) => {
  try {
    const result = await db.query('SELECT * FROM "Product"');
    res.json(result.rows);
  } catch (error) {
    console.error('Inventory fetch error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});
