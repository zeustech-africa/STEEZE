import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin, requireSuperAdmin } from '../../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Helper to add to appeal history
async function addToHistory(appealId, action, details, adminId = null) {
  const appeal = await prisma.appeal.findUnique({
    where: { id: appealId }
  });
  
  let history = appeal.history || [];
  history.push({
    action,
    details,
    adminId,
    timestamp: new Date().toISOString()
  });
  
  await prisma.appeal.update({
    where: { id: appealId },
    data: { history }
  });
}

// GET /api/admin/appeals - List all appeals
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const appeals = await prisma.appeal.findMany({
      where,
      include: {
        user: { select: { id: true, email: true, username: true, artistName: true } },
        admin: { select: { id: true, email: true, username: true } }
      },
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });
    
    const total = await prisma.appeal.count({ where });
    
    res.json({ success: true, appeals, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error('Get appeals error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch appeals' });
  }
});

// GET /api/admin/appeals/:id - Get single appeal with history
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const appeal = await prisma.appeal.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, username: true, artistName: true } },
        admin: { select: { id: true, email: true, username: true } }
      }
    });
    
    if (!appeal) {
      return res.status(404).json({ success: false, message: 'Appeal not found' });
    }
    
    res.json({ success: true, appeal });
  } catch (error) {
    console.error('Get appeal error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch appeal' });
  }
});

// POST /api/admin/appeals/:id/approve - Approve appeal
router.post('/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminResponse } = req.body;
    const adminId = req.user.id;
    
    const appeal = await prisma.appeal.update({
      where: { id },
      data: {
        status: 'approved',
        adminResponse,
        adminId,
        updatedAt: new Date()
      }
    });
    
    await addToHistory(id, 'approved', { adminResponse, adminId }, adminId);
    
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'approve_appeal',
        targetType: 'appeal',
        targetId: id,
        details: { adminResponse }
      }
    });
    
    res.json({ success: true, appeal });
  } catch (error) {
    console.error('Approve appeal error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve appeal' });
  }
});

// POST /api/admin/appeals/:id/reject - Reject appeal
router.post('/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminResponse } = req.body;
    const adminId = req.user.id;
    
    const appeal = await prisma.appeal.update({
      where: { id },
      data: {
        status: 'rejected',
        adminResponse,
        adminId,
        updatedAt: new Date()
      }
    });
    
    await addToHistory(id, 'rejected', { adminResponse, adminId }, adminId);
    
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'reject_appeal',
        targetType: 'appeal',
        targetId: id,
        details: { adminResponse }
      }
    });
    
    res.json({ success: true, appeal });
  } catch (error) {
    console.error('Reject appeal error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject appeal' });
  }
});

// POST /api/admin/appeals/:id/escalate - Escalate appeal (super admin only)
router.post('/:id/escalate', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { escalateTo, escalationReason } = req.body;
    const adminId = req.user.id;
    
    const appeal = await prisma.appeal.update({
      where: { id },
      data: {
        status: 'escalated',
        escalatedAt: new Date(),
        escalatedTo: escalateTo || 'super_admin',
        escalatedBy: adminId,
        escalationReason,
        updatedAt: new Date()
      }
    });
    
    await addToHistory(id, 'escalated', { escalateTo, escalationReason, adminId }, adminId);
    
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'escalate_appeal',
        targetType: 'appeal',
        targetId: id,
        details: { escalateTo, escalationReason }
      }
    });
    
    res.json({ success: true, appeal });
  } catch (error) {
    console.error('Escalate appeal error:', error);
    res.status(500).json({ success: false, message: 'Failed to escalate appeal' });
  }
});

// POST /api/admin/appeals/:id/request-info - Request additional information from user
router.post('/:id/request-info', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { message } = req.body;
    const adminId = req.user.id;
    
    if (!message || message.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    
    const appeal = await prisma.appeal.update({
      where: { id },
      data: {
        status: 'info_requested',
        infoRequestedAt: new Date(),
        infoRequestedBy: adminId,
        infoRequestedMessage: message,
        updatedAt: new Date()
      }
    });
    
    await addToHistory(id, 'info_requested', { message, adminId }, adminId);
    
    // Create notification for user
    await prisma.notification.create({
      data: {
        userId: appeal.userId,
        type: 'appeal_info_request',
        title: 'Additional Information Required for Appeal',
        message: `Your appeal requires additional information: ${message.substring(0, 200)}`,
        isRead: false
      }
    });
    
    res.json({ success: true, appeal });
  } catch (error) {
    console.error('Request info error:', error);
    res.status(500).json({ success: false, message: 'Failed to request information' });
  }
});

// POST /api/admin/appeals/:id/submit-info - User submits requested info (handled by user route, but endpoint exists)
router.post('/:id/submit-info', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { info } = req.body;
    const userId = req.user.id;
    
    const appeal = await prisma.appeal.findUnique({ where: { id } });
    
    if (!appeal || appeal.userId !== userId) {
      return res.status(404).json({ success: false, message: 'Appeal not found' });
    }
    
    if (appeal.status !== 'info_requested') {
      return res.status(400).json({ success: false, message: 'No information requested for this appeal' });
    }
    
    const updatedAppeal = await prisma.appeal.update({
      where: { id },
      data: {
        status: 'pending',
        infoSubmittedAt: new Date(),
        infoSubmitted: info,
        updatedAt: new Date()
      }
    });
    
    await addToHistory(id, 'info_submitted', { info }, userId);
    
    res.json({ success: true, appeal: updatedAppeal });
  } catch (error) {
    console.error('Submit info error:', error);
    res.status(500).json({ success: false, message: 'Failed to submit information' });
  }
});

// GET /api/admin/appeals/:id/history - Get full appeal history
router.get('/:id/history', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const appeal = await prisma.appeal.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, username: true } },
        admin: { select: { id: true, email: true, username: true } }
      }
    });
    
    if (!appeal) {
      return res.status(404).json({ success: false, message: 'Appeal not found' });
    }
    
    // Get audit logs related to this appeal
    const auditLogs = await prisma.auditLog.findMany({
      where: {
        targetType: 'appeal',
        targetId: id
      },
      orderBy: { createdAt: 'asc' }
    });
    
    const history = {
      appeal,
      timeline: appeal.history || [],
      auditLogs,
      createdAt: appeal.createdAt,
      updatedAt: appeal.updatedAt,
      resolvedAt: appeal.status === 'approved' || appeal.status === 'rejected' ? appeal.updatedAt : null
    };
    
    res.json({ success: true, history });
  } catch (error) {
    console.error('Get appeal history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch appeal history' });
  }
});

export default router;