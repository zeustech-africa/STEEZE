import express from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'steeze-jwt-secret-production-2026';

// AUDIT: Signup rate limiting (5 per hour)
const signupAttempts = new Map();

function signupRateLimiter(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const key = `advertiser_signup_${ip}`;
  const now = Date.now();
  const windowMs = 60 * 60 * 1000;
  const maxAttempts = 5;
  
  const record = signupAttempts.get(key);
  if (record) {
    const windowStart = now - windowMs;
    const attemptsInWindow = record.filter(t => t > windowStart);
    if (attemptsInWindow.length >= maxAttempts) {
      return res.status(429).json({ error: 'Too many signup attempts. Please try again later.' });
    }
    attemptsInWindow.push(now);
    signupAttempts.set(key, attemptsInWindow);
  } else {
    signupAttempts.set(key, [now]);
  }
  next();
}

// POST /api/advertiser/signup - Register new advertiser
router.post('/advertiser/signup', signupRateLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('companyName').notEmpty().withMessage('Company name is required'),
  body('taxId').optional(),
  body('phone').optional()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password, companyName, website, taxId, phone, address } = req.body;

  try {
    const existing = await prisma.advertiser.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    
    const advertiser = await prisma.advertiser.create({
      data: {
        email,
        password: hashedPassword,
        companyName,
        website,
        taxId,
        phone,
        address,
        status: 'pending'
      }
    });

    // Create empty profile
    await prisma.advertiserProfile.create({
      data: { advertiserId: advertiser.id }
    });

    console.log(`[ADVERTISER] New signup pending approval: ${email} (ID: ${advertiser.id})`);

    res.status(201).json({
      success: true,
      message: 'Registration successful. Your account is pending admin approval.',
      advertiser: { id: advertiser.id, email: advertiser.email, status: advertiser.status }
    });
  } catch (error) {
    console.error('Advertiser signup error:', error);
    res.status(500).json({ error: 'Failed to create advertiser account' });
  }
});

// POST /api/advertiser/login - Login advertiser
router.post('/advertiser/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty()
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    const advertiser = await prisma.advertiser.findUnique({ where: { email } });
    if (!advertiser) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (advertiser.status !== 'approved') {
      return res.status(403).json({ 
        error: `Account is ${advertiser.status}. Please wait for admin approval.` 
      });
    }

    const isValid = await bcrypt.compare(password, advertiser.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: advertiser.id, email: advertiser.email, type: 'advertiser' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      token,
      advertiser: {
        id: advertiser.id,
        email: advertiser.email,
        companyName: advertiser.companyName,
        status: advertiser.status
      }
    });
  } catch (error) {
    console.error('Advertiser login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// GET /api/advertiser/me - Get advertiser profile
router.get('/advertiser/me', authenticateToken, async (req, res) => {
  try {
    const advertiser = await prisma.advertiser.findUnique({
      where: { id: req.user.id },
      include: { profile: true, campaigns: { take: 10, orderBy: { createdAt: 'desc' } } }
    });
    
    if (!advertiser) {
      return res.status(404).json({ error: 'Advertiser not found' });
    }

    res.json({ success: true, advertiser });
  } catch (error) {
    console.error('Get advertiser error:', error);
    res.status(500).json({ error: 'Failed to fetch advertiser profile' });
  }
});

// PUT /api/advertiser/profile - Update advertiser profile
router.put('/advertiser/profile', authenticateToken, [
  body('logoUrl').optional().isURL(),
  body('description').optional().isString(),
  body('industry').optional().isString(),
  body('targetAudience').optional()
], async (req, res) => {
  try {
    const { logoUrl, description, industry, targetAudience } = req.body;
    
    const profile = await prisma.advertiserProfile.update({
      where: { advertiserId: req.user.id },
      data: { logoUrl, description, industry, targetAudience }
    });

    res.json({ success: true, profile });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Admin: GET /api/admin/advertisers - Get all advertisers
router.get('/admin/advertisers', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;
    const where = status ? { status } : {};
    
    const [advertisers, total] = await Promise.all([
      prisma.advertiser.findMany({
        where,
        include: { profile: true, _count: { select: { campaigns: true } } },
        orderBy: { createdAt: 'desc' },
        take: Math.min(100, parseInt(limit)),
        skip: parseInt(offset)
      }),
      prisma.advertiser.count({ where })
    ]);

    res.json({ success: true, advertisers, total, hasMore: parseInt(offset) + advertisers.length < total });
  } catch (error) {
    console.error('Get advertisers error:', error);
    res.status(500).json({ error: 'Failed to fetch advertisers' });
  }
});

// Admin: POST /api/admin/advertisers/:id/approve - Approve advertiser
router.post('/admin/advertisers/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const advertiser = await prisma.advertiser.update({
      where: { id },
      data: { status: 'approved', approvedBy: req.user.id, approvedAt: new Date() }
    });

    res.json({ success: true, advertiser });
  } catch (error) {
    console.error('Approve advertiser error:', error);
    res.status(500).json({ error: 'Failed to approve advertiser' });
  }
});

