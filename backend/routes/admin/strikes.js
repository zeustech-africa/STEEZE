import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';
import { applyStrike, getStrikeHistory, getActiveStrikeCount, getUserRestrictionStatus } from '../../services/strikeSystem.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/admin/strikes/user/:userId - Get strike history for a user
router.get('/user/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const history = await getStrikeHistory(userId);
    const activeCount = await getActiveStrikeCount(userId);
    const restrictionStatus = await getUserRestrictionStatus(userId);
    
    res.json({ success: true, strikes: history, activeCount, restrictionStatus });
  } catch (error) {
    console.error('Get strike history error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch strike history' });
  }
});

// POST /api/admin/strikes/user/:userId - Apply strike to user
router.post('/user/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    if (!reason || reason.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Reason is required' });
    }

    const result = await applyStrike(userId, reason, adminId);
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Apply strike error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to apply strike' });
  }
});

// GET /api/admin/strikes/rules - Get strike rules
router.get('/rules', authenticateToken, requireAdmin, async (req, res) => {
  try {
    let rules = await prisma.strikeRule.findMany({
      orderBy: { strikeNumber: 'asc' }
    });
    
    if (rules.length === 0) {
      // Seed default rules if none exist
      const defaultRules = [
        { strikeNumber: 1, action: 'warning', durationHours: null, description: 'First violation - Warning' },
        { strikeNumber: 2, action: 'restriction_24h', durationHours: 24, description: 'Second violation - 24 hour restriction' },
        { strikeNumber: 3, action: 'restriction_7d', durationHours: 168, description: 'Third violation - 7 day restriction' },
        { strikeNumber: 4, action: 'monetization_removed', durationHours: null, description: 'Fourth violation - Monetization removed' },
        { strikeNumber: 5, action: 'permanent_ban', durationHours: null, description: 'Fifth violation - Permanent ban' }
      ];
      
      for (const rule of defaultRules) {
        await prisma.strikeRule.create({ data: rule });
      }
      rules = await prisma.strikeRule.findMany({ orderBy: { strikeNumber: 'asc' } });
    }
    
    res.json({ success: true, rules });
  } catch (error) {
    console.error('Get strike rules error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch strike rules' });
  }
});

// PUT /api/admin/strikes/rules/:strikeNumber - Update strike rule
router.put('/rules/:strikeNumber', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { strikeNumber } = req.params;
    const { action, durationHours, description, isActive } = req.body;
    
    const rule = await prisma.strikeRule.update({
      where: { strikeNumber: parseInt(strikeNumber) },
      data: { action, durationHours, description, isActive }
    });
    
    res.json({ success: true, rule });
  } catch (error) {
    console.error('Update strike rule error:', error);
    res.status(500).json({ success: false, message: 'Failed to update strike rule' });
  }
});

export default router;