import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create revenue fraud alert
export async function createRevenueFraudAlert(userId, alertType, severity, amount, percentage, details) {
  const existingAlert = await prisma.revenueFraudAlert.findFirst({
    where: {
      userId,
      alertType,
      status: 'pending'
    }
  });
  
  if (existingAlert) {
    return existingAlert;
  }
  
  const alert = await prisma.revenueFraudAlert.create({
    data: {
      userId,
      alertType,
      severity,
      amount,
      percentage,
      details,
      status: 'pending'
    }
  });
  
  return alert;
}

// Detect abnormal earnings (spike in revenue)
export async function detectAbnormalEarnings(userId, days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  // Get earnings per day
  const earnings = await prisma.payment.groupBy({
    by: ['userId', 'createdAt'],
    where: {
      userId,
      status: 'completed',
      createdAt: { gte: startDate }
    },
    _sum: { amount: true }
  });
  
  // Calculate daily average
  const dailyTotals = {};
  for (const earning of earnings) {
    const dateKey = earning.createdAt.toISOString().split('T')[0];
    dailyTotals[dateKey] = (dailyTotals[dateKey] || 0) + (earning._sum.amount || 0);
  }
  
  const values = Object.values(dailyTotals);
  if (values.length < 3) return;
  
  const avg = values.reduce((a, b) => a + b, 0) / values.length;
  const max = Math.max(...values);
  const lastDay = values[values.length - 1];
  
  // If last day is 5x higher than average
  if (lastDay > avg * 5 && lastDay > 100) {
    await createRevenueFraudAlert(
      userId,
      'abnormal_earnings',
      'high',
      lastDay,
      (lastDay / avg - 1) * 100,
      { averageEarnings: avg, spikeEarnings: lastDay, period: days }
    );
    return true;
  }
  
  return false;
}

// Detect suspicious withdrawals
export async function detectSuspiciousWithdrawals(userId, hours = 24) {
  const startDate = new Date();
  startDate.setHours(startDate.getHours() - hours);
  
  const withdrawals = await prisma.withdrawal.findMany({
    where: {
      userId,
      createdAt: { gte: startDate }
    },
    orderBy: { createdAt: 'asc' }
  });
  
  if (withdrawals.length >= 3) {
    const totalAmount = withdrawals.reduce((sum, w) => sum + w.amount, 0);
    const maxAmount = Math.max(...withdrawals.map(w => w.amount));
    
    await createRevenueFraudAlert(
      userId,
      'suspicious_withdrawal',
      withdrawals.length >= 5 ? 'high' : 'medium',
      totalAmount,
      null,
      { withdrawalCount: withdrawals.length, totalAmount, maxAmount, timeWindow: `${hours} hours` }
    );
    
    await prisma.withdrawalFraudLog.create({
      data: {
        withdrawalId: withdrawals[0].id,
        userId,
        amount: totalAmount,
        withdrawalCount: withdrawals.length,
        timeWindow: `${hours}h`,
        isSuspicious: true,
        reason: `Multiple withdrawals in ${hours} hours`
      }
    });
    
    return true;
  }
  
  return false;
}

// Detect fake streaming (artificial engagement)
export async function detectFakeStreaming(contentId, userId, ipAddress, userAgent) {
  // Check for rapid plays from same IP
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  const plays = await prisma.streamingFraudLog.count({
    where: {
      contentId,
      ipAddress,
      createdAt: { gte: oneHourAgo }
    }
  });
  
  let isSuspicious = false;
  let reason = null;
  
  if (plays >= 10) {
    isSuspicious = true;
    reason = `10+ plays from same IP in 1 hour`;
  }
  
  await prisma.streamingFraudLog.create({
    data: {
      contentId,
      userId,
      contentType: 'post',
      ipAddress,
      userAgent,
      isSuspicious,
      reason
    }
  });
  
  if (isSuspicious) {
    await createRevenueFraudAlert(
      userId,
      'fake_streaming',
      'medium',
      null,
      null,
      { contentId, plays, ipAddress, timeWindow: '1 hour' }
    );
  }
  
  return isSuspicious;
}

