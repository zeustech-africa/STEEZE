import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin, requireSuperAdmin } from '../../middleware/auth.js';
import { checkNewContent, getAutomationStats } from '../../services/automationEngine.js';

const router = express.Router();
const prisma = new PrismaClient();

// ============ AUTOMATION RULES ============

// GET /api/admin/automation/rules - List all automation rules
router.get('/rules', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const rules = await prisma.automationRule.findMany({
      orderBy: { priority: 'desc' }
    });
    res.json({ success: true, rules });
  } catch (error) {
    console.error('Get automation rules error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch automation rules' });
  }
});

// POST /api/admin/automation/rules - Create new automation rule
router.post('/rules', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { name, description, triggerType, condition, action, actionParams, priority, isActive } = req.body;
    
    const rule = await prisma.automationRule.create({
      data: {
        name,
        description,
        triggerType,
        condition: condition || {},
        action,
        actionParams: actionParams || {},
        priority: priority || 0,
        isActive: isActive !== undefined ? isActive : true
      }
    });
    
    res.json({ success: true, rule });
  } catch (error) {
    console.error('Create automation rule error:', error);
    res.status(500).json({ success: false, message: 'Failed to create automation rule' });
  }
});

// PUT /api/admin/automation/rules/:id - Update automation rule
router.put('/rules/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, triggerType, condition, action, actionParams, priority, isActive } = req.body;
    
    const rule = await prisma.automationRule.update({
      where: { id },
      data: {
        name,
        description,
        triggerType,
        condition,
        action,
        actionParams,
        priority,
        isActive,
        updatedAt: new Date()
      }
    });
    
    res.json({ success: true, rule });
  } catch (error) {
    console.error('Update automation rule error:', error);
    res.status(500).json({ success: false, message: 'Failed to update automation rule' });
  }
});

// DELETE /api/admin/automation/rules/:id - Delete automation rule
router.delete('/rules/:id', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.automationRule.delete({ where: { id } });
    res.json({ success: true, message: 'Rule deleted' });
  } catch (error) {
    console.error('Delete automation rule error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete automation rule' });
  }
});

// ============ AUTOMATION LOGS ============

// GET /api/admin/automation/logs - Get automation logs
router.get('/logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, ruleId, status } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {};
    if (ruleId) where.ruleId = ruleId;
    if (status) where.status = status;
    
    const [logs, total] = await Promise.all([
      prisma.automationLog.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.automationLog.count({ where })
    ]);
    
    res.json({ success: true, logs, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error('Get automation logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch automation logs' });
  }
});

// ============ FLAGGED CONTENT ============

// GET /api/admin/automation/flagged - Get flagged content
router.get('/flagged', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { resolved, page = 1, limit = 50 } = req.query;
    const where = {};
    if (resolved !== undefined) where.resolved = resolved === 'true';
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const [flagged, total] = await Promise.all([
      prisma.flaggedContent.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.flaggedContent.count({ where })
    ]);
    
    res.json({ success: true, flagged, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error('Get flagged content error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch flagged content' });
  }
});

// POST /api/admin/automation/flagged/:id/resolve - Resolve flagged content
router.post('/flagged/:id/resolve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;
    
    const flagged = await prisma.flaggedContent.update({
      where: { id },
      data: {
        resolved: true,
        resolvedBy: adminId,
        resolvedAt: new Date()
      }
    });
    
    res.json({ success: true, flagged });
  } catch (error) {
    console.error('Resolve flagged content error:', error);
    res.status(500).json({ success: false, message: 'Failed to resolve flagged content' });
  }
});

// ============ AUTOMATION STATISTICS ============

// GET /api/admin/automation/stats - Get automation statistics
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const stats = await getAutomationStats(parseInt(days));
    res.json({ success: true, stats, days: parseInt(days) });
  } catch (error) {
    console.error('Get automation stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch automation stats' });
  }
});

// POST /api/admin/automation/check - Manually trigger content check (for testing)
router.post('/check', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { content, contentType, contentId, userId } = req.body;
    const results = await checkNewContent(content, contentType, contentId, userId);
    res.json({ success: true, results });
  } catch (error) {
    console.error('Manual content check error:', error);
    res.status(500).json({ success: false, message: 'Failed to check content' });
  }
});

// SEED default automation rules
router.post('/seed', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const defaultRules = [
      {
        name: 'Auto Remove Spam',
        description: 'Automatically remove posts containing spam keywords',
        triggerType: 'spam_detected',
        condition: { spamThreshold: 0.7 },
        action: 'remove_post',
        priority: 100,
        isActive: true
      },
      {
        name: 'Auto Hide Offensive Comments',
        description: 'Automatically hide comments with offensive language',
        triggerType: 'offensive_content',
        condition: { offensiveThreshold: 0.6 },
        action: 'hide_comment',
        priority: 90,
        isActive: true
      },
      {
        name: 'Auto Flag Duplicate Uploads',
        description: 'Flag duplicate content from same user',
        triggerType: 'duplicate_upload',
        action: 'flag_content',
        priority: 80,
        isActive: true
      },
      {
        name: 'Auto Suspend High-Risk Accounts',
        description: 'Automatically suspend accounts with high risk scores',
        triggerType: 'high_risk_score',
        condition: { riskThreshold: 70 },
        action: 'suspend_account',
        actionParams: { suspensionHours: 24 },
        priority: 70,
        isActive: true
      },
      {
        name: 'Auto Escalate Repeat Offenders',
        description: 'Escalate users with multiple violations for admin review',
        triggerType: 'repeat_offender',
        condition: { violationThreshold: 3 },
        action: 'escalate',
        priority: 60,
        isActive: true
      }
    ];
    
    for (const rule of defaultRules) {
      await prisma.automationRule.upsert({
        where: { name: rule.name },
        update: rule,
        create: rule
      });
    }
    
    res.json({ success: true, message: 'Default automation rules seeded' });
  } catch (error) {
    console.error('Seed automation rules error:', error);
    res.status(500).json({ success: false, message: 'Failed to seed automation rules' });
  }
});

export default router;