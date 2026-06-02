import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';
import { 
  getPendingReviews, 
  getReviewQueueStats, 
  assignReviewer, 
  updatePriority, 
  removeFromQueue,
  addToReviewQueue
} from '../../services/reviewQueue.js';
import { 
  bulkApprove, 
  bulkReject, 
  bulkAssign, 
  bulkUpdatePriority,
  getBulkOperationStats 
} from '../../services/bulkReview.js';
import { 
  logReviewAction, 
  getReviewAuditTrail, 
  getReviewSummary,
  getAdminReviewHistory
} from '../../services/reviewHistory.js';

const router = express.Router();
const prisma = new PrismaClient();

// Helper: Convert cents to Rands (if needed)
function centsToRands(cents) {
  return (cents / 100).toFixed(2);
}

// ============================================================
// QUEUE ENDPOINTS
// ============================================================

// GET /api/admin/review/queue - Get pending reviews with filters
router.get('/admin/review/queue', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      status = 'pending',
      priority = null,
      assignedTo = null,
      limit = 50,
      offset = 0,
      sortBy = 'submittedAt',
      sortOrder = 'asc'
    } = req.query;

    const result = await getPendingReviews({
      status,
      priority: priority ? parseInt(priority) : null,
      assignedTo,
      limit: parseInt(limit),
      offset: parseInt(offset),
      sortBy,
      sortOrder
    });

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Get review queue error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch review queue' });
  }
});

// GET /api/admin/review/queue/stats - Get queue statistics
router.get('/admin/review/queue/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await getReviewQueueStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Get queue stats error:', error);
    res.status(500).json({ error: 'Failed to fetch queue statistics' });
  }
});

// POST /api/admin/review/queue/:postId/assign - Assign reviewer
router.post('/admin/review/queue/:postId/assign', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { postId } = req.params;
    const { adminId } = req.body;
    const currentAdminId = req.user.id;

    if (!adminId) {
      return res.status(400).json({ error: 'adminId is required' });
    }

    const result = await assignReviewer(postId, adminId);

    // Log the assignment
    await logReviewAction({
      postId,
      adminId: currentAdminId,
      action: 'reassigned',
      notes: `Assigned to admin: ${adminId}`,
      previousStatus: result.status,
      newStatus: result.status,
      metadata: { assignedTo: adminId, assignedBy: currentAdminId }
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Assign reviewer error:', error);
    res.status(500).json({ error: error.message || 'Failed to assign reviewer' });
  }
});

// PUT /api/admin/review/queue/:postId/priority - Update priority
router.put('/admin/review/queue/:postId/priority', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { postId } = req.params;
    const { priority } = req.body;
    const adminId = req.user.id;

    if (priority === undefined || ![0, 1, 2].includes(priority)) {
      return res.status(400).json({ error: 'Valid priority (0,1,2) is required' });
    }

    const result = await updatePriority(postId, priority);

    // Log the priority update
    await logReviewAction({
      postId,
      adminId,
      action: 'priority_updated',
      notes: `Priority updated to ${priority === 0 ? 'normal' : priority === 1 ? 'high' : 'urgent'}`,
      previousStatus: result.status,
      newStatus: result.status,
      metadata: { newPriority: priority, oldPriority: result.priority }
    });

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Update priority error:', error);
    res.status(500).json({ error: error.message || 'Failed to update priority' });
  }
});

// POST /api/admin/review/queue/:postId/approve - Approve single item
router.post('/admin/review/queue/:postId/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { postId } = req.params;
    const adminId = req.user.id;
    const { notes } = req.body;

    // Get queue item
    const queueItem = await prisma.reviewQueue.findUnique({
      where: { postId }
    });

    if (!queueItem || queueItem.status !== 'pending') {
      return res.status(400).json({ error: 'Item not found or not in pending status' });
    }

    // Update queue
    const result = await removeFromQueue(postId, 'approved');

    // Update post status
    await prisma.post.update({
      where: { id: postId },
      data: { status: 'approved_global' }
    });

    // Log the approval
    await logReviewAction({
      postId,
      adminId,
      action: 'approved',
      notes: notes || null,
      previousStatus: queueItem.status,
      newStatus: 'approved',
      metadata: { singleApproval: true }
    });

    res.json({ success: true, message: 'Content approved successfully', data: result });
  } catch (error) {
    console.error('Approve content error:', error);
    res.status(500).json({ error: error.message || 'Failed to approve content' });
  }
});

