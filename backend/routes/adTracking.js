import express from 'express';
import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';
import { recordImpression, recordClick, getCampaignAnalytics } from '../services/adServing.js';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/ad/track/impression - Track ad impression
router.post('/ad/track/impression', optionalAuth, async (req, res) => {
  try {
    const { campaignId, duration } = req.body;
    const userId = req.user?.id || null;
    const sessionId = req.headers['x-session-id'] || crypto.randomUUID();
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];

    if (!campaignId) {
      return res.status(400).json({ error: 'Campaign ID required' });
    }

    await recordImpression(campaignId, userId, sessionId, ipAddress, userAgent, duration || 0);

    res.json({ success: true });
  } catch (error) {
    console.error('Track impression error:', error);
    res.status(500).json({ error: 'Failed to track impression' });
  }
});

// POST /api/ad/track/click - Track ad click
router.post('/ad/track/click', optionalAuth, async (req, res) => {
  try {
    const { campaignId } = req.body;
    const userId = req.user?.id || null;
    const sessionId = req.headers['x-session-id'] || crypto.randomUUID();
    const ipAddress = req.ip || req.headers['x-forwarded-for'];
    const userAgent = req.headers['user-agent'];

    if (!campaignId) {
      return res.status(400).json({ error: 'Campaign ID required' });
    }

    await recordClick(campaignId, userId, sessionId, ipAddress, userAgent);

    // Get destination URL to redirect
    const campaign = await prisma.campaign.findUnique({
      where: { id: campaignId },
      select: { destinationUrl: true },
    });

    res.json({ success: true, destinationUrl: campaign?.destinationUrl });
  } catch (error) {
    console.error('Track click error:', error);
    res.status(500).json({ error: 'Failed to track click' });
  }
});

// GET /api/ad/campaign/:id/analytics - Get campaign analytics
router.get('/ad/campaign/:id/analytics', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const analytics = await getCampaignAnalytics(id);
    res.json({ success: true, ...analytics });
  } catch (error) {
    console.error('Get analytics error:', error);
    res.status(500).json({ error: 'Failed to get analytics' });
  }
});

// GET /api/ad/feed - Get active ads for feed placement
router.get('/ad/feed', optionalAuth, async (req, res) => {
  try {
    const placement = req.query.placement || 'feed_standard';
    const userId = req.user?.id || null;
    const country = req.query.country || null;

    const campaigns = await prisma.campaign.findMany({
      where: {
        status: 'active',
        placement,
        remainingBudget: { gt: 0 },
        OR: [
          { startDate: null },
          { startDate: { lte: new Date() } },
        ],
      },
      include: {
        advertiser: {
          select: { companyName: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    // Filter by country if needed
    let filtered = campaigns;
    if (country) {
      filtered = campaigns.filter((c) => {
        const countries = c.countries;
        return !countries || countries.length === 0 || countries.includes(country);
      });
    }

    res.json({ success: true, campaigns: filtered });
  } catch (error) {
    console.error('Fetch feed ads error:', error);
    res.status(500).json({ error: 'Failed to fetch ads' });
  }
});

export default router;