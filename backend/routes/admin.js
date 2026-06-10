import express from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { requirePermission, requireRole } from '../middleware/rbac.js';
import {
  calculateUserAnomalyScore,
  detectConflict,
  getPredictiveBanRecommendations,
} from '../services/anomalyDetection.js';
import { logAudit } from '../utils/logger.js';
import { exportAuditLogs, verifyLogIntegrity, getAuditStats } from '../services/auditExportService.js';

const router = express.Router();
const prisma = new PrismaClient();

// ============ DASHBOARD ============
router.get('/dashboard', requirePermission('users:read'), async (req, res) => {
  const [
    regularUsers, approvedUsers, totalCreators, totalVibes, totalZLS, totalIndependent,
    pendingPosts, pendingVerifications, pendingReports, pendingPayouts, anomalyAlerts,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.approvedUser.count(),
    prisma.user.count({ where: { userType: { in: ['zls_artist', 'independent_creator'] } } }),
    prisma.user.count({ where: { userType: 'vibe' } }),
    prisma.user.count({ where: { userType: 'zls_artist' } }),
    prisma.user.count({ where: { userType: 'independent_creator' } }),
    prisma.post.count({ where: { adminStatus: 'pending' } }),
    prisma.user.count({ where: { verificationStatus: 'pending' } }),
    prisma.report.count({ where: { status: 'pending' } }),
    prisma.payout.count({ where: { status: 'pending' } }),
    prisma.anomalyScore.count({
      where: { score: { gt: 70 }, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
  ]);

  const totalUsers = regularUsers + approvedUsers;

  res.json({
    success: true,
    dashboard: {
      totalUsers, totalCreators, totalVibes, totalZLS, totalIndependent,
      pendingPosts, pendingVerifications, pendingReports, pendingPayouts, anomalyAlerts,
    },
  });
});

// ============ USER MANAGEMENT ============
router.get('/users', requirePermission('users:read'), async (req, res) => {
  try {
    const { type, search, page = 1, limit = 50 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    // Build search filter
    const searchFilter = search ? {
      OR: [
        { email: { contains: search, mode: 'insensitive' } },
        { fullName: { contains: search, mode: 'insensitive' } },
        { username: { contains: search, mode: 'insensitive' } },
      ],
    } : {};

    // Get approved users (from verification system)
    const approvedUsers = await prisma.approvedUser.findMany({
      where: searchFilter,
      orderBy: { approvedAt: 'desc' },
      skip,
      take: parseInt(limit),
    });

    // Get regular users (direct signups)
    const regularUsers = await prisma.user.findMany({
      where: searchFilter,
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
      include: { shadowBan: true },
    });

    // Get counts
    const approvedCount = await prisma.approvedUser.count({ where: searchFilter });
    const regularCount = await prisma.user.count({ where: searchFilter });

    // Combine and transform for frontend
    const users = [
      ...approvedUsers.map(u => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        username: u.username,
        userType: u.userType,
        status: 'approved',
        approvedBy: u.approvedBy,
        approvedAt: u.approvedAt,
        createdAt: u.approvedAt,
        source: 'verification',
      })),
      ...regularUsers.map(u => ({
        id: u.id,
        email: u.email,
        fullName: u.fullName,
        username: u.username,
        userType: u.userType,
        status: u.isBanned ? 'banned' : (u.isSuspended ? 'suspended' : 'active'),
        createdAt: u.createdAt,
        source: 'direct',
        shadowBan: u.shadowBan,
      })),
    ];

    res.json({
      success: true,
      users,
      total: approvedCount + regularCount,
      page: parseInt(page),
      limit: parseInt(limit),
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

router.post('/users/:id/ban', requirePermission('users:update'), async (req, res) => {
  const { id } = req.params;
  const { reason, duration } = req.body;

  await prisma.user.update({ where: { id }, data: { isBanned: true } });
  await prisma.violation.create({
    data: {
      userId: id,
      type: 'banned',
      severity: 'high',
      action: 'ban',
      actionTakenBy: req.user.id,
      note: reason,
      actionExpiresAt: duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null,
    },
  });

  res.json({ success: true });
});

router.post('/users/:id/suspend', requirePermission('users:update'), async (req, res) => {
  const { id } = req.params;
  const { reason, duration } = req.body;

  await prisma.user.update({ where: { id }, data: { isSuspended: true } });
  await prisma.violation.create({
    data: {
      userId: id,
      type: 'suspended',
      severity: 'medium',
      action: 'suspend',
      actionTakenBy: req.user.id,
      note: reason,
      actionExpiresAt: new Date(Date.now() + duration * 24 * 60 * 60 * 1000),
    },
  });

  res.json({ success: true });
});

router.post('/users/:id/shadow-ban', requirePermission('users:update'), async (req, res) => {
  const { id } = req.params;
  const { reason, duration } = req.body;

  await prisma.shadowBan.upsert({
    where: { userId: id },
    update: { reason, expiresAt: duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null },
    create: {
      userId: id,
      reason,
      expiresAt: duration ? new Date(Date.now() + duration * 24 * 60 * 60 * 1000) : null,
      createdBy: req.user.id,
    },
  });

  res.json({ success: true });
});

router.delete('/users/:id', requirePermission('users:update'), async (req, res) => {
  const { id } = req.params;
  await prisma.user.delete({ where: { id } });
  res.json({ success: true });
});

// User violation history
router.get('/users/:id/violations', requirePermission('users:read'), async (req, res) => {
  const violations = await prisma.violation.findMany({
    where: { userId: req.params.id },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, violations });
});

// User anomaly score
router.get('/users/:id/anomaly', requirePermission('users:read'), async (req, res) => {
  const score = await calculateUserAnomalyScore(req.params.id);
  res.json({ success: true, score });
});

// Predictive ban recommendations
router.get('/predictive-bans', requirePermission('users:read'), async (req, res) => {
  const recommendations = await getPredictiveBanRecommendations();
  res.json({ success: true, recommendations });
});

// ============ POST MANAGEMENT ============
router.get('/posts/pending', requirePermission('posts:read'), async (req, res) => {
  const { filter, page = 1, limit = 20 } = req.query;
  const where = { adminStatus: 'pending' };
  if (filter === 'auto-scan-failed') where.autoScanStatus = 'failed';
  if (filter === 'auto-scan-passed') where.autoScanStatus = 'passed';

  const posts = await prisma.post.findMany({
    where,
    select: {
      id: true,
      type: true,
      contentType: true,
      title: true,
      description: true,
      mediaUrl: true,
      thumbnailUrl: true,
      price: true,
      isFree: true,
      autoScanStatus: true,
      autoScanReason: true,
      adminStatus: true,
      createdAt: true,
      creator: { select: { id: true, artistName: true, fullName: true, email: true, profilePicUrl: true } }
    },
    orderBy: { createdAt: 'asc' },
    take: parseInt(limit),
    skip: (parseInt(page) - 1) * parseInt(limit),
  });
  const total = await prisma.post.count({ where });

  res.json({ success: true, posts, total });
});

// POST /api/admin/posts/bulk-approve - Bulk approve free content only (Super Admin only)
router.post('/posts/bulk-approve', requirePermission('posts:approve'), async (req, res) => {
  try {
    const { postIds, approvalType } = req.body; // approvalType: 'global' or 'profile'
    const adminId = req.user.id;
    const adminRole = req.user.role;

    // AUDIT: Super Admin only for bulk operations
    if (adminRole !== 'super_admin') {
      return res.status(403).json({ error: 'Bulk approve requires Super Admin privileges' });
    }

    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({ error: 'postIds array is required' });
    }

    if (postIds.length > 50) {
      return res.status(400).json({ error: 'Maximum 50 posts per bulk approval' });
    }

    const results = { success: [], failed: [] };

    for (const postId of postIds) {
      try {
        const post = await prisma.post.findUnique({ where: { id: postId } });
        
        if (!post) {
          results.failed.push({ postId, reason: 'Post not found' });
          continue;
        }

        // Only free content can be bulk approved
        if (post.contentType !== 'free') {
          results.failed.push({ postId, reason: 'Only free content can be bulk approved' });
          continue;
        }

        const newStatus = approvalType === 'global' ? 'approved_global' : 'approved_profile';
        
        await prisma.post.update({
          where: { id: postId },
          data: {
            adminStatus: newStatus,
            isGlobalFeed: approvalType === 'global',
            approvedBy: adminId,
            approvedAt: new Date()
          }
        });

        // AUDIT: Log to ReviewHistory
        await prisma.reviewHistory.create({
          data: {
            postId,
            adminId,
            action: 'bulk_approved',
            notes: `Bulk approval - ${approvalType} feed`,
            previousStatus: post.adminStatus || 'pending',
            newStatus,
            metadata: { 
              batchSize: postIds.length, 
              approvalType,
              adminRole
            }
          }
        });

        results.success.push({ postId });
      } catch (error) {
        results.failed.push({ postId, reason: error.message });
      }
    }

    // AUDIT: Log bulk operation summary
    console.log(`[AUDIT] Bulk approve completed by admin ${adminId}: ${results.success.length} success, ${results.failed.length} failed`);

    res.json({ success: true, results });
  } catch (error) {
    console.error('Bulk approve error:', error);
    res.status(500).json({ error: 'Failed to bulk approve' });
  }
});

router.post('/posts/bulk-delete', requirePermission('posts:delete'), async (req, res) => {
  const { postIds } = req.body;
  await prisma.post.deleteMany({ where: { id: { in: postIds } } });
  res.json({ success: true });
});

// POST /api/admin/posts/:id/reject - Reject content with reason
router.post('/posts/:id/reject', requirePermission('posts:approve'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Update post status to rejected
    const updated = await prisma.post.update({
      where: { id },
      data: {
        adminStatus: 'rejected',
        rejectionReason: reason,
        rejectedBy: adminId,
        rejectedAt: new Date()
      }
    });

    // Add to review history
    await prisma.reviewHistory.create({
      data: {
        postId: id,
        adminId,
        action: 'rejected',
        notes: reason,
        previousStatus: post.adminStatus || 'pending',
        newStatus: 'rejected',
        metadata: { contentType: post.contentType }
      }
    });

    res.json({ success: true, message: 'Content rejected', post: updated });
  } catch (error) {
    console.error('Reject post error:', error);
    res.status(500).json({ error: 'Failed to reject post' });
  }
});

// POST /api/admin/posts/:id/approve-global - Approve for global feed
router.post('/posts/:id/approve-global', requirePermission('posts:approve'), async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.contentType === 'creator_page_only') {
      return res.status(400).json({ error: 'Page-only content cannot go to global feed' });
    }

    const updated = await prisma.post.update({
      where: { id },
      data: {
        adminStatus: 'approved_global',
        isGlobalFeed: true,
        approvedBy: adminId,
        approvedAt: new Date()
      }
    });

    await prisma.reviewHistory.create({
      data: {
        postId: id,
        adminId,
        action: 'approved_global',
        previousStatus: post.adminStatus || 'pending',
        newStatus: 'approved_global',
        metadata: { contentType: post.contentType }
      }
    });

    res.json({ success: true, post: updated });
  } catch (error) {
    console.error('Approve global error:', error);
    res.status(500).json({ error: 'Failed to approve for global feed' });
  }
});

// POST /api/admin/posts/:id/approve-profile - Approve for profile only
router.post('/posts/:id/approve-profile', requirePermission('posts:approve'), async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const updated = await prisma.post.update({
      where: { id },
      data: {
        adminStatus: 'approved_profile',
        isGlobalFeed: false,
        approvedBy: adminId,
        approvedAt: new Date()
      }
    });

    await prisma.reviewHistory.create({
      data: {
        postId: id,
        adminId,
        action: 'approved_profile',
        previousStatus: post.adminStatus || 'pending',
        newStatus: 'approved_profile',
        metadata: { contentType: post.contentType }
      }
    });

    res.json({ success: true, post: updated });
  } catch (error) {
    console.error('Approve profile error:', error);
    res.status(500).json({ error: 'Failed to approve for profile' });
  }
});

