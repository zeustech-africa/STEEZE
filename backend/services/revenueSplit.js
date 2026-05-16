import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Calculate revenue split based on user type
 * ZLS Artists: 50/50 split with platform
 * Independent Creators: 70/30 split (creator/platform)
 */
export function calculateRevenueSplit(userType, amount) {
  const parsedAmount = parseFloat(amount) || 0;

  if (userType === 'zls_artist') {
    return {
      creatorShare: parsedAmount * 0.5,
      platformShare: parsedAmount * 0.5,
    };
  }

  if (userType === 'independent_creator') {
    return {
      creatorShare: parsedAmount * 0.7,
      platformShare: parsedAmount * 0.3,
    };
  }

  // Vibes or regular users get nothing from platform payments
  return {
    creatorShare: 0,
    platformShare: parsedAmount,
  };
}

/**
 * Distribute revenue from a completed payment to the creator
 */
export async function distributeRevenue(paymentAmount, creatorId, options = {}) {
  const { description = 'Revenue share payment', paymentId = null } = options;

  const creator = await prisma.user.findUnique({
    where: { id: creatorId },
  });

  if (!creator) {
    return { success: false, message: 'Creator not found' };
  }

  const split = calculateRevenueSplit(creator.userType, paymentAmount);

  // Update creator wallet balance
  await prisma.user.update({
    where: { id: creatorId },
    data: { walletBalance: { increment: split.creatorShare } },
  });

  // Record transaction
  await prisma.transaction.create({
    data: {
      creatorId,
      amount: split.creatorShare,
      type: 'subscription_payout',
      status: 'completed',
      description,
      metadata: paymentId ? { paymentId } : undefined,
    },
  });

  // Record platform revenue
  if (split.platformShare > 0) {
    await prisma.platformRevenue.create({
      data: {
        amount: split.platformShare,
        source: 'subscription',
        description: `Platform share from payment to ${creator.username}`,
        metadata: paymentId ? { paymentId, creatorId } : { creatorId },
      },
    });
  }

  console.log(
    `[Revenue] Distributed R${paymentAmount}: Creator R${split.creatorShare}, Platform R${split.platformShare}`
  );

  return { success: true, split };
}

/**
 * Process monthly payouts to all eligible creators
 */
export async function processMonthlyPayouts() {
  const MINIMUM_PAYOUT = 500; // R500 minimum

  const creators = await prisma.user.findMany({
    where: {
      userType: { in: ['zls_artist', 'independent_creator'] },
      walletBalance: { gte: MINIMUM_PAYOUT },
      isBanned: false,
    },
    select: { id: true, username: true, walletBalance: true },
  });

  const payouts = [];

  for (const creator of creators) {
    const payout = await prisma.payout.create({
      data: {
        creatorId: creator.id,
        amount: creator.walletBalance,
        status: 'pending',
        description: `Monthly payout - ${new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}`,
      },
    });

    // Reset wallet balance after payout request
    await prisma.user.update({
      where: { id: creator.id },
      data: { walletBalance: 0 },
    });

    // Record the payout transaction
    await prisma.transaction.create({
      data: {
        creatorId: creator.id,
        amount: -creator.walletBalance,
        type: 'payout',
        status: 'completed',
        description: `Monthly payout processed - R${creator.walletBalance.toFixed(2)}`,
        metadata: { payoutId: payout.id },
      },
    });

    payouts.push(payout);

    console.log(
      `[Payout] Processed R${creator.walletBalance.toFixed(2)} for ${creator.username}`
    );
  }

  return payouts;
}

/**
 * Get total platform revenue statistics
 */
export async function getPlatformRevenueStats(startDate, endDate) {
  const where = {};
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) where.createdAt.gte = new Date(startDate);
    if (endDate) where.createdAt.lte = new Date(endDate);
  }

  const [totalRevenue, bySource] = await Promise.all([
    prisma.platformRevenue.aggregate({
      where,
      _sum: { amount: true },
    }),
    prisma.platformRevenue.groupBy({
      by: ['source'],
      where,
      _sum: { amount: true },
    }),
  ]);

  return {
    totalRevenue: totalRevenue._sum.amount || 0,
    bySource: bySource.map((s) => ({
      source: s.source,
      amount: s._sum.amount || 0,
    })),
  };
}

/**
 * Get creator earnings summary
 */
export async function getCreatorEarnings(creatorId) {
  const [transactions, totalEarnings, pendingBalance] = await Promise.all([
    prisma.transaction.findMany({
      where: { creatorId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.transaction.aggregate({
      where: { creatorId, type: { in: ['subscription_payout', 'tip', 'royalty'] } },
      _sum: { amount: true },
    }),
    prisma.user.findUnique({
      where: { id: creatorId },
      select: { walletBalance: true },
    }),
  ]);

  return {
    totalEarnings: totalEarnings._sum.amount || 0,
    currentBalance: pendingBalance?.walletBalance || 0,
    recentTransactions: transactions,
  };
}

export default {
  calculateRevenueSplit,
  distributeRevenue,
  processMonthlyPayouts,
  getPlatformRevenueStats,
  getCreatorEarnings,
};