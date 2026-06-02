import express from 'express';
import { PrismaClient } from '@prisma/client';
import { body, validationResult, param } from 'express-validator';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// CPM pricing by placement
const CPM_PRICING = {
  feed_standard: { min: 300, max: 500, recommended: 400 },      // $3-$5
  feed_premium: { min: 600, max: 1000, recommended: 800 },      // $6-$10
  video_short: { min: 500, max: 800, recommended: 600 },        // $5-$8
  video_premium: { min: 1000, max: 1500, recommended: 1200 },   // $10-$15
  explore: { min: 400, max: 700, recommended: 500 },            // $4-$7
  trending: { min: 800, max: 1200, recommended: 1000 },         // $8-$12
  homepage_hero: { min: 1500, max: 3000, recommended: 2000 }    // $15-$30
};

// Helper: Calculate estimated impressions
function calculateEstimatedImpressions(budgetCents, cpmCents) {
  return Math.floor((budgetCents / cpmCents) * 1000);
}

// Helper: Validate CPM for placement
function validateCpmForPlacement(placement, cpmCents) {
  const pricing = CPM_PRICING[placement];
  if (!pricing) return false;
  return cpmCents >= pricing.min && cpmCents <= pricing.max;
}

// GET /api/campaign/pricing - Get CPM pricing for placements
router.get('/campaign/pricing', async (req, res) => {
  res.json({
    success: true,
    pricing: CPM_PRICING
  });
});

// POST /api/campaign - Create new campaign
router.post('/campaign', authenticateToken, [
  body('name').notEmpty().withMessage('Campaign name required'),
  body('placement').isIn(Object.keys(CPM_PRICING)).withMessage('Invalid placement'),
  body('cpm').isInt({ min: 100, max: 5000 }).withMessage('CPM must be between $1 and $50'),
  body('budget').isInt({ min: 1000 }).withMessage('Minimum budget is $10'),
  body('mediaUrl').isURL().withMessage('Valid media URL required'),
  body('destinationUrl').isURL().withMessage('Valid destination URL required'),
  body('countries').optional(),
  body('interests').optional(),
  body('ageRange').optional(),
  body('startDate').optional().isISO8601(),
  body('endDate').optional().isISO8601()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const advertiserId = req.user.id;
  const { 
    name, description, placement, cpm, budget, 
    mediaUrl, mediaType, destinationUrl,
    countries, interests, ageRange,
    startDate, endDate
  } = req.body;

  try {
    // Check if advertiser is approved
    const advertiser = await prisma.advertiser.findUnique({
      where: { id: advertiserId },
      select: { status: true }
    });

    if (!advertiser || advertiser.status !== 'approved') {
      return res.status(403).json({ error: 'Your advertiser account must be approved before creating campaigns' });
    }

    // Validate CPM for placement
    if (!validateCpmForPlacement(placement, cpm)) {
      const pricing = CPM_PRICING[placement];
      return res.status(400).json({ 
        error: `CPM must be between $${pricing.min/100} and $${pricing.max/100} for this placement` 
      });
    }

    const estimatedImpressions = calculateEstimatedImpressions(budget, cpm);
    const remainingBudget = budget;

    const campaign = await prisma.campaign.create({
      data: {
        advertiserId,
        name,
        description,
        placement,
        cpm,
        budget,
        remainingBudget,
        mediaUrl,
        mediaType: mediaType || 'image',
        destinationUrl,
        countries: countries || [],
        interests: interests || [],
        ageRange: ageRange || {},
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        status: 'draft'
      }
    });

    res.status(201).json({
      success: true,
      campaign,
      estimatedImpressions,
      message: 'Campaign created as draft. Submit for review to start.'
    });
  } catch (error) {
    console.error('Create campaign error:', error);
    res.status(500).json({ error: 'Failed to create campaign' });
  }
});

// PUT /api/campaign/:id - Update campaign (only draft status)
router.put('/campaign/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const advertiserId = req.user.id;

  try {
    const campaign = await prisma.campaign.findFirst({
      where: { id, advertiserId }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft campaigns can be edited' });
    }

    const { name, description, cpm, budget, mediaUrl, destinationUrl, countries, interests, ageRange, startDate, endDate } = req.body;

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        name: name || campaign.name,
        description: description !== undefined ? description : campaign.description,
        cpm: cpm || campaign.cpm,
        budget: budget || campaign.budget,
        mediaUrl: mediaUrl || campaign.mediaUrl,
        destinationUrl: destinationUrl || campaign.destinationUrl,
        countries: countries || campaign.countries,
        interests: interests || campaign.interests,
        ageRange: ageRange || campaign.ageRange,
        startDate: startDate ? new Date(startDate) : campaign.startDate,
        endDate: endDate ? new Date(endDate) : campaign.endDate,
        remainingBudget: budget || campaign.budget
      }
    });

    res.json({ success: true, campaign: updated });
  } catch (error) {
    console.error('Update campaign error:', error);
    res.status(500).json({ error: 'Failed to update campaign' });
  }
});

// POST /api/campaign/:id/submit - Submit campaign for admin review
router.post('/campaign/:id/submit', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const advertiserId = req.user.id;

  try {
    const campaign = await prisma.campaign.findFirst({
      where: { id, advertiserId }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== 'draft') {
      return res.status(400).json({ error: `Cannot submit campaign with status: ${campaign.status}` });
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: { status: 'pending_review' }
    });

    res.json({ success: true, campaign: updated, message: 'Campaign submitted for admin review' });
  } catch (error) {
    console.error('Submit campaign error:', error);
    res.status(500).json({ error: 'Failed to submit campaign' });
  }
});