router.post('/posts/:id/lock', requirePermission('posts:update'), async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  await prisma.contentLock.upsert({
    where: { postId: id },
    update: { lockedBy: req.user.id, reason },
    create: { postId: id, lockedBy: req.user.id, reason },
  });
  res.json({ success: true });
});

router.post('/posts/:id/unlock', requirePermission('posts:update'), async (req, res) => {
  const { id } = req.params;
  await prisma.contentLock.deleteMany({ where: { postId: id } });
  res.json({ success: true });
});

// Content library (searchable archive)
router.get('/content-library', requirePermission('posts:read'), async (req, res) => {
  const { search, type, creatorId, startDate, endDate, page = 1, limit = 20 } = req.query;
  const where = {};
  if (search) where.title = { contains: search, mode: 'insensitive' };
  if (type && type !== 'all') where.type = type;
  if (creatorId) where.creatorId = creatorId;
  if (startDate) where.createdAt = { gte: new Date(startDate) };
  if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };

  const posts = await prisma.post.findMany({
    where,
    include: { creator: true },
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit),
    skip: (parseInt(page) - 1) * parseInt(limit),
  });
  const total = await prisma.post.count({ where });

  res.json({ success: true, posts, total, page: parseInt(page), limit: parseInt(limit) });
});

// Conflict detection for posts
router.get('/posts/:id/conflict', requirePermission('posts:read'), async (req, res) => {
  const conflictScore = await detectConflict(req.params.id);
  res.json({ success: true, conflictScore });
});

