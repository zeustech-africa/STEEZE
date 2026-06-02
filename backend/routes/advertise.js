import express from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// CPM pricing by placement
const CPM_PRICING = {
  feed_standard: { min: 300, max: 500, recommended: 400 },
  feed_premium: { min: 600, max: 1000, recommended: 800 },
  video_short: { min: 500, max: 800, recommended: 600 },
  video_premium: { min: 1000, max: 1500, recommended: 1200 },
  explore: { min: 400, max: 700, recommended: 500 },
  trending: { min: 800, max: 1200, recommended: 1000 },
  homepage_hero: { min: 1500, max: 3000, recommended: 2000 }
};

// POST /api/advertise/apply - Submit unified application
router.post('/advertise/apply', [
  body('advertiser.companyName').notEmpty().withMessage('Company name required'),
  body('advertiser.email').isEmail().withMessage('Valid email required'),
  body('advertiser.password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('campaign.name').notEmpty().withMessage('Campaign name required'),
  body('campaign.placement').notEmpty().withMessage('Placement required'),
  body('campaign.cpm').isInt({ min: 100, max: 5000 }).withMessage('CPM must be between $1 and $50'),
  body('campaign.budget').isInt({ min: 1000 }).withMessage('Minimum budget is $10'),
  body('campaign.mediaUrl').isURL().withMessage('Valid media URL required'),
  body('campaign.destinationUrl').isURL().withMessage('Valid destination URL required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { advertiser, campaign } = req.body;

  try {
    // Check if email already exists
    const existing = await prisma.advertiser.findUnique({
      where: { email: advertiser.email }
    });

    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(advertiser.password, 12);

    // Create unified application
    const application = await prisma.adApplication.create({
      data: {
        companyName: advertiser.companyName,
        email: advertiser.email,
        password: hashedPassword,
        taxId: advertiser.taxId,
        phone: advertiser.phone,
        address: advertiser.address,
        website: advertiser.website,
        campaignName: campaign.name,
        campaignDescription: campaign.description,
        placement: campaign.placement,
        cpm: campaign.cpm,
        budget: campaign.budget,
        mediaUrl: campaign.mediaUrl,
        mediaType: campaign.mediaType || 'image',
        destinationUrl: campaign.destinationUrl,
        countries: campaign.countries || [],
        interests: campaign.interests || [],
        ageRange: campaign.ageRange || {},
        startDate: campaign.startDate ? new Date(campaign.startDate) : null,
        endDate: campaign.endDate ? new Date(campaign.endDate) : null,
        status: 'pending'
      }
    });

    res.status(201).json({
      success: true,
      applicationId: application.id,
      message: 'Application submitted for review'
    });
  } catch (error) {
    console.error('Application error:', error);
    res.status(500).json({ error: 'Failed to submit application' });
  }
});

// GET /api/advertise/application/:id/status - Check application status
router.get('/advertise/application/:id/status', async (req, res) => {
  const { id } = req.params;

  try {
    const application = await prisma.adApplication.findUnique({
      where: { id },
      select: { status: true, rejectionReason: true }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({
      status: application.status,
      rejectionReason: application.rejectionReason
    });
  } catch (error) {
    console.error('Status error:', error);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// Admin: GET /api/admin/ad-applications - Get all applications
router.get('/admin/ad-applications', authenticateToken, requireAdmin, async (req, res) => {
  const { status, limit = 50, offset = 0 } = req.query;
  const where = status ? { status } : {};

  try {
    const [applications, total] = await Promise.all([
      prisma.adApplication.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: Math.min(100, parseInt(limit)),
        skip: parseInt(offset)
      }),
      prisma.adApplication.count({ where })
    ]);

    res.json({ success: true, applications, total, hasMore: parseInt(offset) + applications.length < total });
  } catch (error) {
    console.error('Get applications error:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// Admin: GET /api/admin/ad-applications/:id - Get single application
router.get('/admin/ad-applications/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const application = await prisma.adApplication.findUnique({
      where: { id }
    });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    res.json({ success: true, application });
  } catch (error) {
    console.error('Get application error:', error);
    res.status(500).json({ error: 'Failed to fetch application' });
  }
});

// Admin: POST /api/admin/ad-applications/:id/approve - Approve application
router.post('/admin/ad-applications/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const adminId = req.user.id;

  try {
    const application = await prisma.adApplication.findUnique({ where: { id } });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ error: `Cannot approve application with status: ${application.status}` });
    }

    // Create advertiser account
    const advertiser = await prisma.advertiser.create({
      data: {
        email: application.email,
        password: application.password,
        companyName: application.companyName,
        taxId: application.taxId,
        phone: application.phone,
        address: application.address,
        website: application.website,
        status: 'approved',
        approvedBy: adminId,
        approvedAt: new Date()
      }
    });

    // Create campaign
    const campaign = await prisma.campaign.create({
      data: {
        advertiserId: advertiser.id,
        name: application.campaignName,
        description: application.campaignDescription,
        placement: application.placement,
        cpm: application.cpm,
        budget: application.budget,
        remainingBudget: application.budget,
        mediaUrl: application.mediaUrl,
        mediaType: application.mediaType || 'image',
        destinationUrl: application.destinationUrl,
        countries: application.countries,
        interests: application.interests,
        ageRange: application.ageRange,
        startDate: application.startDate,
        endDate: application.endDate,
        status: 'approved'
      }
    });

    // Update application
    await prisma.adApplication.update({
      where: { id },
      data: {
        status: 'approved',
        approvedAt: new Date(),
        advertiserId: advertiser.id,
        campaignId: campaign.id
      }
    });

    res.json({ success: true, message: 'Application approved', advertiserId: advertiser.id, campaignId: campaign.id });
  } catch (error) {
    console.error('Approve error:', error);
    res.status(500).json({ error: 'Failed to approve application' });
  }
});

// Admin: POST /api/admin/ad-applications/:id/reject - Reject application
router.post('/admin/ad-applications/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  if (!reason) {
    return res.status(400).json({ error: 'Rejection reason required' });
  }

  try {
    const application = await prisma.adApplication.findUnique({ where: { id } });

    if (!application) {
      return res.status(404).json({ error: 'Application not found' });
    }

    if (application.status !== 'pending') {
      return res.status(400).json({ error: `Cannot reject application with status: ${application.status}` });
    }

    await prisma.adApplication.update({
      where: { id },
      data: {
        status: 'rejected',
        rejectionReason: reason,
        rejectedAt: new Date()
      }
    });

    res.json({ success: true, message: 'Application rejected' });
  } catch (error) {
    console.error('Reject error:', error);
    res.status(500).json({ error: 'Failed to reject application' });
  }
});

// Helper exports
export { CPM_PRICING };

export default router;