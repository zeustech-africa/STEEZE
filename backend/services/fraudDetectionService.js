import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Generate device fingerprint from request data
export function generateDeviceFingerprint(userAgent, ipAddress) {
  // Simple fingerprint generation (can be enhanced later)
  const data = `${userAgent}|${ipAddress}`;
  let hash = 0;
  for (let i = 0; i < data.length; i++) {
    const char = data.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash).toString(16);
}

// Record device fingerprint for a user
export async function recordDeviceFingerprint(userId, userAgent, ipAddress) {
  const fingerprint = generateDeviceFingerprint(userAgent, ipAddress);
  
  let device = await prisma.deviceFingerprint.findUnique({
    where: { fingerprint }
  });
  
  if (device) {
    // Update existing device
    let userIds = device.userIds || [];
    if (!userIds.includes(userId)) {
      userIds.push(userId);
    }
    
    device = await prisma.deviceFingerprint.update({
      where: { fingerprint },
      data: {
        userIds,
        lastSeen: new Date(),
        seenCount: { increment: 1 }
      }
    });
    
    // Check for multiple accounts on same device
    if (userIds.length >= 2) {
      await createFraudAlert(
        userId,
        'multiple_accounts',
        'medium',
        60,
        { deviceId: device.id, userIds, count: userIds.length }
      );
    }
  } else {
    // Create new device
    device = await prisma.deviceFingerprint.create({
      data: {
        fingerprint,
        userAgent,
        ipAddress,
        userIds: [userId],
        seenCount: 1,
        lastSeen: new Date()
      }
    });
  }
  
  return device;
}

// Create a fraud alert
export async function createFraudAlert(userId, alertType, severity, score, details) {
  // Check if there's already a pending alert of this type for this user
  const existingAlert = await prisma.fraudAlert.findFirst({
    where: {
      userId,
      alertType,
      status: 'pending'
    }
  });
  
  if (existingAlert) {
    return existingAlert;
  }
  
  const alert = await prisma.fraudAlert.create({
    data: {
      userId,
      alertType,
      severity,
      score,
      details,
      status: 'pending'
    }
  });
  
  return alert;
}

// Get fraud alerts with filters
export async function getFraudAlerts(filters = {}, page = 1, limit = 20) {
  const where = {};
  if (filters.status) where.status = filters.status;
  if (filters.severity) where.severity = filters.severity;
  if (filters.alertType) where.alertType = filters.alertType;
  if (filters.userId) where.userId = filters.userId;
  
  const skip = (page - 1) * limit;
  
  const [alerts, total] = await Promise.all([
    prisma.fraudAlert.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, username: true, artistName: true } }
      }
    }),
    prisma.fraudAlert.count({ where })
  ]);
  
  return { alerts, total, page, limit };
}

// Resolve a fraud alert
export async function resolveFraudAlert(alertId, investigatedBy, resolution) {
  const alert = await prisma.fraudAlert.update({
    where: { id: alertId },
    data: {
      status: 'resolved',
      investigatedBy,
      investigatedAt: new Date(),
      resolution
    }
  });
  return alert;
}

// Mark fraud alert as false positive
export async function markAsFalsePositive(alertId, investigatedBy, resolution) {
  const alert = await prisma.fraudAlert.update({
    where: { id: alertId },
    data: {
      status: 'false_positive',
      investigatedBy,
      investigatedAt: new Date(),
      resolution: resolution || 'Marked as false positive'
    }
  });
  return alert;
}

// Get fraud detection dashboard stats
export async function getFraudDashboardStats() {
  const [pending, highPriority, totalAlerts, suspiciousDevices] = await Promise.all([
    prisma.fraudAlert.count({ where: { status: 'pending' } }),
    prisma.fraudAlert.count({ where: { severity: { in: ['high', 'critical'] }, status: 'pending' } }),
    prisma.fraudAlert.count(),
    prisma.deviceFingerprint.count({ where: { flagged: true } })
  ]);
  
  const alertsByType = await prisma.fraudAlert.groupBy({
    by: ['alertType'],
    _count: true
  });
  
  const alertsBySeverity = await prisma.fraudAlert.groupBy({
    by: ['severity'],
    _count: true
  });
  
  return {
    pending,
    highPriority,
    totalAlerts,
    suspiciousDevices,
    alertsByType,
    alertsBySeverity
  };
}

// Detect duplicate accounts (same email domain pattern or similar)
export async function detectDuplicateAccounts(userId, email) {
  // Check for users with similar email (same local part with different numbers)
  const emailLocal = email.split('@')[0];
  const emailPattern = emailLocal.replace(/[0-9]/g, '');
  
  const similarUsers = await prisma.user.findMany({
    where: {
      email: { contains: emailPattern },
      id: { not: userId }
    },
    select: { id: true, email: true }
  });
  
  if (similarUsers.length >= 1) {
    await createFraudAlert(
      userId,
      'duplicate_account',
      'medium',
      50,
      { similarAccounts: similarUsers.map(u => ({ id: u.id, email: u.email })) }
    );
  }
  
  return similarUsers;
}

// ============ ADVANCED FRAUD DETECTION METHODS ============

// Get detailed fraud statistics
export async function getAdvancedFraudStats() {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const [totalAlerts, alertsByType, highRiskUsers, vpnDetections, botDetections] = await Promise.all([
    prisma.fraudAlert.count(),
    prisma.fraudAlert.groupBy({
      by: ['alertType'],
      _count: true
    }),
    prisma.user.count({
      where: { fraudRiskScore: { gte: 70 } }
    }),
    prisma.fraudAlert.count({
      where: { alertType: 'vpn_detected', createdAt: { gte: thirtyDaysAgo } }
    }),
    prisma.fraudAlert.count({
      where: { alertType: 'bot_activity', createdAt: { gte: thirtyDaysAgo } }
    })
  ]);
  
  return {
    totalAlerts,
    alertsByType,
    highRiskUsers,
    vpnDetections,
    botDetections,
    period: '30 days'
  };
}

// Get fraud trends over time
export async function getFraudTrends(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);
  
  const alerts = await prisma.fraudAlert.findMany({
    where: {
      createdAt: { gte: startDate }
    },
    orderBy: { createdAt: 'asc' }
  });
  
  // Group by date
  const trends = {};
  for (const alert of alerts) {
    const dateKey = alert.createdAt.toISOString().split('T')[0];
    if (!trends[dateKey]) {
      trends[dateKey] = { date: dateKey, count: 0, byType: {} };
    }
    trends[dateKey].count++;
    trends[dateKey].byType[alert.alertType] = (trends[dateKey].byType[alert.alertType] || 0) + 1;
  }
  
  return Object.values(trends);
}

// Get high-risk users list
export async function getHighRiskUsers(limit = 50) {
  const users = await prisma.user.findMany({
    where: {
      fraudRiskScore: { gte: 50 }
    },
    select: {
      id: true,
      email: true,
      username: true,
      artistName: true,
      fraudRiskScore: true,
      createdAt: true
    },
    orderBy: { fraudRiskScore: 'desc' },
    take: limit
  });
  
  return users;
}