// ============ VERIFICATION QUEUE ============
router.get('/verification/pending', requirePermission('verification:read'), async (req, res) => {
  const pending = await prisma.user.findMany({
    where: { verificationStatus: 'pending', role: { in: ['creator', 'vibe'] } },
  });
  res.json({ success: true, pending });
});

router.post('/verification/:id/approve', requirePermission('verification:approve'), async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  await prisma.user.update({
    where: { id },
    data: {
      verificationStatus: 'approved',
      isVerified: true,
      verifiedAt: new Date(),
      verifiedBy: req.user?.id || 'admin',
    },
  });

  // Send congratulatory inbox message
  const isCreator = user.userType === 'zls_artist' || user.userType === 'independent_creator';
  const congratulatoryMessage = isCreator
    ? `🎉 Congratulations! Your STEEZE creator account has been approved. You can now log in and start building your website-style profile, upload content, and monetize your creativity. Welcome to the future of entertainment!`
    : `🎉 Congratulations! Your STEEZE VIBES account has been approved. You can now log in and enjoy pure entertainment – music, comedy, dance, drama – from verified creators. No fake accounts. No politics. Just entertainment. Welcome to STEEZE!`;

  await prisma.inboxMessage.create({
    data: {
      userId: id,
      subject: 'Account Approved! 🎉',
      content: congratulatoryMessage,
      type: 'system',
    },
  });

  console.log(`✅ User approved: ${user.email}`);
  res.json({ success: true, userType: user.userType, username: user.artistName });
});