// Detect revenue manipulation (self-purchases or circular payments)
export async function detectRevenueManipulation(userId) {
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Check for payments from same user to themselves
  const selfPayments = await prisma.payment.findMany({
    where: {
      userId,
      creatorId: userId,
      createdAt: { gte: oneDayAgo }
    }
  });
  
  if (selfPayments.length > 0) {
    const total = selfPayments.reduce((sum, p) => sum + p.amount, 0);
    await createRevenueFraudAlert(
      userId,
      'revenue_manipulation',
      'critical',
      total,
      null,
      { selfPayments: selfPayments.length, totalAmount: total }
    );
    return true;
  }
  
  // Check for circular payments (A pays B, B pays C, C pays A)
  const payments = await prisma.payment.findMany({
    where: {
      OR: [
        { userId },
        { creatorId: userId }
      ],
      createdAt: { gte: oneDayAgo }
    },
    take: 50
  });
  
  // Simplified circular detection
  const userIds = new Set();
  for (const payment of payments) {
    userIds.add(payment.userId);
    userIds.add(payment.creatorId);
  }
  
  if (userIds.size <= 3 && payments.length >= 6) {
    await createRevenueFraudAlert(
      userId,
      'revenue_manipulation',
      'high',
      null,
      null,
      { paymentCount: payments.length, uniqueUsers: userIds.size, description: 'Possible circular payment pattern' }
    );
    return true;
  }
  
  return false;
}

// Get revenue fraud dashboard stats
export async function getRevenueFraudStats() {
  const [pendingAlerts, highPriority, totalAlerts, suspiciousWithdrawals, fakeStreaming] = await Promise.all([
    prisma.revenueFraudAlert.count({ where: { status: 'pending' } }),
    prisma.revenueFraudAlert.count({ where: { severity: { in: ['high', 'critical'] }, status: 'pending' } }),
    prisma.revenueFraudAlert.count(),
    prisma.withdrawalFraudLog.count({ where: { isSuspicious: true } }),
    prisma.streamingFraudLog.count({ where: { isSuspicious: true } })
  ]);
  
  const alertsByType = await prisma.revenueFraudAlert.groupBy({
    by: ['alertType'],
    _count: true
  });
  
  const alertsBySeverity = await prisma.revenueFraudAlert.groupBy({
    by: ['severity'],
    _count: true
  });
  
  return {
    pendingAlerts,
    highPriority,
    totalAlerts,
    suspiciousWithdrawals,
    fakeStreamingDetections: fakeStreaming,
    alertsByType,
    alertsBySeverity
  };
}

// Get revenue fraud alerts with filters
export async function getRevenueFraudAlerts(filters = {}, page = 1, limit = 20) {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.severity) where.severity = filters.severity;
  if (filters.alertType) where.alertType = filters.alertType;
  if (filters.userId) where.userId = filters.userId;
  
  const skip = (page - 1) * limit;
  
  const [alerts, total] = await Promise.all([
    prisma.revenueFraudAlert.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, username: true, artistName: true } }
      }
    }),
    prisma.revenueFraudAlert.count({ where })
  ]);
  
  return { alerts, total, page, limit };
}

// Resolve revenue fraud alert
export async function resolveRevenueFraudAlert(alertId, investigatedBy, resolution) {
  return await prisma.revenueFraudAlert.update({
    where: { id: alertId },
    data: {
      status: 'resolved',
      investigatedBy,
      investigatedAt: new Date(),
      resolution
    }
  });
}

// Mark revenue fraud alert as false positive
export async function markRevenueFraudFalsePositive(alertId, investigatedBy, resolution) {
  return await prisma.revenueFraudAlert.update({
    where: { id: alertId },
    data: {
      status: 'false_positive',
      investigatedBy,
      investigatedAt: new Date(),
      resolution: resolution || 'Marked as false positive'
    }
  });
}