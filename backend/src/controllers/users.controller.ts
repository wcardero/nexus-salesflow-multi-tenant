import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import db from '../db';
import { AuthenticatedRequest, isAdmin, isDirector, isManager } from '../middleware/auth.middleware';
import { validateUserUpdate, validatePasswordChange } from '../validators/auth.validator';
import { validationResult } from 'express-validator';
import {
  createAuditLog,
  auditUserUpdate,
  auditUserDeletion,
  auditPasswordChange,
} from '../utils/audit.utils';

// ============================================================================
// GET Users Controller
// ============================================================================

export const getUsers = async (req: Request, res: Response) => {
  const requestingUser = (req as AuthenticatedRequest).user;

  try {
    // Only admins can see all users
    if (requestingUser?.role === 'Admin') {
      const { rows } = await db.query('SELECT id, name, role, "storeId", "createdBy" FROM "User"');
      return res.json(rows);
    }

    // For Directors and Managers, get their store ID from _StoreToUser if not in User
    let storeIdToUse = requestingUser?.storeId;
    if (!storeIdToUse) {
      const storeResult = await db.query(
        'SELECT "A" as storeId FROM "_StoreToUser" WHERE "B" = $1 LIMIT 1',
        [requestingUser?.id]
      );
      if (storeResult.rows.length > 0) {
        storeIdToUse = storeResult.rows[0].storeId;
      }
    }

    // Directors can see managers from their store
    if (requestingUser?.role === 'Director') {
      if (!storeIdToUse) {
        return res.status(400).json({ message: 'You must be assigned to a store.' });
      }
      const { rows } = await db.query(
        'SELECT id, name, role, "storeId", "createdBy" FROM "User" WHERE role = $1 AND "storeId" = $2',
        ['Manager', storeIdToUse]
      );
      return res.json(rows);
    }

    // Managers can see gestors from their store
    if (requestingUser?.role === 'Manager') {
      if (!storeIdToUse) {
        return res.status(400).json({ message: 'You must be assigned to a store.' });
      }
      const { rows } = await db.query(
        'SELECT id, name, role, "storeId", "createdBy" FROM "User" WHERE role = $1 AND "storeId" = $2',
        ['Gestor', storeIdToUse]
      );
      return res.json(rows);
    }

    // Gestors can see only themselves
    const { rows } = await db.query(
      'SELECT id, name, role, "storeId", "createdBy" FROM "User" WHERE id = $1',
      [requestingUser?.id]
    );
    res.json(rows);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// ============================================================================
// PUT User Controller
// ============================================================================

export const updateUser = [
  validateUserUpdate,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params as { id: string };
    const { name, role, storeId } = req.body;
    const requestingUser = (req as AuthenticatedRequest).user;

    // Admins can update any user
    if (requestingUser?.role !== 'Admin') {
      // Managers can only update gestors
      if (requestingUser?.role === 'Manager') {
        const targetUser = await db.query('SELECT * FROM "User" WHERE id = $1', [id]);
        if (targetUser.rows.length === 0) {
          return res.status(404).json({ message: 'User not found.' });
        }
        const userToUpdate = targetUser.rows[0];

        if (userToUpdate.role !== 'Gestor') {
          return res.status(403).json({ message: 'Managers can only update gestors.' });
        }

        if (role || storeId) {
          return res.status(403).json({ message: 'Managers cannot change role or storeId.' });
        }

        if (userToUpdate.storeId !== requestingUser.storeId) {
          return res.status(403).json({ message: 'Gestor does not belong to your store.' });
        }

        if (!name) {
          return res.status(400).json({ message: 'Name is required.' });
        }

        await db.query('UPDATE "User" SET name = $1 WHERE id = $2', [name.trim(), id]);
        res.status(200).json({ message: 'Gestor updated successfully.' });
        return;
      }

      // Directors can only update managers from their store
      if (requestingUser?.role === 'Director') {
        const targetUser = await db.query('SELECT * FROM "User" WHERE id = $1', [id]);
        if (targetUser.rows.length === 0) {
          return res.status(404).json({ message: 'User not found.' });
        }
        const userToUpdate = targetUser.rows[0];

        if (userToUpdate.role !== 'Manager') {
          return res.status(403).json({ message: 'Directors can only update managers.' });
        }

        if (role && role !== userToUpdate.role) {
          return res.status(403).json({ message: 'Directors cannot change role.' });
        }

        if (storeId && storeId !== userToUpdate.storeId) {
          return res.status(403).json({ message: 'Directors cannot change storeId.' });
        }

        if (userToUpdate.storeId !== requestingUser.storeId) {
          return res.status(403).json({ message: 'Manager does not belong to your store.' });
        }

        if (!name) {
          return res.status(400).json({ message: 'Name is required.' });
        }

        await db.query('UPDATE "User" SET name = $1 WHERE id = $2', [name.trim(), id]);
        res.status(200).json({ message: 'Manager updated successfully.' });
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

      // Build update query dynamically
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

      // Audit log
      await auditUserUpdate(
        requestingUser.id,
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
  },
];

// ============================================================================
// PUT Password Controller
// ============================================================================

export const changePassword = [
  validatePasswordChange,
  async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ message: 'Validation failed', errors: errors.array() });
    }

    const { id } = req.params as { id: string };
    const { oldPassword, password, newPassword } = req.body;
    const requestingUser = (req as AuthenticatedRequest).user;

    const targetPassword = newPassword || password;

    if (!targetPassword) {
      return res.status(400).json({ message: 'New password is required.' });
    }

    // Only allow users to change their own password or admins/directors to change managers' passwords
    const isSelf = requestingUser?.id === id;
    const isAdminUser = isAdmin(requestingUser?.role || '');
    const isDirectorUser = isDirector(requestingUser?.role || '');

    if (!isSelf && !isAdminUser) {
      if (isDirectorUser) {
        const targetUser = await db.query('SELECT * FROM "User" WHERE id = $1', [id]);
        if (targetUser.rows.length === 0) {
          return res.status(404).json({ message: 'User not found.' });
        }
        const user = targetUser.rows[0];
        if (user.role !== 'Manager' || user.storeId !== requestingUser?.storeId) {
          return res.status(403).json({ message: 'Access denied. Directors can only change managers\' passwords from their store.' });
        }
      } else {
        return res.status(403).json({ message: 'Access denied. You can only change your own password.' });
      }
    }

    try {
      const result = await db.query('SELECT * FROM "User" WHERE id = $1', [id]);
      if (result.rows.length === 0) {
        return res.status(404).json({ message: 'User not found.' });
      }
      const user = result.rows[0];

      // For user changing their own password, verify old password
      if (isSelf) {
        if (!oldPassword) {
          return res.status(400).json({ message: 'Old password is required when changing your own password.' });
        }
        const passwordMatch = await bcrypt.compare(oldPassword, user.password);
        if (!passwordMatch) {
          return res.status(400).json({ message: 'Invalid old password.' });
        }
      }

      const hashedNewPassword = await bcrypt.hash(targetPassword, 10);
      await db.query('UPDATE "User" SET password = $1 WHERE id = $2', [hashedNewPassword, id]);

      // Audit log
      await auditPasswordChange(requestingUser?.id || '', id);

      res.status(200).json({ message: 'Password updated successfully.' });
    } catch (error) {
      console.error('Password update error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  },
];

// ============================================================================
// DELETE User Controller
// ============================================================================

export const deleteUser = async (req: Request, res: Response) => {
  const { id } = req.params as { id: string };
  const requestingUser = (req as AuthenticatedRequest).user;

  if (requestingUser?.role !== 'Admin') {
    if (requestingUser?.role === 'Director') {
      const targetUser = await db.query('SELECT * FROM "User" WHERE id = $1', [id]);
      if (targetUser.rows.length === 0) {
        return res.status(404).json({ message: 'User not found.' });
      }
      const userToDelete = targetUser.rows[0];

      if (userToDelete.role !== 'Manager') {
        return res.status(403).json({ message: 'Directors can only delete managers.' });
      }

      if (userToDelete.storeId !== requestingUser.storeId) {
        return res.status(403).json({ message: 'Manager does not belong to your store.' });
      }

      // Check if manager has assigned inventory
      const assignedInventoryCheck = await db.query(
        'SELECT COUNT(*) FROM "AssignedInventory" WHERE "productId" IN (SELECT id FROM "Product" WHERE "storeId" = $1)',
        [requestingUser.storeId]
      );
      const hasAssignedInventory = parseInt(assignedInventoryCheck.rows[0].count) > 0;

      if (hasAssignedInventory) {
        return res.status(400).json({ message: 'No puedes eliminar este manager porque tiene inventario asignado a gestores.' });
      }

      // Check if manager has gestors
      const gestorsCheck = await db.query(
        'SELECT COUNT(*) FROM "User" WHERE role = $1 AND "storeId" = $2 AND "createdBy" = $3',
        ['Gestor', requestingUser.storeId, id]
      );
      const hasGestors = parseInt(gestorsCheck.rows[0].count) > 0;

      if (hasGestors) {
        // Delete gestors first
        await db.query(
          'DELETE FROM "User" WHERE role = $1 AND "storeId" = $2 AND "createdBy" = $3',
          ['Gestor', requestingUser.storeId, id]
        );
      }
    } else {
      return res.status(403).json({ message: 'Access denied. Only admins can delete users.' });
    }
  }

  // Prevent admin from deleting themselves
  if (id === requestingUser?.id) {
    return res.status(400).json({ message: 'Cannot delete your own account.' });
  }

  try {
    // Get user info before deletion for audit log
    const userResult = await db.query('SELECT * FROM "User" WHERE id = $1', [id]);
    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }
    const user = userResult.rows[0];

    // Delete audit logs
    await db.query('DELETE FROM "AuditLog" WHERE "userId" = $1', [id]);

    // Delete inventory items
    await db.query('DELETE FROM "InventoryItem" WHERE "gestorId" = $1', [id]);

    // Delete _StoreToUser relations
    await db.query('DELETE FROM "_StoreToUser" WHERE "B" = $1', [id]);

    // Delete the user
    const result = await db.query('DELETE FROM "User" WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Audit log
    await auditUserDeletion(requestingUser?.id || '', id, user);

    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (error) {
    console.error('User deletion error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};
