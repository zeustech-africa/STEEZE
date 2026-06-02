import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get active campaigns for a placement
export async function getActiveCampaigns(placement, userId = null, country = null) {
  const now = new Date();

  const campaigns = await prisma.campaign.findMany({
    where: {
      status: 'active',
      placement,
      remainingBudget: { gt: 0 },
      OR: [
        { startDate: null },
        { startDate: { lte: now } },
      ],
      AND: [
        {
          OR: [
            { endDate: null },
            { endDate: { gte: now } },
          ],
        },
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

  return filtered;
}

// Get random weighted campaign (simple rotation)
export function selectCampaign(campaigns) {
  if (!campaigns || campaigns.length === 0) return null;

  // Simple random selection with even distribution
  const randomIndex = Math.floor(Math.random() * campaigns.length);
  return campaigns[randomIndex];
}

// Update campaign spend and check for completion
export async function updateCampaignSpend(campaignId, costCents) {
  const campaign = await prisma.campaign.update({
    where: { id: campaignId },
    data: {
      spent: { increment: costCents },
      remainingBudget: { decrement: costCents },
    },
  });

  // If budget exhausted, mark as completed
  if (campaign.remainingBudget <= 0) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'completed' },
    });
  }

  return campaign;
}

// Record impression
export async function recordImpression(campaignId, userId, sessionId, ipAddress, userAgent, viewDuration) {
  // AUDIT: Duplicate prevention - check if already recorded today for this user
  if (userId) {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const existingToday = await prisma.adImpression.findFirst({
      where: {
        campaignId,
        userId,
        viewedAt: { gte: todayStart }
      }
    });

    if (existingToday) {
      // Skip duplicate impression for same user today
      return;
    }
  }

  // First fetch campaign to calculate cost
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return null;

  const costCents = Math.round(campaign.cpm / 1000); // Cost per impression in cents

  await prisma.$transaction(async (tx) => {
    await tx.adImpression.create({
      data: {
        campaignId,
        userId,
        sessionId,
        ipAddress,
        userAgent,
        viewDuration,
        fullyVisible: viewDuration >= 1500,
      },
    });

    await tx.campaign.update({
      where: { id: campaignId },
      data: {
        impressions: { increment: 1 },
        spent: { increment: costCents },
        remainingBudget: { decrement: costCents },
      },
    });
  });

  // Check if budget exhausted after this impression
  const updatedCampaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (updatedCampaign && updatedCampaign.remainingBudget <= 0) {
    await prisma.campaign.update({
      where: { id: campaignId },
      data: { status: 'completed' },
    });
  }

  return updatedCampaign;
}

// Record click
export async function recordClick(campaignId, userId, sessionId, ipAddress, userAgent) {
  const campaign = await prisma.campaign.findUnique({ where: { id: campaignId } });
  if (!campaign) return null;

  await prisma.$transaction(async (tx) => {
    await tx.adClick.create({
      data: {
        campaignId,
        userId,
        sessionId,
        ipAddress,
        userAgent,
      },
    });

    await tx.campaign.update({
      where: { id: campaignId },
      data: { clicks: { increment: 1 } },
    });
  });

  return campaign;
}

// Get campaign analytics
export async function getCampaignAnalytics(campaignId) {
  const [campaign, impressions, clickCount] = await Promise.all([
    prisma.campaign.findUnique({ where: { id: campaignId } }),
    prisma.adImpression.groupBy({
      by: ['viewedAt'],
      where: { campaignId },
      _count: true,
      orderBy: { viewedAt: 'asc' },
    }),
    prisma.adClick.count({ where: { campaignId } }),
  ]);

  const ctr = campaign?.impressions > 0
    ? (campaign.clicks / campaign.impressions) * 100
    : 0;

  return {
    campaign,
    ctr: ctr.toFixed(2),
    dailyImpressions: impressions,
    totalClicks: clickCount,
  };
}

export default {
  getActiveCampaigns,
  selectCampaign,
  updateCampaignSpend,
  recordImpression,
  recordClick,
  getCampaignAnalytics,
};