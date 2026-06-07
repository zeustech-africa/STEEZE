import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Helper: Check if user is temporarily banned
async function isUserTempBanned(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { temporaryBanUntil: true }
  });
  
  if (user?.temporaryBanUntil && new Date(user.temporaryBanUntil) > new Date()) {
    return { isBanned: true, expiresAt: user.temporaryBanUntil };
  }
  return { isBanned: false, expiresAt: null };
}

// Helper: Send notification to user
async function notifyUser(userId, title, message, type) {
  await prisma.notification.create({
    data: {
      userId,
      type: type || 'user_management',
      title,
      message,
      isRead: false
    }
  });
}

// ============ TEMPORARY BAN ============

// POST /api/admin/users/:userId/temp-ban - Apply temporary ban (default 24 hours)
router.post('/:userId/temp-ban', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { durationHours = 24, reason } = req.body;
    const adminId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, isBanned: true }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (user.isBanned) {
      return res.status(400).json({ success: false, message: 'User is already permanently banned' });
    }
    
    const banUntil = new Date();
    banUntil.setHours(banUntil.getHours() + durationHours);
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        temporaryBanUntil: banUntil,
        temporaryBanReason: reason || 'Temporary ban applied by admin',
        isSuspended: true,
        suspendedUntil: banUntil
      }
    });
    
    // Send notification
    await notifyUser(
      userId,
      'Account Temporarily Banned',
      `Your account has been temporarily banned for ${durationHours} hours. Reason: ${reason || 'Violation of community guidelines'}. Ban expires on ${banUntil.toLocaleString()}.`,
      'temp_ban'
    );
    
    // Log audit
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'temporary_ban',
        targetType: 'user',
        targetId: userId,
        details: { durationHours, reason, expiresAt: banUntil }
      }
    });
    
    res.json({
      success: true,
      message: `User temporarily banned for ${durationHours} hours`,
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        temporaryBanUntil: updatedUser.temporaryBanUntil,
        temporaryBanReason: updatedUser.temporaryBanReason
      }
    });
  } catch (error) {
    console.error('Temporary ban error:', error);
    res.status(500).json({ success: false, message: 'Failed to apply temporary ban' });
  }
});

// DELETE /api/admin/users/:userId/temp-ban - Remove temporary ban
router.delete('/:userId/temp-ban', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, temporaryBanUntil: true }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (!user.temporaryBanUntil) {
      return res.status(400).json({ success: false, message: 'User is not temporarily banned' });
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        temporaryBanUntil: null,
        temporaryBanReason: null,
        isSuspended: false,
        suspendedUntil: null
      }
    });
    
    await notifyUser(
      userId,
      'Temporary Ban Removed',
      'Your account has been restored. The temporary ban has been lifted.',
      'temp_ban_removed'
    );
    
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'remove_temporary_ban',
        targetType: 'user',
        targetId: userId,
        details: { previouslyBannedUntil: user.temporaryBanUntil }
      }
    });
    
    res.json({
      success: true,
      message: 'Temporary ban removed',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        temporaryBanUntil: updatedUser.temporaryBanUntil
      }
    });
  } catch (error) {
    console.error('Remove temporary ban error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove temporary ban' });
  }
});

// ============ SOFT LOCK ============

// POST /api/admin/users/:userId/soft-lock - Apply soft lock
router.post('/:userId/soft-lock', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        softLocked: true,
        softLockReason: reason || 'Soft lock applied by admin'
      }
    });
    
    await notifyUser(
      userId,
      'Account Soft Locked',
      `Your account has been soft locked. Some actions are restricted. Reason: ${reason || 'Administrative review'}. Please contact support for more information.`,
      'soft_lock'
    );
    
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'soft_lock',
        targetType: 'user',
        targetId: userId,
        details: { reason }
      }
    });
    
    res.json({
      success: true,
      message: 'Soft lock applied',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        softLocked: updatedUser.softLocked,
        softLockReason: updatedUser.softLockReason
      }
    });
  } catch (error) {
    console.error('Soft lock error:', error);
    res.status(500).json({ success: false, message: 'Failed to apply soft lock' });
  }
});

// DELETE /api/admin/users/:userId/soft-lock - Remove soft lock
router.delete('/:userId/soft-lock', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const adminId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, softLocked: true }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (!user.softLocked) {
      return res.status(400).json({ success: false, message: 'User is not soft locked' });
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        softLocked: false,
        softLockReason: null
      }
    });
    
    await notifyUser(
      userId,
      'Soft Lock Removed',
      'Your account restrictions have been lifted. Full access restored.',
      'soft_lock_removed'
    );
    
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'remove_soft_lock',
        targetType: 'user',
        targetId: userId,
        details: {}
      }
    });
    
    res.json({
      success: true,
      message: 'Soft lock removed',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        softLocked: updatedUser.softLocked
      }
    });
  } catch (error) {
    console.error('Remove soft lock error:', error);
    res.status(500).json({ success: false, message: 'Failed to remove soft lock' });
  }
});

