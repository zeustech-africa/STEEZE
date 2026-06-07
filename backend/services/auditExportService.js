import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Generate hash for audit log entry
export function generateLogHash(log) {
  const data = `${log.id}|${log.adminId}|${log.action}|${log.targetType}|${log.targetId}|${log.createdAt}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

// Create audit log with hash (for new logs)
export async function createAuditLog(data) {
  const log = await prisma.auditLog.create({ data });
  
  const hash = generateLogHash(log);
  await prisma.auditLog.update({
    where: { id: log.id },
    data: { hash, isImmutable: true }
  });
  
  return log;
}

// Export audit logs to CSV
export async function exportAuditLogs(filters = {}, format = 'csv') {
  const where = {};
  
  if (filters.startDate) {
    where.createdAt = { gte: new Date(filters.startDate) };
  }
  if (filters.endDate) {
    where.createdAt = { ...where.createdAt, lte: new Date(filters.endDate) };
  }
  if (filters.adminId) where.adminId = filters.adminId;
  if (filters.action) where.action = filters.action;
  if (filters.targetType) where.targetType = filters.targetType;
  
  const logs = await prisma.auditLog.findMany({
    where,
    include: {
      admin: { select: { email: true, username: true } }
    },
    orderBy: { createdAt: 'desc' }
  });
  
  if (format === 'csv') {
    const headers = ['ID', 'Date', 'Admin Email', 'Action', 'Target Type', 'Target ID', 'Details', 'IP Address', 'Hash'];
    const rows = logs.map(log => [
      log.id,
      log.createdAt.toISOString(),
      log.admin?.email || 'System',
      log.action,
      log.targetType,
      log.targetId,
      JSON.stringify(log.details || {}),
      log.ipAddress || '',
      log.hash || ''
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    return csvContent;
  }
  
  return logs;
}

// Verify audit log integrity
export async function verifyLogIntegrity(logId) {
  const log = await prisma.auditLog.findUnique({ where: { id: logId } });
  if (!log) return { valid: false, error: 'Log not found' };
  if (!log.hash) return { valid: false, error: 'No hash found for this log' };
  
  const computedHash = generateLogHash(log);
  return { valid: computedHash === log.hash, computedHash, storedHash: log.hash };
}

// Get audit log statistics
export async function getAuditStats(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const [total, byAction, byAdmin, byTargetType] = await Promise.all([
    prisma.auditLog.count({ where: { createdAt: { gte: startDate } } }),
    prisma.auditLog.groupBy({
      by: ['action'],
      where: { createdAt: { gte: startDate } },
      _count: true
    }),
    prisma.auditLog.groupBy({
      by: ['adminId'],
      where: { createdAt: { gte: startDate }, adminId: { not: null } },
      _count: true
    }),
    prisma.auditLog.groupBy({
      by: ['targetType'],
      where: { createdAt: { gte: startDate } },
      _count: true
    })
  ]);
  
  return {
    total,
    byAction,
    topAdmins: byAdmin,
    byTargetType,
    period: `${days} days`
  };
}