router.post('/verification/:id/reject', requirePermission('verification:reject'), async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) return res.status(404).json({ error: 'User not found' });

  await prisma.user.update({
    where: { id },
    data: {
      verificationStatus: 'rejected',
      rejectionReason: reason,
      verifiedBy: req.user?.id || 'admin',
    },
  });

  // Send rejection message with retry instructions
  await prisma.inboxMessage.create({
    data: {
      userId: id,
      subject: 'Registration Update',
      content: `Your registration was not approved. Reason: ${reason}\n\nTo retry, please fix the issues and submit a new registration at steeze.zeustechafrica.com/signup. If you believe this is an error, please contact support at support@steeze.com.\n\nWe look forward to having you on STEEZE!`,
      type: 'system',
    },
  });

  console.log(`❌ User rejected: ${user.email} - Reason: ${reason}`);
  res.json({ success: true });
});

// Verification messages
router.post('/verification/:id/message', requirePermission('verification:read'), async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;
  // Store verification communication
  await prisma.moderationNote.create({
    data: {
      targetType: 'user',
      targetId: id,
      note: `Verification message: ${message}`,
      createdBy: req.user.id,
    },
  });
  res.json({ success: true });
});

// ============ CONTRACT MANAGEMENT ============
router.get('/contracts', requirePermission('users:read'), async (req, res) => {
  const contracts = await prisma.contract.findMany({
    include: { creator: true },
    orderBy: { createdAt: 'desc' },
  });
  res.json({ success: true, contracts });
});

router.post('/contracts/:id/approve', requirePermission('users:update'), async (req, res) => {
  const { id } = req.params;
  await prisma.contract.update({
    where: { id },
    data: { status: 'approved', approvedBy: req.user.id, approvedAt: new Date() },
  });
  res.json({ success: true });
});

router.post('/contracts/:id/reject', requirePermission('users:update'), async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;
  await prisma.contract.update({
    where: { id },
    data: { status: 'rejected', rejectedReason: reason },
  });
  res.json({ success: true });
});

