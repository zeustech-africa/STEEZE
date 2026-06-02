import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// AUDIT: Valid action types for review history
const VALID_ACTIONS = [
  'approved', 'rejected', 'flagged', 'reassigned', 
  'bulk_approved', 'bulk_rejected', 'bulk_assigned', 
  'priority_updated', 'auto_approved'
];

// AUDIT: Log a review action to history
export async function logReviewAction(data) {
  const {
    postId,
    adminId,
    action,
    notes = null,
    previousStatus = null,
    newStatus,
    metadata = {}
  } = data;

  // Input validation
  if (!postId || typeof postId !== 'string') {
    throw new Error('Invalid postId');
  }
  if (!adminId || typeof adminId !== 'string') {
    throw new Error('Invalid adminId');
  }
  if (!action || !VALID_ACTIONS.includes(action)) {
    throw new Error(`Invalid action. Must be one of: ${VALID_ACTIONS.join(', ')}`);
  }
  if (!newStatus || typeof newStatus !== 'string') {
    throw new Error('Invalid newStatus');
  }

  const historyEntry = await prisma.reviewHistory.create({
    data: {
      postId,
      adminId,
      action,
      notes,
      previousStatus,
      newStatus,
      metadata: metadata || {}
    }
  });

  return historyEntry;
}

// AUDIT: Get all review actions for a specific post
export async function getPostReviewHistory(postId, options = {}) {
  const { limit = 50, offset = 0 } = options;

  if (!postId || typeof postId !== 'string') {
    throw new Error('Invalid postId');
  }

  const parsedLimit = Math.min(100, parseInt(limit) || 50);
  const parsedOffset = parseInt(offset) || 0;

  const [history, total] = await Promise.all([
    prisma.reviewHistory.findMany({
      where: { postId },
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            artistName: true,
            fullName: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parsedLimit,
      skip: parsedOffset
    }),
    prisma.reviewHistory.count({ where: { postId } })
  ]);

  return {
    history,
    total,
    hasMore: parsedOffset + parsedLimit < total,
    limit: parsedLimit,
    offset: parsedOffset
  };
}

