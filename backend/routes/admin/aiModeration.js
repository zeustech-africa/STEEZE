import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin, requireSuperAdmin } from '../../middleware/auth.js';
import {
  getAISettings,
  updateAISettings,
  moderateContent,
  getModerationStats,
  getModerationLogs,
  getModerationLogById,
  reviewModerationLog,
  getDetailedModerationStats,
  exportModerationLogs
} from '../../services/aiModerationService.js';

const router = express.Router();
const prisma = new PrismaClient();

// ============ AI MODERATION SETTINGS ============

// GET /api/admin/ai-moderation/settings - Get AI settings
router.get('/settings', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const settings = await getAISettings();
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Get AI settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch AI settings' });
  }
});

// PUT /api/admin/ai-moderation/settings - Update AI settings
router.put('/settings', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const {
      spamEnabled, adultEnabled, violenceEnabled, hateSpeechEnabled,
      spamThreshold, adultThreshold, violenceThreshold, hateSpeechThreshold,
      humanReviewThreshold, requireHumanReview, spamKeywords, customRules
    } = req.body;
    const adminId = req.user.id;
    
    const updates = {};
    if (spamEnabled !== undefined) updates.spamEnabled = spamEnabled;
    if (adultEnabled !== undefined) updates.adultEnabled = adultEnabled;
    if (violenceEnabled !== undefined) updates.violenceEnabled = violenceEnabled;
    if (hateSpeechEnabled !== undefined) updates.hateSpeechEnabled = hateSpeechEnabled;
    if (spamThreshold !== undefined) updates.spamThreshold = spamThreshold;
    if (adultThreshold !== undefined) updates.adultThreshold = adultThreshold;
    if (violenceThreshold !== undefined) updates.violenceThreshold = violenceThreshold;
    if (hateSpeechThreshold !== undefined) updates.hateSpeechThreshold = hateSpeechThreshold;
    if (humanReviewThreshold !== undefined) updates.humanReviewThreshold = humanReviewThreshold;
    if (requireHumanReview !== undefined) updates.requireHumanReview = requireHumanReview;
    if (spamKeywords !== undefined) updates.spamKeywords = spamKeywords;
    if (customRules !== undefined) updates.customRules = customRules;
    
    const settings = await updateAISettings(updates, adminId);
    res.json({ success: true, settings });
  } catch (error) {
    console.error('Update AI settings error:', error);
    res.status(500).json({ success: false, message: 'Failed to update AI settings' });
  }
});

// ============ AI MODERATION LOGS ============

// GET /api/admin/ai-moderation/logs - List moderation logs
router.get('/logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, detectedType, action, reviewed } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {};
    if (detectedType) where.detectedType = detectedType;
    if (action) where.action = action;
    if (reviewed !== undefined) where.reviewedByHuman = reviewed === 'true';
    
    const [logs, total] = await Promise.all([
      prisma.aIModerationLog.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, username: true } }
        }
      }),
      prisma.aIModerationLog.count({ where })
    ]);
    
    res.json({ success: true, logs, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error('Get moderation logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch logs' });
  }
});

// GET /api/admin/ai-moderation/logs/:id - Get single log
router.get('/logs/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const log = await prisma.aIModerationLog.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, username: true } }
      }
    });
    
    if (!log) {
      return res.status(404).json({ success: false, message: 'Log not found' });
    }
    
    res.json({ success: true, log });
  } catch (error) {
    console.error('Get moderation log error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch log' });
  }
});

// POST /api/admin/ai-moderation/logs/:id/review - Review flagged content (override AI decision)
router.post('/logs/:id/review', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { decision, note } = req.body;
    const adminId = req.user.id;
    
    const log = await prisma.aIModerationLog.update({
      where: { id },
      data: {
        reviewedByHuman: true,
        humanReviewerId: adminId,
        humanDecision: decision,
        humanNote: note,
        action: decision === 'allow' ? 'allowed' : decision === 'block' ? 'blocked' : 'hidden'
      }
    });
    
    // Update the actual content based on decision
    if (log.contentType === 'post' && log.contentId) {
      if (decision === 'allow') {
        await prisma.post.update({
          where: { id: log.contentId },
          data: { status: 'published', isActive: true, isHidden: false, moderationReason: null }
        });
      } else if (decision === 'block') {
        await prisma.post.update({
          where: { id: log.contentId },
          data: { status: 'blocked', isActive: false, moderationReason: note || 'Blocked by admin review' }
        });
      }
    }
    
    res.json({ success: true, log });
  } catch (error) {
    console.error('Review moderation log error:', error);
    res.status(500).json({ success: false, message: 'Failed to review log' });
  }
});

