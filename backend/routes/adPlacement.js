import express from 'express';
import { PrismaClient } from '@prisma/client';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/ad/placement - Get ad for specific placement
router.get('/ad/placement', optionalAuth, async (req, res) => {
  const { placement } = req.query;
  const userId = req.user?.id;

  // Map placement to campaign placement type
  const placementMap = {
    login_interstitial: 'homepage_hero',
    pre_audio: 'video_premium',
    pre_video: 'video_premium',
    explore: 'explore',
    feed: 'feed_standard'
  };

  const campaignPlacement = placementMap[placement] || 'feed_standard';

  try {
    // Check if user should see ads based on subscription tier
    let shouldShowAd = true;
    if (userId) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { subscriptionTier: true }
      });

      // Golden users see no ads
      if (user?.subscriptionTier === 'gold') {
        shouldShowAd = false;
      }
    }

    if (!shouldShowAd) {
      return res.json({ success: true, campaign: null });
    }

    // Get active campaign for placement
    const now = new Date();
    const campaign = await prisma.campaign.findFirst({
      where: {
        status: 'active',
        placement: campaignPlacement,
        remainingBudget: { gt: 0 },
        OR: [
          { startDate: null },
          { startDate: { lte: now } }
        ],
        endDate: {
          gte: now
        }
      },
      include: {
        advertiser: {
          select: { companyName: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // If no campaign with endDate constraint found, try without endDate constraint
    let fallbackCampaign = campaign;
    if (!fallbackCampaign) {
      fallbackCampaign = await prisma.campaign.findFirst({
        where: {
          status: 'active',
          placement: campaignPlacement,
          remainingBudget: { gt: 0 },
          OR: [
            { startDate: null },
            { startDate: { lte: now } }
          ],
          endDate: null
        },
        include: {
          advertiser: {
            select: { companyName: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }

    res.json({ success: true, campaign: fallbackCampaign });
  } catch (error) {
    console.error('Get placement ad error:', error);
    res.status(500).json({ error: 'Failed to fetch ad' });
  }
});

export default router;