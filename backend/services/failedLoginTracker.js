import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const FAILED_ATTEMPT_WINDOW = 15 * 60 * 1000; // 15 minutes
const MAX_FAILED_ATTEMPTS = 5;

export async function trackFailedLogin(email, ip, userAgent) {
  const windowStart = new Date(Date.now() - FAILED_ATTEMPT_WINDOW);
  
  // Record the failed attempt
  await prisma.failedLoginAttempt.create({
    data: {
      email,
      ip,
      userAgent,
      attemptedAt: new Date()
    }
  });
  
  // Count failed attempts in the time window
  const failedCount = await prisma.failedLoginAttempt.count({
    where: {
      email,
      attemptedAt: { gte: windowStart }
    }
  });
  
  // If 5 or more failed attempts, trigger alert
  if (failedCount >= MAX_FAILED_ATTEMPTS) {
    await createSecurityEvent(email, ip, failedCount);
    await createAuditLog(email, ip, failedCount);
    await sendUserNotification(email, failedCount);
    await sendAdminAlert(email, ip, failedCount);
  }
  
  return { failedCount, thresholdReached: failedCount >= MAX_FAILED_ATTEMPTS };
}

async function createSecurityEvent(email, ip, attemptCount) {
  await prisma.securityEvent.create({
    data: {
      type: 'FAILED_LOGIN_THRESHOLD',
      severity: 'HIGH',
      email,
      ip,
      details: {
        attemptCount,
        windowMinutes: FAILED_ATTEMPT_WINDOW / 60000,
        timestamp: new Date().toISOString()
      },
      createdAt: new Date()
    }
  });
}

async function createAuditLog(email, ip, attemptCount) {
  await prisma.auditLog.create({
    data: {
      action: 'FAILED_LOGIN_ALERT',
      targetType: 'user',
      targetId: email,
      details: {
        ip,
        attemptCount,
        message: `${attemptCount} failed login attempts detected for ${email}`
      },
      createdAt: new Date()
    }
  });
}

async function sendUserNotification(email, attemptCount) {
  // Store notification in database
  await prisma.notification.create({
    data: {
      type: 'security_alert',
      title: 'Multiple Failed Login Attempts',
      message: `We detected ${attemptCount} failed login attempts on your account. If this wasn't you, please reset your password immediately.`,
      targetEmail: email,
      isRead: false,
      createdAt: new Date()
    }
  });
}

async function sendAdminAlert(email, ip, attemptCount) {
  // Create admin alert
  await prisma.adminAlert.create({
    data: {
      type: 'SECURITY',
      severity: 'HIGH',
      title: 'Failed Login Threshold Reached',
      message: `${attemptCount} failed login attempts for ${email} from IP ${ip}`,
      isResolved: false,
      createdAt: new Date()
    }
  });
}

export async function resetFailedAttempts(email) {
  // Called after successful login
  await prisma.failedLoginAttempt.deleteMany({
    where: { email }
  });
}