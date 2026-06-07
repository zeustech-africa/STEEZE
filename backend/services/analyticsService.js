import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Calculate retention for a specific cohort
export async function calculateCohortRetention(cohortStartDate, cohortEndDate) {
  // Get users who joined in this cohort period
  const cohortUsers = await prisma.user.findMany({
    where: {
      createdAt: {
        gte: cohortStartDate,
        lte: cohortEndDate
      }
    },
    select: { id: true, createdAt: true }
  });
  
  const newUsers = cohortUsers.length;
  if (newUsers === 0) return null;
  
  const userIds = cohortUsers.map(u => u.id);
  const cohortMonth = cohortStartDate.toISOString().slice(0, 7);
  
  // Calculate retained users at different intervals
  const day1Cutoff = new Date(cohortStartDate);
  day1Cutoff.setDate(day1Cutoff.getDate() + 1);
  
  const day7Cutoff = new Date(cohortStartDate);
  day7Cutoff.setDate(day7Cutoff.getDate() + 7);
  
  const day30Cutoff = new Date(cohortStartDate);
  day30Cutoff.setDate(day30Cutoff.getDate() + 30);
  
  const day90Cutoff = new Date(cohortStartDate);
  day90Cutoff.setDate(day90Cutoff.getDate() + 90);
  
  // Count users who had activity after each cutoff
  const retainedDay1 = await prisma.session.count({
    where: {
      userId: { in: userIds },
      createdAt: { gt: day1Cutoff }
    },
    distinct: ['userId']
  });
  
  const retainedDay7 = await prisma.session.count({
    where: {
      userId: { in: userIds },
      createdAt: { gt: day7Cutoff }
    },
    distinct: ['userId']
  });
  
  const retainedDay30 = await prisma.session.count({
    where: {
      userId: { in: userIds },
      createdAt: { gt: day30Cutoff }
    },
    distinct: ['userId']
  });
  
  const retainedDay90 = await prisma.session.count({
    where: {
      userId: { in: userIds },
      createdAt: { gt: day90Cutoff }
    },
    distinct: ['userId']
  });
  
  // Calculate retention rates
  const retentionRate1 = newUsers > 0 ? (retainedDay1 / newUsers) * 100 : 0;
  const retentionRate7 = newUsers > 0 ? (retainedDay7 / newUsers) * 100 : 0;
  const retentionRate30 = newUsers > 0 ? (retainedDay30 / newUsers) * 100 : 0;
  const retentionRate90 = newUsers > 0 ? (retainedDay90 / newUsers) * 100 : 0;
  
  // Calculate churn (users who haven't logged in for 30+ days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const activeUsers = await prisma.session.groupBy({
    by: ['userId'],
    where: {
      createdAt: { gt: thirtyDaysAgo }
    },
    _count: true
  });
  
  const activeUserIds = new Set(activeUsers.map(a => a.userId));
  const churnedUsers = cohortUsers.filter(u => !activeUserIds.has(u.id)).length;
  const churnRate = newUsers > 0 ? (churnedUsers / newUsers) * 100 : 0;
  
  return {
    cohortMonth,
    newUsers,
    retainedDay1,
    retainedDay7,
    retainedDay30,
    retainedDay90,
    retentionRate1,
    retentionRate7,
    retentionRate30,
    retentionRate90,
    churnedUsers,
    churnRate
  };
}

// Calculate conversion metrics
export async function calculateConversionMetrics() {
  const [totalVibes, totalCreators, totalPaid, totalVerified] = await Promise.all([
    prisma.user.count({ where: { userType: 'vibe' } }),
    prisma.user.count({ where: { userType: { in: ['zls_artist', 'independent_creator'] } } }),
    prisma.user.count({ where: { subscriptionTier: { not: 'free' } } }),
    prisma.user.count({ where: { isVerified: true } })
  ]);
  
  // Calculate vibe to creator conversions (users who started as vibe and became creator)
  const vibeToCreator = await prisma.user.count({
    where: {
      userType: { in: ['zls_artist', 'independent_creator'] },
      createdAt: { not: undefined }
    }
  });
  
  const vibeToCreatorRate = totalVibes > 0 ? (vibeToCreator / totalVibes) * 100 : 0;
  
  // Calculate free to paid conversions
  const freeToPaid = await prisma.user.count({
    where: { subscriptionTier: { not: 'free' } }
  });
  
  const freeToPaidRate = totalVibes > 0 ? (freeToPaid / totalVibes) * 100 : 0;
  
  // Calculate verification conversion
  const pendingToVerified = await prisma.user.count({
    where: { isVerified: true, verificationStatus: 'approved' }
  });
  
  const verificationRate = totalVibes > 0 ? (pendingToVerified / totalVibes) * 100 : 0;
  
  return {
    totalVibes,
    totalCreators,
    totalPaid,
    totalVerified,
    vibeToCreator,
    vibeToCreatorRate: Math.round(vibeToCreatorRate * 10) / 10,
    freeToPaid,
    freeToPaidRate: Math.round(freeToPaidRate * 10) / 10,
    pendingToVerified,
    verificationRate: Math.round(verificationRate * 10) / 10
  };
}

// Get retention trends over time
export async function getRetentionTrends(months = 6) {
  const trends = await prisma.retentionAnalytics.findMany({
    orderBy: { date: 'asc' },
    take: months
  });
  
  return trends;
}

// Get conversion trends over time
export async function getConversionTrends(months = 6) {
  const trends = await prisma.conversionAnalytics.findMany({
    orderBy: { date: 'asc' },
    take: months
  });
  
  return trends;
}

// Run daily analytics update (should be scheduled via cron)
export async function updateDailyAnalytics() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  // Calculate retention for the past cohorts
  const cohorts = [];
  for (let i = 0; i < 6; i++) {
    const cohortDate = new Date();
    cohortDate.setMonth(cohortDate.getMonth() - i);
    const startOfMonth = new Date(cohortDate.getFullYear(), cohortDate.getMonth(), 1);
    const endOfMonth = new Date(cohortDate.getFullYear(), cohortDate.getMonth() + 1, 0);
    
    const retention = await calculateCohortRetention(startOfMonth, endOfMonth);
    if (retention) {
      cohorts.push(retention);
      
      // Save to database
      await prisma.retentionAnalytics.upsert({
        where: { date: startOfMonth },
        update: retention,
        create: { date: startOfMonth, ...retention }
      });
    }
  }
  
  // Calculate conversion metrics
  const conversion = await calculateConversionMetrics();
  
  await prisma.conversionAnalytics.upsert({
    where: { date: today },
    update: conversion,
    create: { date: today, ...conversion }
  });
  
  return { retention: cohorts, conversion };
}

// Get dashboard analytics summary
export async function getAnalyticsDashboard() {
  const [retentionTrends, conversionTrends, currentConversion, retentionSummary] = await Promise.all([
    getRetentionTrends(6),
    getConversionTrends(6),
    calculateConversionMetrics(),
    prisma.retentionAnalytics.aggregate({
      _avg: {
        retentionRate1: true,
        retentionRate7: true,
        retentionRate30: true,
        retentionRate90: true
      }
    })
  ]);
  
  return {
    currentConversion: currentConversion,
    retentionTrends: retentionTrends,
    conversionTrends: conversionTrends,
    averageRetention: {
      day1: Math.round(retentionSummary._avg.retentionRate1 || 0),
      day7: Math.round(retentionSummary._avg.retentionRate7 || 0),
      day30: Math.round(retentionSummary._avg.retentionRate30 || 0),
      day90: Math.round(retentionSummary._avg.retentionRate90 || 0)
    }
  };
}