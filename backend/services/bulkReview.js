import { PrismaClient } from '@prisma/client';
import { addToReviewQueue, removeFromQueue } from './reviewQueue.js';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// AUDIT: Maximum batch size for bulk operations
const MAX_BATCH_SIZE = 100;

// AUDIT: Valid priority levels
const VALID_PRIORITIES = [0, 1, 2];

// AUDIT: Valid status values for queue items
const VALID_STATUSES = ['pending', 'in_review'];

// AUDIT: Validate bulk operation inputs
export async function validateBulkOperation(postIds, action, options = {}) {
  // Validate postIds array
  if (!Array.isArray(postIds) || postIds.length === 0) {
    throw new Error('postIds must be a non-empty array');
  }
  
  if (postIds.length > MAX_BATCH_SIZE) {
    throw new Error(`Batch size exceeds maximum of ${MAX_BATCH_SIZE}`);
  }
  
  // Validate each postId is a string
  for (const id of postIds) {
    if (typeof id !== 'string') {
      throw new Error('Each postId must be a string');
    }
  }
  
  // Validate action
  const validActions = ['approve', 'reject', 'assign', 'updatePriority'];
  if (!validActions.includes(action)) {
    throw new Error(`Invalid action. Must be one of: ${validActions.join(', ')}`);
  }
  
  // Action-specific validation
  if (action === 'reject' && (!options.rejectionReason || typeof options.rejectionReason !== 'string')) {
    throw new Error('Rejection reason required for reject action');
  }
  
  if (action === 'assign' && (!options.adminId || typeof options.adminId !== 'string')) {
    throw new Error('Admin ID required for assign action');
  }
  
  if (action === 'updatePriority' && (!VALID_PRIORITIES.includes(options.priority))) {
    throw new Error('Valid priority required for updatePriority action (0,1,2)');
  }
  
  // Verify all posts exist and are in valid status
  const queueItems = await prisma.reviewQueue.findMany({
    where: {
      postId: { in: postIds },
      status: { in: VALID_STATUSES }
    },
    select: { postId: true, status: true }
  });
  
  const foundPostIds = queueItems.map(q => q.postId);
  const missingIds = postIds.filter(id => !foundPostIds.includes(id));
  
  if (missingIds.length > 0) {
    throw new Error(`Posts not found or not in valid status: ${missingIds.join(', ')}`);
  }
  
  return { valid: true, queueItems, count: queueItems.length };
}

// AUDIT: Bulk approve multiple posts
export async function bulkApprove(postIds, adminId, options = {}) {
  const { notes = null } = options;
  
  // Validate operation
  await validateBulkOperation(postIds, 'approve');
  
  const results = {
    success: [],
    failed: [],
    total: postIds.length,
    timestamp: new Date().toISOString()
  };
  
  // Process in transaction
  await prisma.$transaction(async (tx) => {
    for (const postId of postIds) {
      try {
        // Get queue item
        const queueItem = await tx.reviewQueue.findUnique({
          where: { postId }
        });
        
        if (!queueItem || queueItem.status !== 'pending') {
          results.failed.push({ postId, reason: 'Not in pending status' });
          continue;
        }
        
        // Update review queue
        await tx.reviewQueue.update({
          where: { postId },
          data: {
            status: 'approved',
            reviewedAt: new Date(),
            assignedTo: adminId
          }
        });
        
        // Update post status to approved_global
        await tx.post.update({
          where: { id: postId },
          data: { status: 'approved_global' }
        });
        
        // Add review history entry
        await tx.reviewHistory.create({
          data: {
            postId,
            adminId,
            action: 'bulk_approved',
            notes: notes,
            previousStatus: queueItem.status,
            newStatus: 'approved',
            metadata: { batchSize: postIds.length }
          }
        });
        
        results.success.push({ postId });
      } catch (error) {
        results.failed.push({ postId, reason: error.message });
      }
    }
  });
  
  return results;
}

// AUDIT: Bulk reject multiple posts
export async function bulkReject(postIds, adminId, rejectionReason, options = {}) {
  const { notes = null } = options;
  
  // Validate operation
  await validateBulkOperation(postIds, 'reject', { rejectionReason });
  
  const results = {
    success: [],
    failed: [],
    total: postIds.length,
    rejectionReason,
    timestamp: new Date().toISOString()
  };
  
  // Process in transaction
  await prisma.$transaction(async (tx) => {
    for (const postId of postIds) {
      try {
        // Get queue item
        const queueItem = await tx.reviewQueue.findUnique({
          where: { postId }
        });
        
        if (!queueItem || queueItem.status !== 'pending') {
          results.failed.push({ postId, reason: 'Not in pending status' });
          continue;
        }
        
        // Update review queue
        await tx.reviewQueue.update({
          where: { postId },
          data: {
            status: 'rejected',
            reviewedAt: new Date(),
            assignedTo: adminId
          }
        });
        
        // Update post status to rejected
        await tx.post.update({
          where: { id: postId },
          data: { status: 'rejected' }
        });
        
        // Add review history entry
        await tx.reviewHistory.create({
          data: {
            postId,
            adminId,
            action: 'bulk_rejected',
            notes: notes || rejectionReason,
            previousStatus: queueItem.status,
            newStatus: 'rejected',
            metadata: { batchSize: postIds.length, rejectionReason }
          }
        });
        
        results.success.push({ postId });
      } catch (error) {
        results.failed.push({ postId, reason: error.message });
      }
    }
  });
  
  return results;
}

