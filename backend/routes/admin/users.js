import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';
import { createAuditLog } from '../../services/auditLog.js';

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/admin/users/:userId/revoke-sessions
// Admin forced logout - revokes all sessions and refresh tokens for a user
router.post('/:userId/revoke-sessions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, userType: true }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Delete all sessions for this user
    const deletedSessions = await prisma.session.deleteMany({
      where: { userId }
    });

    // Revoke all refresh tokens for this user
    const revokedTokens = await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() }
    });

    // Create audit log
    await createAuditLog({
      userId: adminId,
      action: 'FORCE_LOGOUT',
      targetUserId: userId,
      details: {
        targetEmail: targetUser.email,
        sessionsRevoked: deletedSessions.count,
        tokensRevoked: revokedTokens.count,
        reason: 'Admin forced logout'
      }
    });

    res.json({
      success: true,
      message: `User ${targetUser.email} has been logged out from all devices`,
      sessionsRevoked: deletedSessions.count,
      tokensRevoked: revokedTokens.count
    });
  } catch (error) {
    console.error('Admin forced logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/admin/users/:userId/role
// Admin updates user role (with audit logging)
router.put('/:userId/role', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { newRole } = req.body;
    const adminId = req.user.id;

    if (!newRole) {
      return res.status(400).json({ error: 'newRole is required' });
    }

    // Get current user details
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, userType: true, role: true }
    });

    if (!targetUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    const oldRole = targetUser.role || targetUser.userType;

    // Update the user's role
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { role: newRole, userType: newRole },
      select: { id: true, email: true, role: true, userType: true }
    });

    // Create audit log entry
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'ROLE_CHANGE',
        targetType: 'user',
        targetId: userId,
        details: {
          targetEmail: targetUser.email,
          oldRole,
          newRole,
          changedBy: adminId,
          timestamp: new Date().toISOString()
        }
      }
    });

    res.json({
      success: true,
      message: `User role updated from ${oldRole} to ${newRole}`,
      user: updatedUser
    });
  } catch (error) {
    console.error('Role update error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
