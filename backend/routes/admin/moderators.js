import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin, requireSuperAdmin } from '../../middleware/auth.js';
import { getOrCreateModerator, recordModeratorAction, getModeratorDashboard, getModeratorPerformance } from '../../services/moderatorService.js';

const router = express.Router();
const prisma = new PrismaClient();

// ============ MODERATOR MANAGEMENT ============

// GET /api/admin/moderators - List all moderators
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const moderators = await prisma.moderator.findMany({
      include: {
        user: { select: { id: true, email: true, username: true, artistName: true } },
        metrics: true
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json({ success: true, moderators });
  } catch (error) {
    console.error('Get moderators error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch moderators' });
  }
});

// POST /api/admin/moderators - Create a new moderator
router.post('/', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { userId, role, department } = req.body;
    const moderator = await getOrCreateModerator(userId, role, department);
    res.json({ success: true, moderator });
  } catch (error) {
    console.error('Create moderator error:', error);
    res.status(500).json({ success: false, message: 'Failed to create moderator' });
  }
});

// PUT /api/admin/moderators/:moderatorId - Update moderator
router.put('/:moderatorId', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { moderatorId } = req.params;
    const { role, department, isActive } = req.body;
    
    const moderator = await prisma.moderator.update({
      where: { id: moderatorId },
      data: { role, department, isActive, updatedAt: new Date() }
    });
    
    res.json({ success: true, moderator });
  } catch (error) {
    console.error('Update moderator error:', error);
    res.status(500).json({ success: false, message: 'Failed to update moderator' });
  }
});

// DELETE /api/admin/moderators/:moderatorId - Remove moderator (deactivate)
router.delete('/:moderatorId', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { moderatorId } = req.params;
    await prisma.moderator.update({
      where: { id: moderatorId },
      data: { isActive: false, updatedAt: new Date() }
    });
    res.json({ success: true, message: 'Moderator deactivated' });
  } catch (error) {
    console.error('Deactivate moderator error:', error);
    res.status(500).json({ success: false, message: 'Failed to deactivate moderator' });
  }
});

// ============ MODERATOR DASHBOARD & PERFORMANCE ============

// GET /api/admin/moderators/dashboard - Performance dashboard
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const dashboard = await getModeratorDashboard(parseInt(days));
    res.json({ success: true, dashboard });
  } catch (error) {
    console.error('Get moderator dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch moderator dashboard' });
  }
});

// GET /api/admin/moderators/:moderatorId/performance - Individual moderator performance
router.get('/:moderatorId/performance', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { moderatorId } = req.params;
    const { days = 30 } = req.query;
    const performance = await getModeratorPerformance(moderatorId, parseInt(days));
    res.json({ success: true, performance });
  } catch (error) {
    console.error('Get moderator performance error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch moderator performance' });
  }
});

// GET /api/admin/moderators/actions - List all moderator actions
router.get('/actions', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, moderatorId, actionType } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {};
    if (moderatorId) where.moderatorId = moderatorId;
    if (actionType) where.actionType = actionType;
    
    const [actions, total] = await Promise.all([
      prisma.moderatorAction.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: { moderator: { include: { user: { select: { email: true, username: true } } } } }
      }),
      prisma.moderatorAction.count({ where })
    ]);
    
    res.json({ success: true, actions, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error('Get moderator actions error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch moderator actions' });
  }
});

// POST /api/admin/moderators/actions/:actionId/overturn - Overturn a moderator action
router.post('/actions/:actionId/overturn', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { actionId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;
    
    const action = await prisma.moderatorAction.findUnique({
      where: { id: actionId }
    });
    
    if (!action) {
      return res.status(404).json({ success: false, message: 'Action not found' });
    }
    
    const updated = await prisma.moderatorAction.update({
      where: { id: actionId },
      data: {
        overturned: true,
        overturnedBy: adminId,
        overturnedAt: new Date()
      }
    });
    
    // Update moderator metrics for overturned
    const metric = await prisma.moderatorMetric.findUnique({
      where: { moderatorId: action.moderatorId }
    });
    
    if (metric) {
      await prisma.moderatorMetric.update({
        where: { moderatorId: action.moderatorId },
        data: { appealsOverturned: (metric.appealsOverturned || 0) + 1 }
      });
    }
    
    res.json({ success: true, action: updated });
  } catch (error) {
    console.error('Overturn action error:', error);
    res.status(500).json({ success: false, message: 'Failed to overturn action' });
  }
});

// GET /api/admin/moderators/stats/summary - Quick summary stats
router.get('/stats/summary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [activeModerators, totalActions, avgResponseTime, topPerformer] = await Promise.all([
      prisma.moderator.count({ where: { isActive: true } }),
      prisma.moderatorAction.count(),
      prisma.moderatorAction.aggregate({ _avg: { responseTime: true } }),
      prisma.moderatorMetric.findFirst({
        orderBy: { totalCasesHandled: 'desc' },
        include: { moderator: { include: { user: { select: { email: true, username: true } } } } }
      })
    ]);
    
    res.json({
      success: true,
      stats: {
        activeModerators,
        totalActions,
        averageResponseTime: avgResponseTime._avg.responseTime || 0,
        topPerformer: topPerformer ? {
          name: topPerformer.moderator.user.username || topPerformer.moderator.user.email,
          casesHandled: topPerformer.totalCasesHandled
        } : null
      }
    });
  } catch (error) {
    console.error('Get moderator stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch moderator stats' });
  }
});

export default router;