// POST /api/admin/review/queue/:postId/reject - Reject single item
router.post('/admin/review/queue/:postId/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { postId } = req.params;
    const adminId = req.user.id;
    const { rejectionReason, notes } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }

    // Get queue item
    const queueItem = await prisma.reviewQueue.findUnique({
      where: { postId }
    });

    if (!queueItem || queueItem.status !== 'pending') {
      return res.status(400).json({ error: 'Item not found or not in pending status' });
    }

    // Update queue
    const result = await removeFromQueue(postId, 'rejected');

    // Update post status
    await prisma.post.update({
      where: { id: postId },
      data: { status: 'rejected' }
    });

    // Log the rejection
    await logReviewAction({
      postId,
      adminId,
      action: 'rejected',
      notes: notes || rejectionReason,
      previousStatus: queueItem.status,
      newStatus: 'rejected',
      metadata: { rejectionReason, singleRejection: true }
    });

    res.json({ success: true, message: 'Content rejected', data: result });
  } catch (error) {
    console.error('Reject content error:', error);
    res.status(500).json({ error: error.message || 'Failed to reject content' });
  }
});

// ============================================================
// BULK OPERATIONS ENDPOINTS
// ============================================================

// POST /api/admin/review/bulk/approve - Bulk approve
router.post('/admin/review/bulk/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { postIds, notes } = req.body;
    const adminId = req.user.id;

    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({ error: 'postIds array is required' });
    }

    const result = await bulkApprove(postIds, adminId, { notes });

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Bulk approve error:', error);
    res.status(500).json({ error: error.message || 'Failed to bulk approve' });
  }
});

// POST /api/admin/review/bulk/reject - Bulk reject
router.post('/admin/review/bulk/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { postIds, rejectionReason, notes } = req.body;
    const adminId = req.user.id;

    if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
      return res.status(400).json({ error: 'postIds array is required' });
    }

    if (!rejectionReason) {
      return res.status(400).json({ error: 'rejectionReason is required' });
    }

    const result = await bulkReject(postIds, adminId, rejectionReason, { notes });

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Bulk reject error:', error);
    res.status(500).json({ error: error.message || 'Failed to bulk reject' });
  }
});

// ============================================================
// HISTORY & AUDIT ENDPOINTS
// ============================================================

// GET /api/admin/review/history - Audit trail with filters
router.get('/admin/review/history', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      limit = 50,
      offset = 0,
      action = null,
      adminId = null,
      postId = null,
      startDate = null,
      endDate = null,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = req.query;

    const result = await getReviewAuditTrail({
      limit: parseInt(limit),
      offset: parseInt(offset),
      action,
      adminId,
      postId,
      startDate,
      endDate,
      sortBy,
      sortOrder
    });

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Get audit trail error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch audit trail' });
  }
});

// GET /api/admin/review/summary - Review summary statistics
router.get('/admin/review/summary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { days = 30, adminId = null } = req.query;
    
    const summary = await getReviewSummary({
      days: parseInt(days),
      adminId
    });

    // Get queue stats for completeness
    const queueStats = await getReviewQueueStats();

    res.json({ 
      success: true, 
      summary,
      queueStats
    });
  } catch (error) {
    console.error('Get review summary error:', error);
    res.status(500).json({ error: 'Failed to fetch review summary' });
  }
});

// GET /api/admin/review/my-history - Current admin's review history
router.get('/admin/review/my-history', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const adminId = req.user.id;
    const { limit = 50, offset = 0, startDate = null, endDate = null } = req.query;

    const result = await getAdminReviewHistory(adminId, {
      limit: parseInt(limit),
      offset: parseInt(offset),
      startDate,
      endDate
    });

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Get admin history error:', error);
    res.status(500).json({ error: error.message || 'Failed to fetch admin history' });
  }
});

export default router;