// AUDIT: Bulk assign multiple items to admin
export async function bulkAssign(postIds, adminId, targetAdminId, options = {}) {
  const { notes = null } = options;
  
  // Validate operation
  await validateBulkOperation(postIds, 'assign', { adminId: targetAdminId });
  
  const results = {
    success: [],
    failed: [],
    total: postIds.length,
    assignedTo: targetAdminId,
    timestamp: new Date().toISOString()
  };
  
  // Process in transaction
  await prisma.$transaction(async (tx) => {
    for (const postId of postIds) {
      try {
        // Get queue item
        const queueItem = await tx.reviewQueue.findUnique({
          where: { postId }
        });
        
        if (!queueItem || (queueItem.status !== 'pending' && queueItem.status !== 'in_review')) {
          results.failed.push({ postId, reason: 'Not in pending or in_review status' });
          continue;
        }
        
        // Update queue item with assignment
        await tx.reviewQueue.update({
          where: { postId },
          data: {
            assignedTo: targetAdminId,
            status: queueItem.status === 'pending' ? 'in_review' : queueItem.status
          }
        });
        
        // Add review history entry
        await tx.reviewHistory.create({
          data: {
            postId,
            adminId,
            action: 'bulk_assigned',
            notes: notes,
            previousStatus: queueItem.status,
            newStatus: queueItem.status === 'pending' ? 'in_review' : queueItem.status,
            metadata: { batchSize: postIds.length, assignedTo: targetAdminId }
          }
        });
        
        results.success.push({ postId });
      } catch (error) {
        results.failed.push({ postId, reason: error.message });
      }
    }
  });
  
  return results;
}

// AUDIT: Bulk update priority for multiple items
export async function bulkUpdatePriority(postIds, adminId, priority, options = {}) {
  const { notes = null } = options;
  
  // Validate operation
  await validateBulkOperation(postIds, 'updatePriority', { priority });
  
  const results = {
    success: [],
    failed: [],
    total: postIds.length,
    priority,
    priorityLabel: priority === 0 ? 'normal' : (priority === 1 ? 'high' : 'urgent'),
    timestamp: new Date().toISOString()
  };
  
  // Process in transaction
  await prisma.$transaction(async (tx) => {
    for (const postId of postIds) {
      try {
        // Get queue item
        const queueItem = await tx.reviewQueue.findUnique({
          where: { postId }
        });
        
        if (!queueItem) {
          results.failed.push({ postId, reason: 'Queue item not found' });
          continue;
        }
        
        // Update priority
        await tx.reviewQueue.update({
          where: { postId },
          data: { priority }
        });
        
        // Add review history entry
        await tx.reviewHistory.create({
          data: {
            postId,
            adminId,
            action: 'priority_updated',
            notes: notes,
            previousStatus: queueItem.status,
            newStatus: queueItem.status,
            metadata: { 
              batchSize: postIds.length, 
              oldPriority: queueItem.priority,
              newPriority: priority 
            }
          }
        });
        
        results.success.push({ postId });
      } catch (error) {
        results.failed.push({ postId, reason: error.message });
      }
    }
  });
  
  return results;
}

// AUDIT: Get bulk operation statistics
export async function getBulkOperationStats(adminId, options = {}) {
  const { days = 7, limit = 50 } = options;
  
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const parsedLimit = Math.min(100, parseInt(limit) || 50);
  
  const history = await prisma.reviewHistory.findMany({
    where: {
      adminId,
      action: { in: ['bulk_approved', 'bulk_rejected', 'bulk_assigned'] },
      createdAt: { gte: startDate }
    },
    orderBy: { createdAt: 'desc' },
    take: parsedLimit
  });
  
  const summary = await prisma.reviewHistory.groupBy({
    by: ['action'],
    where: {
      adminId,
      action: { in: ['bulk_approved', 'bulk_rejected', 'bulk_assigned'] },
      createdAt: { gte: startDate }
    },
    _count: true
  });
  
  const summaryMap = {};
  summary.forEach(s => {
    summaryMap[s.action] = s._count;
  });
  
  return {
    period: `${days} days`,
    totalBulkActions: history.length,
    summary: {
      bulkApproved: summaryMap.bulk_approved || 0,
      bulkRejected: summaryMap.bulk_rejected || 0,
      bulkAssigned: summaryMap.bulk_assigned || 0
    },
    recentActions: history.slice(0, 20).map(h => ({
      action: h.action,
      postId: h.postId,
      createdAt: h.createdAt,
      metadata: h.metadata
    }))
  };
}

export default {
  bulkApprove,
  bulkReject,
  bulkAssign,
  bulkUpdatePriority,
  validateBulkOperation,
  getBulkOperationStats,
  MAX_BATCH_SIZE
};