// ============ AI MODERATION STATISTICS ============

// GET /api/admin/ai-moderation/stats - Get moderation statistics
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const stats = await getModerationStats(parseInt(days));
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Get moderation stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// ============ TEST ENDPOINT ============

// POST /api/admin/ai-moderation/test - Test content against AI rules
router.post('/test', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { content } = req.body;
    const settings = await getAISettings();
    const { detectContentType, getAction } = await import('../../services/aiModerationService.js');
    
    const detections = detectContentType(content);
    const results = detections.map(detection => ({
      ...detection,
      action: getAction(detection, settings)
    }));
    
    res.json({ success: true, results, settings });
  } catch (error) {
    console.error('Test AI moderation error:', error);
    res.status(500).json({ success: false, message: 'Failed to test content' });
  }
});

// ============ DETECTION TYPES ============

// GET /api/admin/ai-moderation/detection-types - Get available detection types
router.get('/detection-types', authenticateToken, requireAdmin, async (req, res) => {
  const detectionTypes = [
    { value: 'spam', label: 'Spam', defaultAction: 'auto', defaultThreshold: 70 },
    { value: 'adult', label: 'Adult Content', defaultAction: 'flag', defaultThreshold: 80 },
    { value: 'violence', label: 'Violence', defaultAction: 'flag', defaultThreshold: 85 },
    { value: 'hate_speech', label: 'Hate Speech', defaultAction: 'flag', defaultThreshold: 85 }
  ];
  res.json({ success: true, detectionTypes });
});

// ============ ADVANCED LOGS & ANALYTICS (FUTURE 7B) ============

// GET /api/admin/ai-moderation/logs/advanced - Get logs with advanced filters
router.get('/logs/advanced', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      page = 1, limit = 50,
      detectedType, action, reviewedByHuman,
      userId, contentId, source,
      startDate, endDate
    } = req.query;
    
    const filters = {
      detectedType, action, reviewedByHuman,
      userId, contentId, source,
      startDate, endDate
    };
    
    const result = await getModerationLogs(filters, parseInt(page), parseInt(limit));
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Get advanced logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch logs' });
  }
});

// GET /api/admin/ai-moderation/analytics/detailed - Get detailed analytics
router.get('/analytics/detailed', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const analytics = await getDetailedModerationStats(parseInt(days));
    res.json({ success: true, analytics });
  } catch (error) {
    console.error('Get detailed analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics' });
  }
});

// GET /api/admin/ai-moderation/export - Export logs as CSV
router.get('/export', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const {
      detectedType, action, reviewedByHuman,
      userId, startDate, endDate
    } = req.query;
    
    const filters = { detectedType, action, reviewedByHuman, userId, startDate, endDate };
    const csv = await exportModerationLogs(filters);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=ai-moderation-logs-${new Date().toISOString().split('T')[0]}.csv`);
    res.send(csv);
  } catch (error) {
    console.error('Export logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to export logs' });
  }
});

// GET /api/admin/ai-moderation/pending-reviews - Get pending review queue
router.get('/pending-reviews', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const result = await getModerationLogs(
      { action: 'flagged', reviewedByHuman: 'false' },
      parseInt(page),
      parseInt(limit)
    );
    
    // Get content details for each pending review
    const pendingWithDetails = await Promise.all(
      result.logs.map(async (log) => {
        let content = null;
        if (log.contentType === 'post' && log.contentId) {
          content = await prisma.post.findUnique({
            where: { id: log.contentId },
            select: { id: true, title: true, content: true, creatorId: true }
          });
        }
        return { ...log, content };
      })
    );
    
    res.json({ 
      success: true, 
      logs: pendingWithDetails, 
      total: result.total, 
      page: result.page, 
      limit: result.limit 
    });
  } catch (error) {
    console.error('Get pending reviews error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch pending reviews' });
  }
});

// POST /api/admin/ai-moderation/bulk-review - Bulk review multiple flagged items
router.post('/bulk-review', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { logIds, decision, note } = req.body;
    const adminId = req.user.id;
    
    if (!logIds || !Array.isArray(logIds) || logIds.length === 0) {
      return res.status(400).json({ success: false, message: 'logIds array is required' });
    }
    
    const results = [];
    for (const logId of logIds) {
      try {
        const result = await reviewModerationLog(logId, decision, note, adminId);
        results.push({ id: logId, success: true });
      } catch (error) {
        results.push({ id: logId, success: false, error: error.message });
      }
    }
    
    res.json({ success: true, results, processed: results.length });
  } catch (error) {
    console.error('Bulk review error:', error);
    res.status(500).json({ success: false, message: 'Failed to process bulk review' });
  }
});

export default router;
