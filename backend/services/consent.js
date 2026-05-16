import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Record consent given
export async function recordConsent(userId, consentType, source, ip, userAgent) {
  const existing = await prisma.consentRecord.findFirst({
    where: { userId, consentType, status: 'granted' }
  });
  
  if (existing) {
    return existing;
  }
  
  const consent = await prisma.consentRecord.create({
    data: {
      userId,
      consentType,
      status: 'granted',
      grantedAt: new Date(),
      ipAddress: ip,
      userAgent,
      source,
    }
  });
  
  return consent;
}

// Record consent withdrawal
export async function withdrawConsent(userId, consentType, ip, userAgent) {
  const existing = await prisma.consentRecord.findFirst({
    where: { userId, consentType, status: 'granted' }
  });
  
  if (existing) {
    await prisma.consentRecord.update({
      where: { id: existing.id },
      data: { status: 'withdrawn', withdrawnAt: new Date() }
    });
  }
  
  const withdrawal = await prisma.consentRecord.create({
    data: {
      userId,
      consentType,
      status: 'withdrawn',
      withdrawnAt: new Date(),
      ipAddress: ip,
      userAgent,
      source: 'settings',
    }
  });
  
  return withdrawal;
}

// Get user's current consent status
export async function getUserConsents(userId) {
  const consents = await prisma.consentRecord.findMany({
    where: { userId, status: 'granted' },
    distinct: ['consentType']
  });
  
  return {
    email_marketing: consents.some(c => c.consentType === 'email_marketing'),
    sms_marketing: consents.some(c => c.consentType === 'sms_marketing'),
    push_notifications: consents.some(c => c.consentType === 'push_notifications'),
    analytics: consents.some(c => c.consentType === 'analytics'),
  };
}

// Create email verification
export async function createEmailVerification(userId, email) {
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + 24);
  
  await prisma.emailVerification.create({
    data: {
      userId,
      email,
      code,
      expiresAt,
    }
  });
  
  return code;
}

// Verify email code
export async function verifyEmailCode(userId, code) {
  const verification = await prisma.emailVerification.findFirst({
    where: {
      userId,
      code,
      expiresAt: { gt: new Date() },
      verifiedAt: null
    }
  });
  
  if (!verification) {
    return false;
  }
  
  await prisma.emailVerification.update({
    where: { id: verification.id },
    data: { verifiedAt: new Date() }
  });
  
  await prisma.user.update({
    where: { id: userId },
    data: { emailVerified: true }
  });
  
  return true;
}

export default { recordConsent, withdrawConsent, getUserConsents, createEmailVerification, verifyEmailCode };