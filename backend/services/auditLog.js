import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function createAuditLog({ userId, action, targetUserId, details }) {
  try {
    return await prisma.auditLog.create({
      data: {
        userId,
        action,
        targetUserId,
        details: details || {},
        createdAt: new Date()
      }
    });
  } catch (error) {
    console.error('Failed to create audit log:', error);
    return null;
  }
}

export async function getAuditLogs({ userId, action, limit = 50 }) {
  try {
    return await prisma.auditLog.findMany({
      where: {
        ...(userId && { userId }),
        ...(action && { action })
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  } catch (error) {
    console.error('Failed to fetch audit logs:', error);
    return [];
  }
}