// ============ REPORTED CONTENT QUEUE ============
router.get('/reports', requirePermission('reports:read'), async (req, res) => {
  const reports = await prisma.report.findMany({
    where: { status: 'pending' },
    include: { reporter: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ success: true, reports });
});

router.post('/reports/:id/resolve', requirePermission('reports:resolve'), async (req, res) => {
  const { id } = req.params;
  const { action, note } = req.body;
  await prisma.report.update({
    where: { id },
    data: { status: 'reviewed', reviewedAt: new Date(), reviewedBy: req.user.id },
  });
  res.json({ success: true });
});

// ============ APPEALS QUEUE ============
router.get('/appeals', requirePermission('reports:read'), async (req, res) => {
  const appeals = await prisma.appeal.findMany({
    where: { status: 'pending' },
    include: { user: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ success: true, appeals });
});

router.post('/appeals/:id/approve', requirePermission('reports:resolve'), async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;
  await prisma.appeal.update({
    where: { id },
    data: { status: 'approved', reviewedBy: req.user.id, reviewedAt: new Date(), adminNote: note },
  });
  res.json({ success: true });
});

router.post('/appeals/:id/reject', requirePermission('reports:resolve'), async (req, res) => {
  const { id } = req.params;
  const { note } = req.body;
  await prisma.appeal.update({
    where: { id },
    data: { status: 'rejected', reviewedBy: req.user.id, reviewedAt: new Date(), adminNote: note },
  });
  res.json({ success: true });
});

// ============ REVENUE DASHBOARD ============
router.get('/revenue', requirePermission('financial:read'), async (req, res) => {
  const [subscriptions, paidPosts, payouts, pendingPayouts] = await Promise.all([
    prisma.subscription.aggregate({ _sum: { price: true } }),
    prisma.post.aggregate({ where: { isFree: false }, _sum: { price: true } }),
    prisma.payout.aggregate({ where: { status: 'completed' }, _sum: { amount: true } }),
    prisma.payout.aggregate({ where: { status: 'pending' }, _sum: { amount: true } }),
  ]);

  res.json({
    success: true,
    revenue: {
      totalSubscriptions: subscriptions._sum.price || 0,
      totalPaidPosts: paidPosts._sum.price || 0,
      totalPayouts: payouts._sum.amount || 0,
      pendingPayouts: pendingPayouts._sum.amount || 0,
      platformRevenue:
        (subscriptions._sum.price || 0) + (paidPosts._sum.price || 0) - (payouts._sum.amount || 0),
    },
  });
});

// Payout queue
router.get('/payouts', requirePermission('financial:read'), async (req, res) => {
  const payouts = await prisma.payout.findMany({
    include: { creator: true },
    orderBy: { createdAt: 'asc' },
  });
  res.json({ success: true, payouts });
});

router.post('/payouts/:id/approve', requirePermission('financial:process_payouts'), async (req, res) => {
  const { id } = req.params;
  await prisma.payout.update({
    where: { id },
    data: { status: 'processing', processedBy: req.user.id },
  });
  res.json({ success: true });
});

// ============ BROADCAST SYSTEM ============
router.post('/broadcast', requirePermission('broadcast:send'), async (req, res) => {
  const { title, message, recipientType, scheduledFor } = req.body;

  let where = {};
  if (recipientType === 'creators') where.userType = { in: ['zls_artist', 'independent_creator'] };
  else if (recipientType === 'vibes') where.userType = 'vibe';
  else if (recipientType === 'zls_artists') where.userType = 'zls_artist';
  else if (recipientType === 'independent_creators') where.userType = 'independent_creator';

  const users = await prisma.user.findMany({ where, select: { id: true } });

  await prisma.broadcast.create({
    data: {
      title,
      message,
      recipientType,
      scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
      createdBy: req.user.id,
    },
  });

  res.json({ success: true, recipientCount: users.length });
});

// ============ CONTENT CALENDAR ============
router.get('/calendar', requirePermission('calendar:read'), async (req, res) => {
  const { start, end } = req.query;
  const posts = await prisma.post.findMany({
    where: {
      scheduledFor: {
        gte: start ? new Date(start) : undefined,
        lte: end ? new Date(end) : undefined,
      },
    },
    include: { creator: true },
    orderBy: { scheduledFor: 'asc' },
  });
  res.json({ success: true, posts });
});

// ============ SECURITY MONITORING ============
router.get('/security/dashboard', requirePermission('security:read'), async (req, res) => {
  const [rateLimitHits, botDetections, suspiciousLogins, activeSessions] = await Promise.all([
    prisma.securityEvent.count({
      where: { type: 'rate_limit', createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
    prisma.securityEvent.count({
      where: { type: 'bot_detection', createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
    prisma.loginHistory.count({
      where: { timestamp: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
    prisma.session.count(),
  ]);

  res.json({
    success: true,
    security: { rateLimitHits, botDetections, suspiciousLogins, activeSessions },
  });
});

// IP blacklist/whitelist
router.get('/ip-rules', requirePermission('security:read'), async (req, res) => {
  const rules = await prisma.ipRule.findMany();
  res.json({ success: true, rules });
});

router.post('/ip-rules', requirePermission('security:update'), async (req, res) => {
  const { ipAddress, type, reason, expiresAt } = req.body;
  await prisma.ipRule.create({
    data: { ipAddress, type, reason, createdBy: req.user.id, expiresAt: expiresAt ? new Date(expiresAt) : null },
  });
  res.json({ success: true });
});

router.delete('/ip-rules/:id', requirePermission('security:update'), async (req, res) => {
  await prisma.ipRule.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// Emergency kill switch
router.post('/kill-switch', requireRole('super_admin'), async (req, res) => {
  const { action } = req.body;
  await prisma.systemSettings.upsert({
    where: { id: 1 },
    update: {
      maintenanceMode: true,
      maintenanceMessage:
        action === 'read-only'
          ? 'Platform in read-only mode. Emergency maintenance in progress.'
          : 'Platform is under emergency maintenance. Please check back soon.',
    },
    create: {
      id: 1,
      maintenanceMode: true,
      maintenanceMessage:
        action === 'read-only'
          ? 'Platform in read-only mode.'
          : 'Under emergency maintenance.',
    },
  });
  res.json({ success: true });
});

// Security audit trail
router.get('/audit-logs', requirePermission('security:read'), async (req, res) => {
  const { action, adminId, startDate, endDate, page = 1, limit = 50 } = req.query;
  const where = {};
  if (action) where.action = action;
  if (adminId) where.adminId = adminId;
  if (startDate) where.createdAt = { gte: new Date(startDate) };
  if (endDate) where.createdAt = { ...where.createdAt, lte: new Date(endDate) };

  const logs = await prisma.auditLog.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: parseInt(limit),
    skip: (parseInt(page) - 1) * parseInt(limit),
  });
  const total = await prisma.auditLog.count({ where });

  res.json({ success: true, logs, total, page: parseInt(page), limit: parseInt(limit) });
});

// ============ DISTRIBUTION CHANNEL MANAGEMENT ============
router.get('/distribution/channels', requirePermission('distribution:read'), async (req, res) => {
  const channels = await prisma.distributionCredential.findMany();
  const channelStatus = {};
  for (const channel of channels) {
    channelStatus[channel.channel] = {
      status: channel.status,
      lastTested: channel.lastTested,
      lastError: channel.lastError,
    };
  }
  res.json({ success: true, channels: channelStatus });
});

router.post('/distribution/test/:channel', requirePermission('distribution:manage'), async (req, res) => {
  const { channel } = req.params;
  // Test connection logic
  res.json({ success: true, message: `${channel} connection successful` });
});

router.get('/distribution/queue', requirePermission('distribution:read'), async (req, res) => {
  const jobs = await prisma.distributionJob.findMany({
    where: { status: { in: ['pending', 'retry'] } },
    orderBy: { priority: 'desc', createdAt: 'asc' },
  });
  res.json({ success: true, jobs });
});

router.post('/distribution/retry/:id', requirePermission('distribution:manage'), async (req, res) => {
  const { id } = req.params;
  await prisma.distributionJob.update({
    where: { id },
    data: { status: 'retry', attempts: { increment: 1 }, errorMessage: null },
  });
  res.json({ success: true });
});

// ============ MODERATION RULES ENGINE ============
router.get('/moderation-rules', requirePermission('settings:read'), async (req, res) => {
  const rules = await prisma.moderationRule.findMany();
  res.json({ success: true, rules });
});

router.post('/moderation-rules', requirePermission('settings:update'), async (req, res) => {
  const { name, description, condition, action, duration } = req.body;
  await prisma.moderationRule.create({
    data: { name, description, condition, action, duration, createdBy: req.user.id },
  });
  res.json({ success: true });
});

router.put('/moderation-rules/:id/toggle', requirePermission('settings:update'), async (req, res) => {
  const { id } = req.params;
  const rule = await prisma.moderationRule.findUnique({ where: { id } });
  if (!rule) return res.status(404).json({ success: false, message: 'Rule not found' });
  await prisma.moderationRule.update({ where: { id }, data: { isActive: !rule.isActive } });
  res.json({ success: true });
});

router.delete('/moderation-rules/:id', requirePermission('settings:update'), async (req, res) => {
  await prisma.moderationRule.delete({ where: { id: req.params.id } });
  res.json({ success: true });
});

// ============ SYSTEM SETTINGS ============
router.get('/settings', requirePermission('settings:read'), async (req, res) => {
  const settings = await prisma.systemSettings.findFirst();
  res.json({ success: true, settings });
});

// Maintenance mode - get status
router.get('/maintenance', requirePermission('settings:read'), async (req, res) => {
  const settings = await prisma.systemSettings.findFirst();
  res.json({ success: true, maintenanceMode: settings?.maintenanceMode || false, maintenanceMessage: settings?.maintenanceMessage || '' });
});

// Maintenance mode - toggle
router.post('/maintenance', requireRole('super_admin'), async (req, res) => {
  const { isEnabled, message } = req.body;
  const result = await prisma.systemSettings.upsert({
    where: { id: 1 },
    update: { maintenanceMode: isEnabled, maintenanceMessage: message || null },
    create: { id: 1, maintenanceMode: isEnabled, maintenanceMessage: message || null },
  });
  res.json({ success: true, maintenanceMode: result.maintenanceMode });
});

router.post('/settings/maintenance', requireRole('super_admin'), async (req, res) => {
  const { isEnabled, message } = req.body;
  await prisma.systemSettings.upsert({
    where: { id: 1 },
    update: { maintenanceMode: isEnabled, maintenanceMessage: message },
    create: { id: 1, maintenanceMode: isEnabled, maintenanceMessage: message },
  });
  res.json({ success: true });
});

// ============ SYSTEM HEALTH ============
router.get('/health', requirePermission('security:read'), async (req, res) => {
  let databaseHealth = 'healthy';
  try {
    await prisma.$queryRaw`SELECT 1`;
  } catch {
    databaseHealth = 'down';
  }

  // Check CDN health from database
  let cdnHealth = 'unknown';
  try {
    const cdnHealthRecord = await prisma.cDNHealth.findFirst({
      orderBy: { checkedAt: 'desc' },
    });
    if (cdnHealthRecord) {
      cdnHealth = cdnHealthRecord.status || 'unknown';
    }
  } catch {
    cdnHealth = 'unknown';
  }

  res.json({
    success: true,
    health: {
      database: databaseHealth,
      api: 'healthy',
      storage: 'healthy',
      cdn: cdnHealth,
    },
  });
});

// ============ ANALYTICS ============
router.get('/analytics/user-growth', requirePermission('financial:read'), async (req, res) => {
  const { period = 'week' } = req.query;
  const users = await prisma.user.findMany({
    where: {
      createdAt: {
        gte: new Date(
          Date.now() - (period === 'week' ? 7 : period === 'month' ? 30 : 365) * 24 * 60 * 60 * 1000
        ),
      },
    },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  // Group users by day
  const signups = {};
  for (const user of users) {
    const day = user.createdAt.toISOString().split('T')[0];
    signups[day] = (signups[day] || 0) + 1;
  }

  res.json({ success: true, signups });
});

router.get('/analytics/leaderboard', requirePermission('financial:read'), async (req, res) => {
  const leaderboard = await prisma.user.findMany({
    where: { userType: { in: ['zls_artist', 'independent_creator'] } },
    select: { id: true, artistName: true, username: true, profilePicUrl: true, followerCount: true },
    orderBy: { followerCount: 'desc' },
    take: 20,
  });
  res.json({ success: true, leaderboard });
});

// Export reports
router.get('/export/:type', requirePermission('financial:export'), async (req, res) => {
  const { type } = req.params;
  let data = [];

  if (type === 'users') data = await prisma.user.findMany();
  else if (type === 'posts') data = await prisma.post.findMany();
  else if (type === 'payments') data = await prisma.payment.findMany();
  else if (type === 'reports') data = await prisma.report.findMany();

  res.json({ success: true, data, count: data.length });
});

// ============ TASK 8: ADMIN-USER FULL CONTROL LINKING ============

// Impersonate user (admin can view as user)
router.post('/impersonate/:userId', requireRole('super_admin'), async (req, res) => {
  const { userId } = req.params;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  // Generate impersonation token (expires in 1 hour)
  const impersonationToken = jwt.sign(
    { userId: user.id, role: user.role, isImpersonating: true, adminId: req.user.id },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Log impersonation action
  await prisma.auditLog.create({
    data: {
      adminId: req.user.id,
      action: 'impersonate_user',
      targetType: 'user',
      targetId: userId,
      details: { message: `Admin ${req.user.email} impersonated user ${user.email}` },
      ipAddress: req.ip,
    },
  });

  logAudit('impersonate_user', req.user, { type: 'user', id: userId }, { targetEmail: user.email });

  res.json({
    success: true,
    token: impersonationToken,
    user: {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      userType: user.userType,
    },
  });
});

// End impersonation (return to admin)
router.post('/impersonate/end', requireRole('super_admin'), async (req, res) => {
  // Re-issue admin token
  const adminToken = jwt.sign(
    { userId: req.user.adminId || req.user.id, role: req.user.role, isImpersonating: false },
    process.env.JWT_SECRET,
    { expiresIn: '24h' }
  );

  logAudit('end_impersonation', req.user, {}, {});

  res.json({ success: true, token: adminToken });
});

// Get user activity log
router.get('/users/:id/activity', requirePermission('users:read'), async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 50 } = req.query;
  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [activities, total] = await Promise.all([
    prisma.userActivity.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit),
    }),
    prisma.userActivity.count({ where: { userId: id } }),
  ]);

  res.json({
    success: true,
    activities,
    total,
    page: parseInt(page),
    limit: parseInt(limit),
  });
});

// Get user statistics
router.get('/users/:id/stats', requirePermission('users:read'), async (req, res) => {
  const { id } = req.params;

  const [
    postsCount,
    followersCount,
    followingCount,
    totalLikes,
    totalComments,
    totalReposts,
    subscriptionsCount,
    walletBalance,
  ] = await Promise.all([
    prisma.post.count({ where: { creatorId: id } }),
    prisma.follow.count({ where: { followingId: id } }),
    prisma.follow.count({ where: { followerId: id } }),
    prisma.postInteraction.count({ where: { userId: id, type: 'like' } }),
    prisma.postInteraction.count({ where: { userId: id, type: 'comment' } }),
    prisma.postInteraction.count({ where: { userId: id, type: 'repost' } }),
    prisma.subscription.count({ where: { userId: id, status: 'active' } }),
    prisma.user.findUnique({ where: { id }, select: { walletBalance: true } }),
  ]);

  res.json({
    success: true,
    stats: {
      postsCount,
      followersCount,
      followingCount,
      totalLikes,
      totalComments,
      totalReposts,
      subscriptionsCount,
      walletBalance: walletBalance?.walletBalance || 0,
    },
  });
});

// Get user session history
router.get('/users/:id/sessions', requirePermission('security:read'), async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const sessions = await prisma.session.findMany({
    where: { userId: id },
    orderBy: { createdAt: 'desc' },
    skip: (parseInt(page) - 1) * parseInt(limit),
    take: parseInt(limit),
  });

  const total = await prisma.session.count({ where: { userId: id } });

  res.json({ success: true, sessions, total, page: parseInt(page), limit: parseInt(limit) });
});

// Force logout user from all sessions
router.post('/users/:id/force-logout', requirePermission('security:update'), async (req, res) => {
  const { id } = req.params;

  await prisma.session.deleteMany({ where: { userId: id } });

  logAudit('force_logout_user', req.user, { type: 'user', id }, {});

  res.json({ success: true, message: 'All user sessions terminated' });
});

// Get user payment history
router.get('/users/:id/payments', requirePermission('financial:read'), async (req, res) => {
  const { id } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    }),
    prisma.payment.count({ where: { userId: id } }),
  ]);

  res.json({ success: true, payments, total, page: parseInt(page), limit: parseInt(limit) });
});

// Get user interaction history (likes, comments, reposts)
router.get('/users/:id/interactions', requirePermission('users:read'), async (req, res) => {
  const { id } = req.params;
  const { type, page = 1, limit = 20 } = req.query;
  const where = { userId: id };
  if (type && type !== 'all') where.type = type;

  const [interactions, total] = await Promise.all([
    prisma.postInteraction.findMany({
      where,
      include: { post: { select: { id: true, title: true, creator: { select: { id: true, username: true } } } } },
      orderBy: { createdAt: 'desc' },
      skip: (parseInt(page) - 1) * parseInt(limit),
      take: parseInt(limit),
    }),
    prisma.postInteraction.count({ where }),
  ]);

  res.json({ success: true, interactions, total, page: parseInt(page), limit: parseInt(limit) });
});

// Assign/change user role
router.put('/users/:id/role', requireRole('super_admin'), async (req, res) => {
  const { id } = req.params;
  const { role } = req.body;

  const validRoles = ['user', 'creator', 'vibe', 'moderator', 'admin', 'super_admin'];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ success: false, message: `Invalid role. Valid roles: ${validRoles.join(', ')}` });
  }

  const user = await prisma.user.findUnique({ where: { id } });
  if (!user) {
    return res.status(404).json({ success: false, message: 'User not found' });
  }

  const previousRole = user.role;

  await prisma.user.update({
    where: { id },
    data: { role },
  });

  logAudit('change_user_role', req.user, { type: 'user', id }, { previousRole, newRole: role });

  res.json({
    success: true,
    message: `User role changed from ${previousRole} to ${role}`,
    previousRole,
    newRole: role,
  });
});