// ============ ACCOUNT FREEZE ============

// POST /api/admin/users/:userId/freeze - Freeze account for investigation
router.post('/:userId/freeze', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        accountFrozen: true,
        accountFrozenReason: reason || 'Account frozen for investigation',
        isSuspended: true
      }
    });
    
    await notifyUser(
      userId,
      'Account Frozen',
      `Your account has been frozen pending investigation. Reason: ${reason || 'Administrative review'}. During this time, you cannot access your account. Please contact support for more information.`,
      'account_frozen'
    );
    
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'freeze_account',
        targetType: 'user',
        targetId: userId,
        details: { reason }
      }
    });
    
    res.json({
      success: true,
      message: 'Account frozen for investigation',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        accountFrozen: updatedUser.accountFrozen,
        accountFrozenReason: updatedUser.accountFrozenReason
      }
    });
  } catch (error) {
    console.error('Freeze account error:', error);
    res.status(500).json({ success: false, message: 'Failed to freeze account' });
  }
});

// DELETE /api/admin/users/:userId/freeze - Unfreeze account
router.delete('/:userId/freeze', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { resolution } = req.body;
    const adminId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, accountFrozen: true }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    if (!user.accountFrozen) {
      return res.status(400).json({ success: false, message: 'Account is not frozen' });
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        accountFrozen: false,
        accountFrozenReason: null,
        isSuspended: false,
        suspendedUntil: null
      }
    });
    
    await notifyUser(
      userId,
      'Account Unfrozen',
      `Your account has been unfrozen. Resolution: ${resolution || 'Investigation complete'}. You can now access your account normally.`,
      'account_unfrozen'
    );
    
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'unfreeze_account',
        targetType: 'user',
        targetId: userId,
        details: { resolution }
      }
    });
    
    res.json({
      success: true,
      message: 'Account unfrozen',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        accountFrozen: updatedUser.accountFrozen
      }
    });
  } catch (error) {
    console.error('Unfreeze account error:', error);
    res.status(500).json({ success: false, message: 'Failed to unfreeze account' });
  }
});

// GET /api/admin/users/:userId/status - Get user's current restriction status
router.get('/:userId/status', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        isBanned: true,
        temporaryBanUntil: true,
        temporaryBanReason: true,
        softLocked: true,
        softLockReason: true,
        accountFrozen: true,
        accountFrozenReason: true,
        isSuspended: true,
        suspendedUntil: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const tempBanActive = user.temporaryBanUntil && new Date(user.temporaryBanUntil) > new Date();
    
    res.json({
      success: true,
      status: {
        userId: user.id,
        email: user.email,
        isPermanentlyBanned: user.isBanned,
        isTemporarilyBanned: tempBanActive,
        temporaryBanUntil: user.temporaryBanUntil,
        temporaryBanReason: user.temporaryBanReason,
        isSoftLocked: user.softLocked,
        softLockReason: user.softLockReason,
        isAccountFrozen: user.accountFrozen,
        accountFrozenReason: user.accountFrozenReason,
        isSuspended: user.isSuspended,
        suspendedUntil: user.suspendedUntil
      }
    });
  } catch (error) {
    console.error('Get user status error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user status' });
  }
});

// ============ VIP STATUS ============

// POST /api/admin/users/:userId/vip - Toggle VIP status
router.post('/:userId/vip', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { vipStatus, expiresAt, reason } = req.body;
    const adminId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, vipStatus: true }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        vipStatus: vipStatus !== undefined ? vipStatus : !user.vipStatus,
        vipExpiresAt: expiresAt ? new Date(expiresAt) : null,
        vipApprovedBy: adminId,
        vipApprovedAt: new Date()
      }
    });
    
    // Send notification
    if (updatedUser.vipStatus && !user.vipStatus) {
      await prisma.notification.create({
        data: {
          userId,
          type: 'vip_status',
          title: 'VIP Status Granted',
          message: `Congratulations! You have been granted VIP status. ${reason || 'Enjoy exclusive perks and priority support.'}`,
          isRead: false
        }
      });
    } else if (!updatedUser.vipStatus && user.vipStatus) {
      await prisma.notification.create({
        data: {
          userId,
          type: 'vip_status',
          title: 'VIP Status Removed',
          message: `Your VIP status has been removed. ${reason || 'Please contact support for more information.'}`,
          isRead: false
        }
      });
    }
    
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'update_vip_status',
        targetType: 'user',
        targetId: userId,
        details: { newStatus: updatedUser.vipStatus, expiresAt, reason }
      }
    });
    
    res.json({
      success: true,
      message: updatedUser.vipStatus ? 'VIP status granted' : 'VIP status removed',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        vipStatus: updatedUser.vipStatus,
        vipExpiresAt: updatedUser.vipExpiresAt
      }
    });
  } catch (error) {
    console.error('Update VIP status error:', error);
    res.status(500).json({ success: false, message: 'Failed to update VIP status' });
  }
});