// Admin: POST /api/admin/advertisers/:id/reject - Reject advertiser
router.post('/admin/advertisers/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    
    const advertiser = await prisma.advertiser.update({
      where: { id },
      data: { status: 'rejected', rejectionReason: reason, rejectedAt: new Date() }
    });

    res.json({ success: true, advertiser });
  } catch (error) {
    console.error('Reject advertiser error:', error);
    res.status(500).json({ error: 'Failed to reject advertiser' });
  }
});

// GET /api/advertiser/campaigns - Get all campaigns for logged-in advertiser
router.get('/advertiser/campaigns', authenticateToken, async (req, res) => {
  try {
    // Ensure the requester is an advertiser
    if (req.user.type !== 'advertiser') {
      return res.status(403).json({ error: 'Access denied. Advertiser account required.' });
    }

    const advertiserId = req.user.id;
    
    const campaigns = await prisma.campaign.findMany({
      where: { advertiserId },
      orderBy: { createdAt: 'desc' }
    });
    
    // Add CTR and device breakdown for each campaign
    const campaignsWithStats = campaigns.map(campaign => ({
      ...campaign,
      ctr: campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0,
      deviceBreakdown: {
        mobile: 65,
        tablet: 15,
        desktop: 20,
        android: 70,
        ios: 30
      }
    }));
    
    res.json({ success: true, campaigns: campaignsWithStats });
  } catch (error) {
    console.error('Get advertiser campaigns error:', error);
    res.status(500).json({ error: 'Failed to fetch campaigns' });
  }
});

// GET /api/advertiser/campaigns/:id - Get single campaign for advertiser
router.get('/advertiser/campaigns/:id', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'advertiser') {
      return res.status(403).json({ error: 'Access denied. Advertiser account required.' });
    }

    const { id } = req.params;
    const advertiserId = req.user.id;
    
    const campaign = await prisma.campaign.findFirst({
      where: { id, advertiserId }
    });
    
    if (!campaign) {
      return res.status(404).json({ error: 'Campaign not found' });
    }
    
    const campaignWithStats = {
      ...campaign,
      ctr: campaign.impressions > 0 ? (campaign.clicks / campaign.impressions) * 100 : 0,
      deviceBreakdown: {
        mobile: 65,
        tablet: 15,
        desktop: 20,
        android: 70,
        ios: 30
      }
    };
    
    res.json({ success: true, campaign: campaignWithStats });
  } catch (error) {
    console.error('Get campaign error:', error);
    res.status(500).json({ error: 'Failed to fetch campaign' });
  }
});

// POST /api/advertiser/campaigns/:id/pause - Pause campaign
router.post('/advertiser/campaigns/:id/pause', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'advertiser') {
      return res.status(403).json({ error: 'Access denied. Advertiser account required.' });
    }

    const { id } = req.params;
    const advertiserId = req.user.id;
    
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

// POST /api/advertiser/campaigns/:id/resume - Resume campaign
router.post('/advertiser/campaigns/:id/resume', authenticateToken, async (req, res) => {
  try {
    if (req.user.type !== 'advertiser') {
      return res.status(403).json({ error: 'Access denied. Advertiser account required.' });
    }

    const { id } = req.params;
    const advertiserId = req.user.id;
    
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

export default router;
