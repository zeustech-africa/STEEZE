import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient();

// Generate unsubscribe token
export function generateUnsubscribeToken(email, consentType) {
  const data = `${email}:${consentType}:${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
}

// Create opt-out record
export async function createOptOutRecord(email, consentType, source, ip, userAgent, userId = null) {
  const token = generateUnsubscribeToken(email, consentType);

  const optOut = await prisma.optOutRecord.create({
    data: {
      userId,
      email,
      consentType,
      token,
      status: 'opted_out',
      optedOutAt: new Date(),
      source,
      ipAddress: ip,
      userAgent,
    }
  });

  return optOut;
}

// Process unsubscribe (one-click)
export async function unsubscribe(token, ip, userAgent) {
  const optOut = await prisma.optOutRecord.findUnique({
    where: { token }
  });

  if (!optOut) {
    return { success: false, message: 'Invalid or expired unsubscribe link' };
  }

  if (optOut.status === 'opted_out') {
    return { success: true, message: 'Already unsubscribed', alreadyOptedOut: true };
  }

  await prisma.optOutRecord.update({
    where: { id: optOut.id },
    data: { status: 'opted_out', optedOutAt: new Date(), ipAddress: ip, userAgent }
  });

  // Also update consent record
  await prisma.consentRecord.updateMany({
    where: {
      userId: optOut.userId,
      consentType: optOut.consentType === 'all' ? undefined : optOut.consentType,
      status: 'granted'
    },
    data: { status: 'withdrawn', withdrawnAt: new Date() }
  });

  return { success: true, message: 'Successfully unsubscribed' };
}

// Check if email is opted out
export async function isOptedOut(email, consentType = 'email_marketing') {
  const optOut = await prisma.optOutRecord.findFirst({
    where: {
      email,
      consentType: { in: [consentType, 'all'] },
      status: 'opted_out'
    }
  });

  return !!optOut;
}

// Get user's opt-out status
export async function getUserOptOutStatus(userId) {
  const optOuts = await prisma.optOutRecord.findMany({
    where: { userId, status: 'opted_out' }
  });

  return {
    email_marketing: optOuts.some(o => o.consentType === 'email_marketing' || o.consentType === 'all'),
    sms_marketing: optOuts.some(o => o.consentType === 'sms_marketing' || o.consentType === 'all'),
    push_notifications: optOuts.some(o => o.consentType === 'push_notifications' || o.consentType === 'all'),
    all: optOuts.some(o => o.consentType === 'all'),
  };
}

// Remove opt-out (re-subscribe)
export async function resubscribe(email, consentType, ip, userAgent) {
  await prisma.optOutRecord.updateMany({
    where: { email, consentType: { in: [consentType, 'all'] } },
    data: { status: 'active' }
  });

  return { success: true };
}

export default { generateUnsubscribeToken, createOptOutRecord, unsubscribe, isOptedOut, getUserOptOutStatus, resubscribe };