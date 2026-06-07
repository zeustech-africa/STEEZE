import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Create or get moderator profile for a user
export async function getOrCreateModerator(userId, role = 'moderator', department = null) {
  let moderator = await prisma.moderator.findUnique({
    where: { userId },
    include: { metrics: true }
  });
  
  if (!moderator) {
    moderator = await prisma.moderator.create({
      data: {
        userId,
        role,
        department,
        isActive: true
      },
      include: { metrics: true }
    });
    
    // Create associated metrics
    await prisma.moderatorMetric.create({
      data: { moderatorId: moderator.id }
    });
    
    moderator = await prisma.moderator.findUnique({
      where: { userId },
      include: { metrics: true }
    });
  }
  
  return moderator;
}

// Record a moderator action
export async function recordModeratorAction(moderatorId, actionType, targetType, targetId, responseTime = null, resolutionTime = null, details = {}) {
  const action = await prisma.moderatorAction.create({
    data: {
      moderatorId,
      actionType,
      targetType,
      targetId,
      responseTime,
      resolutionTime,
      details
    }
  });
  
  // Update moderator metrics based on action type
  await updateModeratorMetrics(moderatorId, actionType);
  
  // Update last active timestamp
  await prisma.moderator.update({
    where: { id: moderatorId },
    data: { lastActive: new Date() }
  });
  
  return action;
}

// Update moderator metrics
async function updateModeratorMetrics(moderatorId, actionType) {
  const metric = await prisma.moderatorMetric.findUnique({
    where: { moderatorId }
  });
  
  if (!metric) return;
  
  const updates = {};
  
  switch (actionType) {
    case 'resolve_report':
      updates.reportsResolved = (metric.reportsResolved || 0) + 1;
      updates.totalCasesHandled = (metric.totalCasesHandled || 0) + 1;
      break;
    case 'approve_appeal':
    case 'reject_appeal':
      updates.appealsResolved = (metric.appealsResolved || 0) + 1;
      updates.totalCasesHandled = (metric.totalCasesHandled || 0) + 1;
      break;
    case 'verify_user':
      updates.verificationsReviewed = (metric.verificationsReviewed || 0) + 1;
      updates.totalCasesHandled = (metric.totalCasesHandled || 0) + 1;
      break;
    case 'approve_post':
    case 'reject_post':
      updates.contentReviewed = (metric.contentReviewed || 0) + 1;
      updates.totalCasesHandled = (metric.totalCasesHandled || 0) + 1;
      break;
    case 'warn_user':
      updates.warningsIssued = (metric.warningsIssued || 0) + 1;
      break;
    case 'ban_user':
      updates.bansIssued = (metric.bansIssued || 0) + 1;
      updates.totalCasesHandled = (metric.totalCasesHandled || 0) + 1;
      break;
    case 'suspend_user':
      updates.suspensionsIssued = (metric.suspensionsIssued || 0) + 1;
      updates.totalCasesHandled = (metric.totalCasesHandled || 0) + 1;
      break;
  }
  
  updates.updatedAt = new Date();
  
  await prisma.moderatorMetric.update({
    where: { moderatorId },
    data: updates
  });
}

// Record that a moderator's action was overturned
export async function recordOverturned(moderatorActionId, overturnedBy, reason) {
  const action = await prisma.moderatorAction.update({
    where: { id: moderatorActionId },
    data: {
      overturned: true,
      overturnedBy,
      overturnedAt: new Date()
    }
  });
  
  // Update the moderator's metrics
  const metric = await prisma.moderatorMetric.findUnique({
    where: { moderatorId: action.moderatorId }
  });
  
  if (metric) {
    await prisma.moderatorMetric.update({
      where: { moderatorId: action.moderatorId },
      data: {
        appealsOverturned: (metric.appealsOverturned || 0) + 1
      }
    });
  }
  
  return action;
}

// Get moderator performance dashboard
export async function getModeratorDashboard(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const [moderators, topPerformers, recentActions, stats] = await Promise.all([
    prisma.moderator.findMany({
      where: { isActive: true },
      include: { metrics: true, user: { select: { id: true, email: true, username: true } } }
    }),
    prisma.moderatorMetric.findMany({
      orderBy: { totalCasesHandled: 'desc' },
      take: 10,
      include: { moderator: { include: { user: { select: { email: true, username: true } } } } }
    }),
    prisma.moderatorAction.findMany({
      where: { createdAt: { gte: startDate } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { moderator: { include: { user: { select: { email: true, username: true } } } } }
    }),
    prisma.moderatorAction.aggregate({
      where: { createdAt: { gte: startDate } },
      _count: true,
      _avg: { responseTime: true, resolutionTime: true }
    })
  ]);
  
  return {
    moderators,
    topPerformers,
    recentActions,
    summary: {
      totalActions: stats._count,
      averageResponseTime: stats._avg.responseTime || 0,
      averageResolutionTime: stats._avg.resolutionTime || 0,
      periodDays: days
    }
  };
}

// Get individual moderator performance
export async function getModeratorPerformance(moderatorId, days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const [moderator, actions, metrics] = await Promise.all([
    prisma.moderator.findUnique({
      where: { id: moderatorId },
      include: { user: { select: { id: true, email: true, username: true } } }
    }),
    prisma.moderatorAction.findMany({
      where: {
        moderatorId,
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'desc' }
    }),
    prisma.moderatorMetric.findUnique({
      where: { moderatorId }
    })
  ]);
  
  // Group actions by type
  const actionsByType = {};
  for (const action of actions) {
    actionsByType[action.actionType] = (actionsByType[action.actionType] || 0) + 1;
  }
  
  // Calculate average response time from actions
  const actionsWithResponse = actions.filter(a => a.responseTime);
  const avgResponseTime = actionsWithResponse.length > 0
    ? actionsWithResponse.reduce((sum, a) => sum + a.responseTime, 0) / actionsWithResponse.length
    : 0;
  
  return {
    moderator,
    metrics,
    recentActions: actions.slice(0, 20),
    actionsByType,
    summary: {
      totalActions: actions.length,
      averageResponseTime: avgResponseTime,
      overturnedCount: actions.filter(a => a.overturned).length
    }
  };
}