import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Get all retention policies
export async function getAllRetentionPolicies() {
  const policies = await prisma.retentionPolicy.findMany({
    orderBy: { dataType: 'asc' }
  });
  return policies;
}

// Get retention policy by data type
export async function getRetentionPolicy(dataType) {
  let policy = await prisma.retentionPolicy.findUnique({
    where: { dataType }
  });
  
  if (!policy) {
    // Create default policy
    const defaultRetentionDays = {
      audit_logs: 90,
      notifications: 30,
      sessions: 30,
      search_logs: 30,
      deleted_users: 365,
      payment_logs: 365,
      moderation_logs: 90
    };
    
    policy = await prisma.retentionPolicy.create({
      data: {
        dataType,
        retentionDays: defaultRetentionDays[dataType] || 90,
        enabled: true,
        autoDelete: true
      }
    });
  }
  
  return policy;
}

// Update retention policy
export async function updateRetentionPolicy(dataType, updates) {
  const policy = await prisma.retentionPolicy.upsert({
    where: { dataType },
    update: {
      ...updates,
      updatedAt: new Date()
    },
    create: {
      dataType,
      retentionDays: updates.retentionDays || 90,
      enabled: updates.enabled !== undefined ? updates.enabled : true,
      autoDelete: updates.autoDelete !== undefined ? updates.autoDelete : true
    }
  });
  
  return policy;
}

// Delete expired audit logs
async function cleanupAuditLogs(retentionDays) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  const result = await prisma.auditLog.deleteMany({
    where: {
      createdAt: { lt: cutoffDate },
      isImmutable: false  // Never delete immutable logs
    }
  });
  
  return result.count;
}

// Delete expired notifications
async function cleanupNotifications(retentionDays) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  const result = await prisma.notification.deleteMany({
    where: { createdAt: { lt: cutoffDate } }
  });
  
  return result.count;
}

// Delete expired sessions
async function cleanupSessions(retentionDays) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  const result = await prisma.session.deleteMany({
    where: {
      OR: [
        { expiresAt: { lt: new Date() } },  // Already expired
        { createdAt: { lt: cutoffDate } }
      ]
    }
  });
  
  return result.count;
}

// Delete expired search logs
async function cleanupSearchLogs(retentionDays) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  const result = await prisma.searchLog.deleteMany({
    where: { createdAt: { lt: cutoffDate } }
  });
  
  return result.count;
}

// Delete expired moderation logs
async function cleanupModerationLogs(retentionDays) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - retentionDays);
  
  const result = await prisma.aIModerationLog.deleteMany({
    where: { createdAt: { lt: cutoffDate } }
  });
  
  return result.count;
}

// Run retention cleanup for a specific data type
export async function runRetentionCleanup(dataType) {
  const policy = await getRetentionPolicy(dataType);
  
  if (!policy.enabled) {
    return { dataType, skipped: true, reason: 'Policy disabled' };
  }
  
  await prisma.retentionPolicy.update({
    where: { dataType },
    data: { lastRunAt: new Date(), lastRunStatus: 'running' }
  });
  
  const startTime = Date.now();
  let recordsDeleted = 0;
  let status = 'success';
  let errorMessage = null;
  
  try {
    switch (dataType) {
      case 'audit_logs':
        recordsDeleted = await cleanupAuditLogs(policy.retentionDays);
        break;
      case 'notifications':
        recordsDeleted = await cleanupNotifications(policy.retentionDays);
        break;
      case 'sessions':
        recordsDeleted = await cleanupSessions(policy.retentionDays);
        break;
      case 'search_logs':
        recordsDeleted = await cleanupSearchLogs(policy.retentionDays);
        break;
      case 'moderation_logs':
        recordsDeleted = await cleanupModerationLogs(policy.retentionDays);
        break;
      default:
        status = 'failed';
        errorMessage = `Unknown data type: ${dataType}`;
    }
  } catch (error) {
    status = 'failed';
    errorMessage = error.message;
  }
  
  // Update policy with results
  await prisma.retentionPolicy.update({
    where: { dataType },
    data: {
      lastRunStatus: status,
      lastRunCount: recordsDeleted,
      updatedAt: new Date()
    }
  });
  
  // Log the job
  await prisma.retentionJobLog.create({
    data: {
      dataType,
      recordsDeleted,
      status,
      errorMessage,
      completedAt: new Date(),
      startedAt: new Date(startTime)
    }
  });
  
  return {
    dataType,
    recordsDeleted,
    status,
    durationMs: Date.now() - startTime,
    error: errorMessage
  };
}

// Run all retention cleanups
export async function runAllRetentionCleanups() {
  const dataTypes = ['audit_logs', 'notifications', 'sessions', 'search_logs', 'moderation_logs'];
  const results = [];
  
  for (const dataType of dataTypes) {
    const result = await runRetentionCleanup(dataType);
    results.push(result);
  }
  
  return results;
}

// Get retention dashboard stats
export async function getRetentionDashboard() {
  const [policies, recentJobs, dataCounts] = await Promise.all([
    prisma.retentionPolicy.findMany(),
    prisma.retentionJobLog.findMany({
      take: 20,
      orderBy: { createdAt: 'desc' }
    }),
    // Get current data counts for each type
    Promise.all([
      prisma.auditLog.count(),
      prisma.notification.count(),
      prisma.session.count(),
      prisma.searchLog.count(),
      prisma.aIModerationLog.count()
    ])
  ]);
  
  const dataTypes = ['audit_logs', 'notifications', 'sessions', 'search_logs', 'moderation_logs'];
  const currentCounts = {};
  dataTypes.forEach((type, index) => {
    currentCounts[type] = dataCounts[index];
  });
  
  return {
    policies,
    recentJobs,
    currentCounts,
    totalRecords: dataCounts.reduce((a, b) => a + b, 0)
  };
}

// Get available data types for retention
export function getDataTypes() {
  return [
    { value: 'audit_logs', label: 'Audit Logs', defaultDays: 90, description: 'Admin action logs' },
    { value: 'notifications', label: 'User Notifications', defaultDays: 30, description: 'System notifications to users' },
    { value: 'sessions', label: 'User Sessions', defaultDays: 30, description: 'Expired user sessions' },
    { value: 'search_logs', label: 'Search Logs', defaultDays: 30, description: 'User search history' },
    { value: 'moderation_logs', label: 'AI Moderation Logs', defaultDays: 90, description: 'AI moderation decisions' }
  ];
}