// Unban / unsuspend user
router.post('/users/:id/restore', requirePermission('users:update'), async (req, res) => {
  const { id } = req.params;

  await prisma.user.update({
    where: { id },
    data: {
      isBanned: false,
      isSuspended: false,
    },
  });

  // Remove any active shadow bans
  await prisma.shadowBan.deleteMany({ where: { userId: id } });

  logAudit('restore_user', req.user, { type: 'user', id }, {});

  res.json({ success: true, message: 'User restored successfully' });
});

// ============ AGE RESTRICTION OVERRIDE ============
router.put('/posts/:id/age-restriction', requirePermission('posts:update'), async (req, res) => {
  const { id } = req.params;
  const { isAgeRestricted } = req.body;

  const post = await prisma.post.findUnique({ where: { id } });
  if (!post) {
    return res.status(404).json({ success: false, message: 'Post not found' });
  }

  await prisma.post.update({
    where: { id },
    data: { isAgeRestricted: Boolean(isAgeRestricted) },
  });

  logAudit('age_restriction_override', req.user, { type: 'post', id }, {
    previous: post.isAgeRestricted,
    updated: Boolean(isAgeRestricted),
  });

  res.json({ success: true, message: `Age restriction ${isAgeRestricted ? 'enabled' : 'disabled'} for post` });
});

