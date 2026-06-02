import express from 'express';
import { PrismaClient } from '@prisma/client';
import { initializeTransaction, verifyTransaction } from '../services/payment/paystack.js';
import { creditWallet } from '../services/wallet.js';

const router = express.Router();
const prisma = new PrismaClient();

// Plan pricing in Rands (ZAR)
const PLAN_PRICES = {
  basic: 49,    // R49
  premium: 99,  // R99
  gold: 199     // R199
};

// Initialize a subscription payment
router.post('/initiate', async (req, res) => {
  try {
    const { userId, creatorId, plan, email } = req.body;

    if (!userId || !creatorId || !plan || !email) {
      return res.status(400).json({ error: 'Missing required fields: userId, creatorId, plan, email' });
    }

    const amount = PLAN_PRICES[plan];
    if (!amount) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    const reference = `SUB_${Date.now()}_${userId.slice(0, 8)}`;

    const result = await initializeTransaction(
      email,
      amount,
      reference,
      { userId, creatorId, plan, type: 'subscription' }
    );

    if (result.success) {
      return res.status(200).json({
        success: true,
        authorization_url: result.data.authorization_url,
        reference,
        amount
      });
    } else {
      return res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Subscription init error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify subscription payment (callback)
router.get('/verify', async (req, res) => {
  try {
    const { reference } = req.query;

    if (!reference) {
      return res.status(400).json({ error: 'Missing reference' });
    }

    const result = await verifyTransaction(reference);

    if (result.success && result.data.status === 'success') {
      const transaction = result.data;
      const { userId, creatorId, plan } = transaction.metadata;
      const amount = transaction.amount / 100;

      // Get revenue split for creator
      const creator = await prisma.user.findUnique({
        where: { id: creatorId },
        select: { userType: true, artistName: true }
      });

      const splitPercentage = creator?.userType === 'zls_artist' ? 50 : 70;
      const creatorShare = amount * (splitPercentage / 100);
      const platformShare = amount - creatorShare;

      // Credit creator's wallet
      if (creatorShare > 0) {
        await creditWallet(creatorId, creatorShare, reference, `Subscription payment from user ${userId} (${splitPercentage}% split)`);
      }

      // Create subscription record
      const endDate = new Date();
      endDate.setMonth(endDate.getMonth() + 1);

      await prisma.subscription.create({
        data: {
          userId,
          creatorId,
          plan,
          amount,
          status: 'active',
          startDate: new Date(),
          endDate,
          paymentReference: reference
        }
      });

      // Create transaction record
      await prisma.transaction.create({
        data: {
          userId: creatorId,
          amount: creatorShare,
          type: 'credit',
          status: 'completed',
          reference,
          description: `Subscription payment from ${userId} for ${plan} plan`,
          metadata: { subscriberId: userId, plan, splitPercentage, creatorShare, platformShare }
        }
      });

      return res.redirect(`${process.env.APP_URL}/subscription/success?reference=${reference}&plan=${plan}`);
    } else {
      return res.redirect(`${process.env.APP_URL}/subscription/failed?reference=${reference}`);
    }
  } catch (error) {
    console.error('Subscription verify error:', error);
    res.redirect(`${process.env.APP_URL}/subscription/error`);
  }
});

// Get user's active subscriptions
router.get('/my-subscriptions', async (req, res) => {
  try {
    const { userId } = req.query;

    if (!userId) {
      return res.status(400).json({ error: 'Missing userId' });
    }

    const subscriptions = await prisma.subscription.findMany({
      where: { 
        userId, 
        status: 'active',
        endDate: { gt: new Date() }
      },
      include: { 
        creator: { 
          select: { 
            id: true,
            artistName: true,
            profilePicUrl: true
          } 
        } 
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ subscriptions });
  } catch (error) {
    console.error('Get subscriptions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Cancel subscription
router.post('/cancel', async (req, res) => {
  try {
    const { subscriptionId, userId } = req.body;

    if (!subscriptionId || !userId) {
      return res.status(400).json({ error: 'Missing subscriptionId or userId' });
    }

    const subscription = await prisma.subscription.findFirst({
      where: { id: subscriptionId, userId }
    });

    if (!subscription) {
      return res.status(404).json({ error: 'Subscription not found' });
    }

    await prisma.subscription.update({
      where: { id: subscriptionId },
      data: { status: 'cancelled', cancelledAt: new Date() }
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Cancel subscription error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