// GET /api/campaign - Get advertiser's campaigns
router.get('/campaign', authenticateToken, async (req, res) => {
  const advertiserId = req.user.id;
  const { limit = 50, offset = 0, status } = req.query;

  try {
    const where = { advertiserId };
    if (status) where.status = status;

    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(100, parseInt(limit)),
        skip: parseInt(offset)
      }),
      prisma.campaign.count({ where })
    ]);

    res.json({
      success: true,
      campaigns,
      total,
      hasMore: parseInt(offset) + campaigns.length < total
    });
  } catch (error) {
    console.error('Get campaigns error:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// GET /api/campaign/:id - Get single campaign
router.get('/campaign/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const advertiserId = req.user.id;

  try {
    const campaign = await prisma.campaign.findFirst({
      where: { id, advertiserId }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ success: true, campaign });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// POST /api/campaign/:id/pause - Pause active campaign
router.post('/campaign/:id/pause', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const advertiserId = req.user.id;

  try {
    const campaign = await prisma.campaign.findFirst({
      where: { id, advertiserId }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== 'active') {
      return res.status(400).json({ error: 'Only active campaigns can be paused' });
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: { status: 'paused' }
    });

    res.json({ success: true, campaign: updated });
  } catch (error) {
    console.error('Pause campaign error:', error);
    res.status(500).json({ error: 'Failed to pause campaign' });
  }
});

// POST /api/campaign/:id/resume - Resume paused campaign
router.post('/campaign/:id/resume', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const advertiserId = req.user.id;

  try {
    const campaign = await prisma.campaign.findFirst({
      where: { id, advertiserId }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== 'paused') {
      return res.status(400).json({ error: 'Only paused campaigns can be resumed' });
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: { status: 'active' }
    });

    res.json({ success: true, campaign: updated });
  } catch (error) {
    console.error('Resume campaign error:', error);
    res.status(500).json({ error: 'Failed to resume campaign' });
  }
});

// Admin: GET /api/admin/campaigns - Get all campaigns
router.get('/admin/campaigns', authenticateToken, requireAdmin, async (req, res) => {
  const { status, limit = 50, offset = 0, search } = req.query;
  const where = {};
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { advertiser: { companyName: { contains: search, mode: 'insensitive' } } },
      { advertiser: { email: { contains: search, mode: 'insensitive' } } }
    ];
  }

  try {
    const [campaigns, total] = await Promise.all([
      prisma.campaign.findMany({
        where,
        include: { advertiser: { select: { id: true, email: true, companyName: true } } },
        orderBy: { createdAt: 'desc' },
        take: Math.min(100, parseInt(limit)),
        skip: parseInt(offset)
      }),
      prisma.campaign.count({ where })
    ]);

    res.json({ success: true, campaigns, total, hasMore: parseInt(offset) + campaigns.length < total });
  } catch (error) {
    console.error('Admin get campaigns error:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// Admin: POST /api/admin/campaigns/:id/approve - Approve campaign
router.post('/admin/campaigns/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;

  try {
    const campaign = await prisma.campaign.findUnique({ where: { id } });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== 'pending_review') {
      return res.status(400).json({ error: `Cannot approve campaign with status: ${campaign.status}` });
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        status: 'approved',
        approvedBy: adminId,
        approvedAt: new Date(),
        reviewedBy: adminId,
        reviewedAt: new Date()
      }
    });

    res.json({ success: true, campaign: updated });
  } catch (error) {
    console.error('Approve campaign error:', error);
    res.status(500).json({ error: 'Failed to approve campaign' });
  }
});

// Admin: POST /api/admin/campaigns/:id/reject - Reject campaign
router.post('/admin/campaigns/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ error: 'Rejection reason required' });
  }

  try {
    const campaign = await prisma.campaign.findUnique({ where: { id } });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== 'pending_review') {
      return res.status(400).json({ error: `Cannot reject campaign with status: ${campaign.status}` });
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectionReason: reason,
        reviewedBy: adminId,
        reviewedAt: new Date()
      }
    });

    res.json({ success: true, campaign: updated });
  } catch (error) {
    console.error('Reject campaign error:', error);
    res.status(500).json({ error: 'Failed to reject campaign' });
  }
});

// Admin: GET /api/admin/campaigns/:id - Get single campaign for admin
router.get('/admin/campaigns/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const campaign = await prisma.campaign.findUnique({
      where: { id },
      include: { advertiser: { select: { id: true, email: true, companyName: true } } }
    });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.json({ success: true, campaign });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// Admin: POST /api/admin/campaigns/:id/suspend - Suspend active campaign
router.post('/admin/campaigns/:id/suspend', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ error: 'Suspension reason required' });
  }

  try {
    const campaign = await prisma.campaign.findUnique({ where: { id } });

    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    if (campaign.status !== 'active') {
      return res.status(400).json({ error: `Cannot suspend campaign with status: ${campaign.status}` });
    }

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        status: 'suspended',
        suspensionReason: reason,
        reviewedBy: adminId,
        reviewedAt: new Date()
      }
    });

    res.json({ success: true, campaign: updated });
  } catch (error) {
    console.error('Suspend campaign error:', error);
    res.status(500).json({ error: 'Failed to suspend campaign' });
  }
});

// Helper functions exported for use in other modules
export { CPM_PRICING, calculateEstimatedImpressions, validateCpmForPlacement };

export default router;