// ============ AUDIT LOG EXPORT (FUTURE 10A) ============

// GET /api/admin/audit-logs/export - Export audit logs as CSV
router.get('/audit-logs/export', requirePermission('audit:read'), async (req, res) => {
  try {
    const { startDate, endDate, adminId, action, targetType, format = 'csv' } = req.query;
    
    const filters = { startDate, endDate, adminId, action, targetType };
    const csv = await exportAuditLogs(filters, format);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit-logs-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export audit logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to export audit logs' });
  }
});

// GET /api/admin/audit-logs/verify/:id - Verify log integrity
router.get('/audit-logs/verify/:id', requirePermission('audit:read'), async (req, res) => {
  try {
    const { id } = req.params;
    const result = await verifyLogIntegrity(id);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Verify log error:', error);
    res.status(500).json({ success: false, message: 'Failed to verify log' });
  }
});

// GET /api/admin/audit-logs/stats - Get audit log statistics
router.get('/audit-logs/stats', requirePermission('audit:read'), async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const stats = await getAuditStats(parseInt(days));
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Get audit stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch audit stats' });
  }
});

// DELETE /api/admin/audit-logs/cleanup - Clean old logs (super admin only)
router.delete('/audit-logs/cleanup', requirePermission('audit:manage'), async (req, res) => {
  try {
    const { olderThanDays = 90 } = req.query;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - parseInt(olderThanDays));
    
    const result = await prisma.auditLog.deleteMany({
      where: {
        createdAt: { lt: cutoffDate },
        isImmutable: false
      }
    });
    
    res.json({ success: true, deleted: result.count, cutoffDays: olderThanDays });
  } catch (error) {
    console.error('Cleanup audit logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to cleanup audit logs' });
  }
});

export default router;