// AUDIT: Get review actions by specific admin
export async function getAdminReviewHistory(adminId, options = {}) {
  const { limit = 50, offset = 0, startDate = null, endDate = null } = options;

  if (!adminId || typeof adminId !== 'string') {
    throw new Error('Invalid adminId');
  }

  const parsedLimit = Math.min(100, parseInt(limit) || 50);
  const parsedOffset = parseInt(offset) || 0;

  // Build where clause
  const where = { adminId };
  
  if (startDate) {
    where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
  }
  if (endDate) {
    where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
  }

  const [history, total] = await Promise.all([
    prisma.reviewHistory.findMany({
      where,
      include: {
        post: {
          select: {
            id: true,
            title: true,
            mediaType: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parsedLimit,
      skip: parsedOffset
    }),
    prisma.reviewHistory.count({ where })
  ]);

  // Calculate action breakdown
  const actionBreakdown = await prisma.reviewHistory.groupBy({
    by: ['action'],
    where,
    _count: true
  });

  const breakdownMap = {};
  actionBreakdown.forEach(ab => {
    breakdownMap[ab.action] = ab._count;
  });

  return {
    history,
    total,
    hasMore: parsedOffset + parsedLimit < total,
    limit: parsedLimit,
    offset: parsedOffset,
    actionBreakdown: breakdownMap
  };
}

// AUDIT: Get review history by date range
export async function getReviewHistoryByDateRange(startDate, endDate, options = {}) {
  const { limit = 50, offset = 0, action = null, adminId = null } = options;

  if (!startDate || !endDate) {
    throw new Error('Both startDate and endDate are required');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  
  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date format');
  }

  const parsedLimit = Math.min(100, parseInt(limit) || 50);
  const parsedOffset = parseInt(offset) || 0;

  // Build where clause
  const where = {
    createdAt: {
      gte: start,
      lte: end
    }
  };
  
  if (action && VALID_ACTIONS.includes(action)) {
    where.action = action;
  }
  if (adminId) {
    where.adminId = adminId;
  }

  const [history, total] = await Promise.all([
    prisma.reviewHistory.findMany({
      where,
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            artistName: true,
            fullName: true
          }
        },
        post: {
          select: {
            id: true,
            title: true,
            mediaType: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parsedLimit,
      skip: parsedOffset
    }),
    prisma.reviewHistory.count({ where })
  ]);

  return {
    history,
    total,
    hasMore: parsedOffset + parsedLimit < total,
    limit: parsedLimit,
    offset: parsedOffset,
    dateRange: { startDate: start.toISOString(), endDate: end.toISOString() }
  };
}

// AUDIT: Get complete audit trail with filters and pagination
export async function getReviewAuditTrail(options = {}) {
  const {
    limit = 50,
    offset = 0,
    action = null,
    adminId = null,
    postId = null,
    startDate = null,
    endDate = null,
    sortBy = 'createdAt',
    sortOrder = 'desc'
  } = options;

  const parsedLimit = Math.min(100, parseInt(limit) || 50);
  const parsedOffset = parseInt(offset) || 0;

  // Build where clause
  const where = {};
  
  if (action && VALID_ACTIONS.includes(action)) {
    where.action = action;
  }
  if (adminId) {
    where.adminId = adminId;
  }
  if (postId) {
    where.postId = postId;
  }
  if (startDate) {
    where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
  }
  if (endDate) {
    where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
  }

  const orderBy = {};
  orderBy[sortBy] = sortOrder === 'desc' ? 'desc' : 'asc';

  const [history, total] = await Promise.all([
    prisma.reviewHistory.findMany({
      where,
      include: {
        admin: {
          select: {
            id: true,
            email: true,
            artistName: true,
            fullName: true
          }
        },
        post: {
          select: {
            id: true,
            title: true,
            mediaType: true,
            status: true
          }
        }
      },
      orderBy,
      take: parsedLimit,
      skip: parsedOffset
    }),
    prisma.reviewHistory.count({ where })
  ]);

  // Get summary counts for dashboard
  const summary = await prisma.reviewHistory.groupBy({
    by: ['action'],
    where,
    _count: true
  });

  const summaryMap = {};
  summary.forEach(s => {
    summaryMap[s.action] = s._count;
  });

  return {
    history,
    total,
    hasMore: parsedOffset + parsedLimit < total,
    limit: parsedLimit,
    offset: parsedOffset,
    summary: summaryMap
  };
}

// AUDIT: Get summary statistics of review activity
export async function getReviewSummary(options = {}) {
  const { days = 30, adminId = null } = options;

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const where = {
    createdAt: { gte: startDate }
  };
  
  if (adminId) {
    where.adminId = adminId;
  }

  const [totalActions, actionBreakdown, uniqueAdmins, uniquePosts] = await Promise.all([
    prisma.reviewHistory.count({ where }),
    prisma.reviewHistory.groupBy({
      by: ['action'],
      where,
      _count: true
    }),
    prisma.reviewHistory.groupBy({
      by: ['adminId'],
      where,
      _count: true
    }),
    prisma.reviewHistory.groupBy({
      by: ['postId'],
      where,
      _count: true
    })
  ]);

  // Daily activity for charts
  const dailyActivity = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('day', "createdAt") as date,
      COUNT(*) as count
    FROM "ReviewHistory"
    WHERE "createdAt" >= ${startDate}
    GROUP BY DATE_TRUNC('day', "createdAt")
    ORDER BY date DESC
    LIMIT 30
  `;

  const breakdownMap = {};
  actionBreakdown.forEach(ab => {
    breakdownMap[ab.action] = ab._count;
  });

  return {
    period: `${days} days`,
    totalActions,
    actionBreakdown: breakdownMap,
    uniqueAdmins: uniqueAdmins.length,
    uniquePosts: uniquePosts.length,
    averageActionsPerDay: Math.round(totalActions / days),
    dailyActivity: dailyActivity.map(day => ({
      date: day.date,
      count: Number(day.count)
    }))
  };
}

export default {
  logReviewAction,
  getPostReviewHistory,
  getAdminReviewHistory,
  getReviewHistoryByDateRange,
  getReviewAuditTrail,
  getReviewSummary,
  VALID_ACTIONS
};