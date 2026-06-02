import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireSuperAdmin } from '../../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/admin/roles/users
 * Get all users with their currently active roles.
 * Requires super_admin role.
 */
router.get('/admin/roles/users', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      select: {
        id: true,
        email: true,
        userType: true,
        artistName: true,
        role: true,
        userRoles: {
          where: { revokedAt: null },
          select: {
            id: true,
            role: true,
            grantedBy: true,
            grantedAt: true,
          }
        }
      },
      orderBy: { email: 'asc' }
    });

    res.json({ success: true, users });
  } catch (error) {
    console.error('Get roles users error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch users' });
  }
});

/**
 * GET /api/admin/roles/me
 * Get current user's roles.
 * Requires authentication.
 */
router.get('/admin/roles/me', authenticateToken, async (req, res) => {
  try {
    const roles = await prisma.userRole.findMany({
      where: {
        userId: req.user.id,
        revokedAt: null
      },
      select: {
        id: true,
        role: true,
        grantedBy: true,
        grantedAt: true,
      }
    });

    res.json({ success: true, roles });
  } catch (error) {
    console.error('Get my roles error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch roles' });
  }
});

/**
 * POST /api/admin/roles/assign
 * Assign a role to a user.
 * Requires super_admin role.
 */
router.post('/admin/roles/assign', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { userId, role } = req.body;
    const adminId = req.user.id;
    const adminEmail = req.user.email;

    if (!userId || !role) {
      return res.status(400).json({ success: false, error: 'userId and role are required' });
    }

    const validRoles = [
      'super_admin',
      'moderator',
      'verification_admin',
      'finance_admin',
      'support_admin'
    ];

    if (!validRoles.includes(role)) {
      return res.status(400).json({
        success: false,
        error: `Invalid role. Must be one of: ${validRoles.join(', ')}`
      });
    }

    // Check if role already assigned and not revoked
    const existingRole = await prisma.userRole.findFirst({
      where: { userId, role, revokedAt: null }
    });

    if (existingRole) {
      return res.status(400).json({ success: false, error: 'User already has this role' });
    }

    // Verify the target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true }
    });

    if (!targetUser) {
      return res.status(404).json({ success: false, error: 'User not found' });
    }

    const userRole = await prisma.userRole.create({
      data: {
        userId,
        role,
        grantedBy: adminEmail
      }
    });

    // Log the action (if AdminAuditLog model doesn't exist, skip gracefully)
    try {
      await prisma.adminAuditLog.create({
        data: {
          adminId,
          adminEmail,
          action: 'ASSIGN_ROLE',
          targetType: 'user',
          targetId: userId,
          details: { role, targetEmail: targetUser.email }
        }
      });
    } catch {
      // AdminAuditLog model may not exist yet - non-critical
    }

    res.status(201).json({ success: true, userRole });
  } catch (error) {
    console.error('Assign role error:', error);
    res.status(500).json({ success: false, error: 'Failed to assign role' });
  }
});

/**
 * DELETE /api/admin/roles/revoke
 * Revoke a role from a user.
 * Requires super_admin role.
 */
router.delete('/admin/roles/revoke', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { userId, role } = req.body;
    const adminId = req.user.id;
    const adminEmail = req.user.email;

    if (!userId || !role) {
      return res.status(400).json({ success: false, error: 'userId and role are required' });
    }

    // Prevent revoking the last super_admin
    if (role === 'super_admin') {
      const superAdminCount = await prisma.userRole.count({
        where: { role: 'super_admin', revokedAt: null }
      });
      if (superAdminCount <= 1) {
        return res.status(400).json({
          success: false,
          error: 'Cannot revoke the last remaining super_admin'
        });
      }
    }

    const result = await prisma.userRole.updateMany({
      where: { userId, role, revokedAt: null },
      data: { revokedAt: new Date() }
    });

    if (result.count === 0) {
      return res.status(404).json({ success: false, error: 'Active role not found for this user' });
    }

    // Log the action
    try {
      await prisma.adminAuditLog.create({
        data: {
          adminId,
          adminEmail,
          action: 'REVOKE_ROLE',
          targetType: 'user',
          targetId: userId,
          details: { role }
        }
      });
    } catch {
      // AdminAuditLog model may not exist yet - non-critical
    }

    res.json({ success: true, revoked: result.count });
  } catch (error) {
    console.error('Revoke role error:', error);
    res.status(500).json({ success: false, error: 'Failed to revoke role' });
  }
});

/**
 * GET /api/admin/roles
 * List all available roles with descriptions.
 * Requires authentication.
 */
router.get('/admin/roles', authenticateToken, async (req, res) => {
  const allRoles = [
    { role: 'super_admin', description: 'Full system access, can manage all roles' },
    { role: 'moderator', description: 'Content moderation, can approve/reject posts and comments' },
    { role: 'verification_admin', description: 'Creator verification management' },
    { role: 'finance_admin', description: 'Financial operations, payouts, revenue management' },
    { role: 'support_admin', description: 'User support, dispute resolution' },
  ];

  res.json({ success: true, roles: allRoles });
});

export default router;