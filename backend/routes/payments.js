import { Router } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';
import { authenticateAny as authenticate } from '../middleware/auth.js';

const router = Router();
const prisma = new PrismaClient();

// ============================================================
// F8. PAID POST PURCHASE
// ============================================================

// POST /api/payments/purchase-post
// Non-subscriber one-time payment to unlock a paid post
router.post('/purchase-post',
  authenticate,
  [
    body('postId').isString().withMessage('postId is required'),
    body('price').isNumeric().withMessage('Price must be numeric'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { postId, price } = req.body;
    const userId = req.user.id;

    try {
      // Verify post exists and is paid
      const post = await prisma.post.findUnique({
        where: { id: postId },
        select: { id: true, title: true, isFree: true, price: true, creatorId: true },
      });

      if (!post) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }

      if (post.isFree) {
        return res.status(400).json({ success: false, message: 'This post is free — no purchase needed' });
      }

      // Check if already purchased
      const existingPayment = await prisma.payment.findFirst({
        where: {
          userId,
          creatorId: post.creatorId,
          status: 'completed',
          createdAt: { gte: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000) },
        },
        orderBy: { createdAt: 'desc' },
      });

      if (existingPayment) {
        return res.json({ success: true, alreadyPurchased: true, message: 'Post already unlocked' });
      }

      const m_payment_id = `pp_${userId}_${postId}_${Date.now()}`;

      // Record payment in DB (pending)
      await prisma.payment.create({
        data: {
          userId,
          creatorId: post.creatorId,
          amount: parseFloat(price),
          tier: 'paid_post',
          payfastId: m_payment_id,
          status: 'pending',
        },
      });

      return res.json({
        success: true,
        paymentId: m_payment_id,
      });
    } catch (error) {
      console.error('Paid post purchase error:', error);
      return res.status(500).json({ success: false, message: 'Failed to initiate purchase' });
    }
  }
);

// ============================================================
// F6. PAYMENT HISTORY (USER-FACING)
// ============================================================

// GET /api/payments/history - Get current user's payment history
router.get('/history', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const { startDate, endDate } = req.query;

    const where = { userId };
    if (startDate && endDate) {
      where.createdAt = {
        gte: new Date(startDate),
        lte: new Date(endDate),
      };
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: { id: true, artistName: true, profilePicUrl: true },
        },
      },
    });

    return res.json({ success: true, payments });
  } catch (error) {
    console.error('Payment history error:', error);
    return res.status(500).json({ success: false, message: 'Failed to fetch payment history' });
  }
});

// GET /api/payments/history/receipt/:paymentId - Download receipt as JSON (PDF generator uses this)
router.get('/history/receipt/:paymentId', authenticate, async (req, res) => {
  try {
    const payment = await prisma.payment.findFirst({
      where: { id: req.params.paymentId, userId: req.user.id },
      include: {
        creator: { select: { artistName: true } },
      },
    });

    if (!payment) {
      return res.status(404).json({ success: false, message: 'Payment not found' });
    }

    // Return receipt data (frontend can generate PDF from this)
    return res.json({
      success: true,
      receipt: {
        receiptNumber: `STEEZE-RCPT-${payment.id.slice(0, 8).toUpperCase()}`,
        date: payment.createdAt,
        amount: payment.amount,
        tier: payment.tier,
        creator: payment.creator?.artistName || 'STEEZE',
        paymentRef: payment.payfastId || payment.id,
        status: payment.status,
      },
    });
  } catch (error) {
    console.error('Receipt error:', error);
    return res.status(500).json({ success: false, message: 'Failed to generate receipt' });
  }
});

// ============================================================
// F7. SUBSCRIPTION MANAGEMENT
// ============================================================

// GET /api/payments/subscription/status - check current subscription
router.get('/subscription/status', authenticate, async (req, res) => {
  try {
    const subscription = await prisma.subscription.findFirst({
      where: { userId: req.user.id, status: 'active' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        tier: true,
        price: true,
        createdAt: true,
        expiresAt: true,
        creatorId: true,
        status: true,
      },
    });

    return res.json({
      success: true,
      subscribed: !!subscription,
      subscription: subscription || null,
    });
  } catch (error) {
    console.error('Subscription status error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get subscription status' });
  }
});

// GET /api/payments/subscription/tiers - get available tiers
router.get('/subscription/tiers', (_req, res) => {
  return res.json({
    success: true,
    tiers: [
      { name: 'free', price: 0, features: ['listen', 'like', 'comment', 'save', 'ads'] },
      { name: 'basic', price: 50, features: ['download_free_posts', 'no_ads'] },
      { name: 'premium', price: 99, features: ['download_paid_posts', 'early_access'] },
      { name: 'gold', price: 199, features: ['dm_creators', 'request_video_calls'] },
    ],
  });
});

// GET /api/payments/subscription/has-access/:creatorId
router.get('/subscription/has-access/:creatorId', authenticate, async (req, res) => {
  try {
    const { creatorId } = req.params;
    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: req.user.id,
        status: 'active',
        OR: [
          { tier: 'gold' },
          { creatorId },
        ],
      },
    });

    return res.json({
      success: true,
      hasAccess: !!subscription,
      tier: subscription?.tier || null,
    });
  } catch (error) {
    console.error('Access check error:', error);
    return res.status(500).json({ success: false, message: 'Failed to check access' });
  }
});

