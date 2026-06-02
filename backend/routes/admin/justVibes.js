import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// AUDIT: GET /api/admin/just-vibes/users - Get all Just VIBES users
router.get('/admin/just-vibes/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      status, 
      search, 
      limit = 50, 
      offset = 0,
      startDate,
      endDate
    } = req.query;
    
    const parsedLimit = Math.min(100, parseInt(limit) || 50);
    const parsedOffset = parseInt(offset) || 0;
    
    // Build where clause
    const where = {};
    
    if (status && ['pending', 'approved', 'rejected', 'expired'].includes(status)) {
      where.status = status;
    }
    
    if (search) {
      where.email = { contains: search, mode: 'insensitive' };
    }
    
    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }
    
    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    }
    
    const [users, total] = await Promise.all([
      prisma.justVibesUser.findMany({
        where,
        include: {
          sessions: {
            orderBy: { createdAt: 'desc' },
            take: 1
          }
        },
        orderBy: { createdAt: 'desc' },
        take: parsedLimit,
        skip: parsedOffset
      }),
      prisma.justVibesUser.count({ where })
    ]);
    
    // Get status counts for summary
    const statusCounts = await prisma.justVibesUser.groupBy({
      by: ['status'],
      _count: true
    });
    
    const countsMap = {};
    statusCounts.forEach(sc => {
      countsMap[sc.status] = sc._count;
    });
    
    res.json({
      success: true,
      users: users.map(u => ({
        id: u.id,
        email: u.email,
        status: u.status,
        approvedBy: u.approvedBy,
        approvedAt: u.approvedAt,
        rejectedAt: u.rejectedAt,
        rejectionReason: u.rejectionReason,
        createdAt: u.createdAt,
        lastSession: u.sessions[0] || null
      })),
      pagination: {
        total,
        limit: parsedLimit,
        offset: parsedOffset,
        hasMore: parsedOffset + parsedLimit < total
      },
      summary: {
        pending: countsMap.pending || 0,
        approved: countsMap.approved || 0,
        rejected: countsMap.rejected || 0,
        expired: countsMap.expired || 0,
        total
      }
    });
  } catch (error) {
    console.error('Get Just VIBES users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// AUDIT: POST /api/admin/just-vibes/:id/approve - Approve user account
router.post('/admin/just-vibes/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { notes } = req.body;
    
    const user = await prisma.justVibesUser.findUnique({
      where: { id }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.status !== 'pending') {
      return res.status(400).json({ 
        error: `Cannot approve user with status: ${user.status}` 
      });
    }
    
    const updated = await prisma.justVibesUser.update({
      where: { id },
      data: {
        status: 'approved',
        approvedBy: adminId,
        approvedAt: new Date()
      }
    });
    
    // TODO: Send email notification to user (will be implemented later)
    console.log(`[JUST VIBES] User ${user.email} approved by admin ${adminId}`);
    
    res.json({
      success: true,
      message: 'User account approved successfully',
      user: {
        id: updated.id,
        email: updated.email,
        status: updated.status,
        approvedAt: updated.approvedAt
      }
    });
  } catch (error) {
    console.error('Approve Just VIBES user error:', error);
    res.status(500).json({ error: 'Failed to approve user' });
  }
});

// AUDIT: POST /api/admin/just-vibes/:id/reject - Reject user account
router.post('/admin/just-vibes/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    const { rejectionReason, notes } = req.body;
    
    if (!rejectionReason || typeof rejectionReason !== 'string') {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }
    
    const user = await prisma.justVibesUser.findUnique({
      where: { id }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    if (user.status !== 'pending') {
      return res.status(400).json({ 
        error: `Cannot reject user with status: ${user.status}` 
      });
    }
    
    const updated = await prisma.justVibesUser.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectedAt: new Date(),
        rejectionReason
      }
    });
    
    // TODO: Send email notification to user (will be implemented later)
    console.log(`[JUST VIBES] User ${user.email} rejected by admin ${adminId}. Reason: ${rejectionReason}`);
    
    res.json({
      success: true,
      message: 'User account rejected',
      user: {
        id: updated.id,
        email: updated.email,
        status: updated.status,
        rejectionReason: updated.rejectionReason
      }
    });
  } catch (error) {
    console.error('Reject Just VIBES user error:', error);
    res.status(500).json({ error: 'Failed to reject user' });
  }
});

export default router;