// ============ MONETIZATION STATUS ============

// POST /api/admin/users/:userId/monetization/approve - Approve monetization
router.post('/:userId/monetization/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, monetizationStatus: true }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        monetizationStatus: 'approved',
        monetizationApprovedAt: new Date(),
        monetizationApprovedBy: adminId,
        monetizationSuspendedAt: null,
        monetizationSuspendedBy: null,
        monetizationSuspendedReason: null,
        monetizationRevokedAt: null,
        monetizationRevokedBy: null,
        monetizationRevokedReason: null
      }
    });
    
    await prisma.notification.create({
      data: {
        userId,
        type: 'monetization',
        title: 'Monetization Approved',
        message: `Congratulations! Your monetization request has been approved. ${reason || 'You can now earn revenue from your content.'}`,
        isRead: false
      }
    });
    
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'approve_monetization',
        targetType: 'user',
        targetId: userId,
        details: { reason }
      }
    });
    
    res.json({
      success: true,
      message: 'Monetization approved',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        monetizationStatus: updatedUser.monetizationStatus,
        monetizationApprovedAt: updatedUser.monetizationApprovedAt
      }
    });
  } catch (error) {
    console.error('Approve monetization error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve monetization' });
  }
});

// POST /api/admin/users/:userId/monetization/suspend - Suspend monetization
router.post('/:userId/monetization/suspend', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, monetizationStatus: true }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        monetizationStatus: 'suspended',
        monetizationSuspendedAt: new Date(),
        monetizationSuspendedBy: adminId,
        monetizationSuspendedReason: reason || 'Violation of monetization policies'
      }
    });
    
    await prisma.notification.create({
      data: {
        userId,
        type: 'monetization',
        title: 'Monetization Suspended',
        message: `Your monetization privileges have been suspended. Reason: ${reason || 'Violation of monetization policies'}. Please contact support for more information.`,
        isRead: false
      }
    });
    
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'suspend_monetization',
        targetType: 'user',
        targetId: userId,
        details: { reason }
      }
    });
    
    res.json({
      success: true,
      message: 'Monetization suspended',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        monetizationStatus: updatedUser.monetizationStatus,
        monetizationSuspendedReason: updatedUser.monetizationSuspendedReason
      }
    });
  } catch (error) {
    console.error('Suspend monetization error:', error);
    res.status(500).json({ success: false, message: 'Failed to suspend monetization' });
  }
});

// POST /api/admin/users/:userId/monetization/revoke - Permanently revoke monetization
router.post('/:userId/monetization/revoke', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, monetizationStatus: true }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: {
        monetizationStatus: 'revoked',
        monetizationRevokedAt: new Date(),
        monetizationRevokedBy: adminId,
        monetizationRevokedReason: reason || 'Permanent revocation of monetization privileges'
      }
    });
    
    await prisma.notification.create({
      data: {
        userId,
        type: 'monetization',
        title: 'Monetization Revoked',
        message: `Your monetization privileges have been permanently revoked. Reason: ${reason || 'Permanent revocation'}. This decision is final.`,
        isRead: false
      }
    });
    
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'revoke_monetization',
        targetType: 'user',
        targetId: userId,
        details: { reason }
      }
    });
    
    res.json({
      success: true,
      message: 'Monetization permanently revoked',
      user: {
        id: updatedUser.id,
        email: updatedUser.email,
        monetizationStatus: updatedUser.monetizationStatus,
        monetizationRevokedReason: updatedUser.monetizationRevokedReason
      }
    });
  } catch (error) {
    console.error('Revoke monetization error:', error);
    res.status(500).json({ success: false, message: 'Failed to revoke monetization' });
  }
});

// GET /api/admin/users/:userId/monetization - Get monetization status
router.get('/:userId/monetization', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        monetizationStatus: true,
        monetizationApprovedAt: true,
        monetizationApprovedBy: true,
        monetizationSuspendedAt: true,
        monetizationSuspendedBy: true,
        monetizationSuspendedReason: true,
        monetizationRevokedAt: true,
        monetizationRevokedBy: true,
        monetizationRevokedReason: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    res.json({ success: true, monetization: user });
  } catch (error) {
    console.error('Get monetization status error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch monetization status' });
  }
});

export default router;