// GET /api/payments/subscriptions - List all active subscriptions for user
router.get('/subscriptions', authenticate, async (req, res) => {
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      include: {
        creator: {
          select: { id: true, artistName: true, profilePicUrl: true },
        },
      },
    });

    return res.json({ success: true, subscriptions });
  } catch (error) {
    console.error('List subscriptions error:', error);
    return res.status(500).json({ success: false, message: 'Failed to list subscriptions' });
  }
});

// POST /api/payments/subscription/cancel - Cancel subscription
router.post('/subscription/cancel', authenticate, async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    if (!subscriptionId) {
      return res.status(400).json({ success: false, message: 'subscriptionId is required' });
    }

    const subscription = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId: req.user.id },
    });

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    if (subscription.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Subscription already cancelled' });
    }

    // Set status to cancelled and set end date (grace period to end of billing cycle)
    const endDate = subscription.expiresAt || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'cancelled',
        expiresAt: endDate,
      },
    });

    return res.json({
      success: true,
      message: 'Subscription cancelled',
      subscription: updated,
    });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    return res.status(500).json({ success: false, message: 'Failed to cancel subscription' });
  }
});

// POST /api/payments/subscription/reactivate - Reactivate cancelled subscription
router.post('/subscription/reactivate', authenticate, async (req, res) => {
  try {
    const { subscriptionId } = req.body;
    if (!subscriptionId) {
      return res.status(400).json({ success: false, message: 'subscriptionId is required' });
    }

    const subscription = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId: req.user.id },
    });

    if (!subscription) {
      return res.status(404).json({ success: false, message: 'Subscription not found' });
    }

    if (subscription.status !== 'cancelled') {
      return res.status(400).json({ success: false, message: 'Only cancelled subscriptions can be reactivated' });
    }

    const updated = await prisma.subscription.update({
      where: { id: subscriptionId },
      data: {
        status: 'active',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return res.json({
      success: true,
      message: 'Subscription reactivated',
      subscription: updated,
    });
  } catch (error) {
    console.error('Reactivate subscription error:', error);
    return res.status(500).json({ success: false, message: 'Failed to reactivate subscription' });
  }
});

// POST /api/payments/subscription/change-tier - Upgrade or downgrade subscription
router.post('/subscription/change-tier',
  authenticate,
  [
    body('subscriptionId').isString().withMessage('subscriptionId is required'),
    body('newTier').isIn(['basic', 'premium', 'gold']).withMessage('Invalid tier'),
    body('newPrice').isNumeric().withMessage('Price must be numeric'),
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { subscriptionId, newTier, newPrice } = req.body;

    try {
      const subscription = await prisma.subscription.findFirst({
        where: { id: subscriptionId, userId: req.user.id },
      });

      if (!subscription) {
        return res.status(404).json({ success: false, message: 'Subscription not found' });
      }

      if (subscription.status !== 'active') {
        return res.status(400).json({ success: false, message: 'Cannot change tier on inactive subscription' });
      }

      const updated = await prisma.subscription.update({
        where: { id: subscriptionId },
        data: {
          tier: newTier,
          price: parseFloat(newPrice),
        },
      });

      return res.json({
        success: true,
        message: `Subscription ${newTier === 'gold' ? 'upgraded' : 'changed'} to ${newTier}`,
        subscription: updated,
      });
    } catch (error) {
      console.error('Change tier error:', error);
      return res.status(500).json({ success: false, message: 'Failed to change tier' });
    }
  }
);

// ============================================================
// F2. CREATOR WALLET
// ============================================================

// GET /api/payments/wallet/:creatorId - Get creator wallet with earnings breakdown
router.get('/wallet/:creatorId', authenticate, async (req, res) => {
  try {
    const { creatorId } = req.params;

    // Verify the requester is the creator
    if (req.user.id !== creatorId && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Unauthorized' });
    }

    const creator = await prisma.user.findUnique({
      where: { id: creatorId },
      select: {
        id: true,
        walletBalance: true,
        userType: true,
        revenueSplit: true,
        platformSplit: true,
        subscriptionBasic: true,
        subscriptionPremium: true,
        subscriptionGold: true,
      },
    });

    if (!creator) {
      return res.status(404).json({ success: false, message: 'Creator not found' });
    }

    // Calculate earnings from subscriptions
    const subscriptionEarnings = await prisma.payment.aggregate({
      where: { creatorId, status: 'completed', tier: { not: 'paid_post' } },
      _sum: { amount: true },
    });

    // Calculate earnings from paid posts
    const paidPostEarnings = await prisma.payment.aggregate({
      where: { creatorId, status: 'completed', tier: 'paid_post' },
      _sum: { amount: true },
    });

    // Count active subscribers
    const subscriberCount = await prisma.subscription.count({
      where: { creatorId, status: 'active' },
    });

    return res.json({
      success: true,
      wallet: {
        balance: creator.walletBalance || 0,
        revenueSplit: creator.revenueSplit || (creator.userType === 'zls_artist' ? 50 : 70),
        platformSplit: creator.platformSplit || (creator.userType === 'zls_artist' ? 50 : 30),
        subscriptionEarnings: subscriptionEarnings._sum.amount || 0,
        paidPostEarnings: paidPostEarnings._sum.amount || 0,
        totalEarnings: (subscriptionEarnings._sum.amount || 0) + (paidPostEarnings._sum.amount || 0),
        subscriberCount,
        subscriptionTiers: {
          basic: creator.subscriptionBasic || 50,
          premium: creator.subscriptionPremium || 99,
          gold: creator.subscriptionGold || 199,
        },
      },
    });
  } catch (error) {
    console.error('Wallet error:', error);
    return res.status(500).json({ success: false, message: 'Failed to get wallet info' });
  }
});

export default router;