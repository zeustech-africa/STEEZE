import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// AUDIT: Valid priority levels
const VALID_PRIORITIES = [0, 1, 2];
const PRIORITY_LABELS = { 0: 'normal', 1: 'high', 2: 'urgent' };

// AUDIT: Valid status values
const VALID_STATUSES = ['pending', 'in_review', 'approved', 'rejected'];

// AUDIT: Add content to review queue
export async function addToReviewQueue(postId, priority = 0) {
  // Input validation
  if (!postId || typeof postId !== 'string') {
    throw new Error('Invalid postId');
  }
  if (!VALID_PRIORITIES.includes(priority)) {
    throw new Error(`Invalid priority. Must be 0 (normal), 1 (high), or 2 (urgent)`);
  }

  // Check if post already in queue
  const existing = await prisma.reviewQueue.findUnique({
    where: { postId }
  });

  if (existing) {
    // Update priority if needed
    if (existing.priority !== priority) {
      return await prisma.reviewQueue.update({
        where: { postId },
        data: { priority, updatedAt: new Date() }
      });
    }
    return existing;
  }

  // Create new queue entry
  const queueItem = await prisma.reviewQueue.create({
    data: {
      postId,
      priority,
      status: 'pending',
      submittedAt: new Date()
    }
  });

  return queueItem;
}

// AUDIT: Get pending reviews with filters and pagination
export async function getPendingReviews(options = {}) {
  const {
    status = 'pending',
    priority = null,
    assignedTo = null,
    limit = 50,
    offset = 0,
    sortBy = 'submittedAt',
    sortOrder = 'asc'
  } = options;

  // Validate status
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  // Build where clause
  const where = { status };
  
  if (priority !== null && VALID_PRIORITIES.includes(priority)) {
    where.priority = priority;
  }
  
  if (assignedTo !== null) {
    where.assignedTo = assignedTo;
  }

  const parsedLimit = Math.min(100, parseInt(limit) || 50);
  const parsedOffset = parseInt(offset) || 0;

  const orderBy = {};
  orderBy[sortBy] = sortOrder === 'desc' ? 'desc' : 'asc';

  const [items, total] = await Promise.all([
    prisma.reviewQueue.findMany({
      where,
      include: {
        post: {
          include: {
            creator: {
              select: {
                id: true,
                artistName: true,
                fullName: true,
                email: true
              }
            }
          }
        }
      },
      orderBy,
      take: parsedLimit,
      skip: parsedOffset
    }),
    prisma.reviewQueue.count({ where })
  ]);

  return {
    items,
    total,
    hasMore: parsedOffset + parsedLimit < total,
    limit: parsedLimit,
    offset: parsedOffset
  };
}

// AUDIT: Get review queue statistics
export async function getReviewQueueStats() {
  const [byStatus, byPriority, totalPending] = await Promise.all([
    prisma.reviewQueue.groupBy({
      by: ['status'],
      _count: true
    }),
    prisma.reviewQueue.groupBy({
      by: ['priority'],
      where: { status: 'pending' },
      _count: true
    }),
    prisma.reviewQueue.count({
      where: { status: 'pending' }
    })
  ]);

  // Calculate average wait time for pending items
  const pendingItems = await prisma.reviewQueue.findMany({
    where: { status: 'pending' },
    select: { submittedAt: true }
  });

  let averageWaitMinutes = 0;
  if (pendingItems.length > 0) {
    const now = new Date();
    const totalWaitMs = pendingItems.reduce((sum, item) => {
      return sum + (now - new Date(item.submittedAt));
    }, 0);
    averageWaitMinutes = Math.floor(totalWaitMs / (pendingItems.length * 60 * 1000));
  }

  const statusMap = {};
  byStatus.forEach(s => { statusMap[s.status] = s._count; });

  const priorityMap = {};
  byPriority.forEach(p => { priorityMap[PRIORITY_LABELS[p.priority]] = p._count; });

  return {
    byStatus: {
      pending: statusMap.pending || 0,
      in_review: statusMap.in_review || 0,
      approved: statusMap.approved || 0,
      rejected: statusMap.rejected || 0
    },
    byPriority: {
      normal: priorityMap.normal || 0,
      high: priorityMap.high || 0,
      urgent: priorityMap.urgent || 0
    },
    totalPending,
    averageWaitMinutes
  };
}

// AUDIT: Assign an admin to a review item
export async function assignReviewer(postId, adminId) {
  if (!postId || typeof postId !== 'string') {
    throw new Error('Invalid postId');
  }
  if (!adminId || typeof adminId !== 'string') {
    throw new Error('Invalid adminId');
  }

  const queueItem = await prisma.reviewQueue.findUnique({
    where: { postId }
  });

  if (!queueItem) {
    throw new Error('Review queue item not found');
  }

  const updated = await prisma.reviewQueue.update({
    where: { postId },
    data: {
      assignedTo: adminId,
      status: queueItem.status === 'pending' ? 'in_review' : queueItem.status
    }
  });

  return updated;
}

// AUDIT: Update priority of a queue item
export async function updatePriority(postId, priority) {
  if (!postId || typeof postId !== 'string') {
    throw new Error('Invalid postId');
  }
  if (!VALID_PRIORITIES.includes(priority)) {
    throw new Error(`Invalid priority. Must be 0 (normal), 1 (high), or 2 (urgent)`);
  }

  const queueItem = await prisma.reviewQueue.findUnique({
    where: { postId }
  });

  if (!queueItem) {
    throw new Error('Review queue item not found');
  }

  const updated = await prisma.reviewQueue.update({
    where: { postId },
    data: { priority }
  });

  return updated;
}

// AUDIT: Get single review queue item by postId
export async function getReviewQueueItem(postId) {
  if (!postId || typeof postId !== 'string') {
    throw new Error('Invalid postId');
  }

  const queueItem = await prisma.reviewQueue.findUnique({
    where: { postId },
    include: {
      post: {
        include: {
          creator: {
            select: {
              id: true,
              artistName: true,
              fullName: true,
              email: true
            }
          }
        }
      }
    }
  });

  return queueItem;
}

// AUDIT: Remove item from queue after review
export async function removeFromQueue(postId, status = 'approved') {
  if (!postId || typeof postId !== 'string') {
    throw new Error('Invalid postId');
  }
  if (!VALID_STATUSES.includes(status)) {
    throw new Error(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
  }

  const queueItem = await prisma.reviewQueue.findUnique({
    where: { postId }
  });

  if (!queueItem) {
    throw new Error('Review queue item not found');
  }

  const updated = await prisma.reviewQueue.update({
    where: { postId },
    data: {
      status,
      reviewedAt: new Date()
    }
  });

  return updated;
}

export default {
  addToReviewQueue,
  getPendingReviews,
  getReviewQueueStats,
  assignReviewer,
  updatePriority,
  getReviewQueueItem,
  removeFromQueue,
  VALID_PRIORITIES,
  VALID_STATUSES,
  PRIORITY_LABELS
};