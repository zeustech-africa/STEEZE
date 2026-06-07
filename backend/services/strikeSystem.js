import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Strike definitions
const STRIKE_RULES = {
  1: { action: 'warning', durationHours: null, description: 'First violation - Warning' },
  2: { action: 'restriction_24h', durationHours: 24, description: 'Second violation - 24 hour restriction' },
  3: { action: 'restriction_7d', durationHours: 168, description: 'Third violation - 7 day restriction' },
  4: { action: 'monetization_removed', durationHours: null, description: 'Fourth violation - Monetization removed' },
  5: { action: 'permanent_ban', durationHours: null, description: 'Fifth violation - Permanent ban' }
};

// Get active strikes count for a user
export async function getActiveStrikeCount(userId) {
  const count = await prisma.userStrike.count({
    where: {
      userId,
      status: 'active'
    }
  });
  return count;
}

// Get strike history for a user
export async function getStrikeHistory(userId) {
  const strikes = await prisma.userStrike.findMany({
    where: { userId },
    include: {
      issuer: {
        select: { id: true, email: true, username: true }
      }
    },
    orderBy: { issuedAt: 'desc' }
  });
  return strikes;
}

// Apply strike to user
export async function applyStrike(userId, reason, issuedBy, type = 'warning') {
  // Get current active strike count
  const currentStrikes = await getActiveStrikeCount(userId);
  const strikeNumber = currentStrikes + 1;
  
  if (strikeNumber > 5) {
    throw new Error('User already has maximum strikes (5)');
  }
  
  const strikeRule = STRIKE_RULES[strikeNumber];
  
  // Calculate expiration if applicable
  let expiresAt = null;
  if (strikeRule.durationHours) {
    expiresAt = new Date(Date.now() + strikeRule.durationHours * 60 * 60 * 1000);
  }
  
  // Create strike record
  const strike = await prisma.userStrike.create({
    data: {
      userId,
      reason,
      type: strikeRule.action,
      severity: strikeNumber,
      issuedBy,
      expiresAt,
      status: 'active'
    }
  });
  
  // Apply the corresponding action to the user
  await applyStrikeAction(userId, strikeRule.action, expiresAt, issuedBy, strikeNumber);
  
  // Create audit log
  await prisma.auditLog.create({
    data: {
      adminId: issuedBy,
      action: 'apply_strike',
      targetType: 'user',
      targetId: userId,
      details: { strikeNumber, type: strikeRule.action, reason }
    }
  });
  
  // Create notification for user
  await createStrikeNotification(userId, strikeRule.action, strikeNumber, expiresAt);
  
  return { strike, strikeNumber, action: strikeRule.action };
}

// Apply strike action to user account
async function applyStrikeAction(userId, action, expiresAt, adminId, strikeNumber) {
  switch (action) {
    case 'warning':
      // Just notification, no account action
      break;
      
    case 'restriction_24h':
      await prisma.user.update({
        where: { id: userId },
        data: { isSuspended: true, suspendedUntil: expiresAt }
      });
      break;
      
    case 'restriction_7d':
      await prisma.user.update({
        where: { id: userId },
        data: { isSuspended: true, suspendedUntil: expiresAt }
      });
      break;
      
    case 'monetization_removed':
      await prisma.user.update({
        where: { id: userId },
        data: { monetizationEnabled: false }
      });
      break;
      
    case 'permanent_ban':
      await prisma.user.update({
        where: { id: userId },
        data: { isBanned: true, isPermanentlyBanned: true }
      });
      break;
  }
}

// Create notification for strike
async function createStrikeNotification(userId, action, strikeNumber, expiresAt) {
  let message = '';
  switch (action) {
    case 'warning':
      message = `Strike ${strikeNumber} issued: Warning. Further violations will result in restrictions.`;
      break;
    case 'restriction_24h':
      message = `Strike ${strikeNumber} issued: 24 hour restriction. Your account is suspended until ${expiresAt}.`;
      break;
    case 'restriction_7d':
      message = `Strike ${strikeNumber} issued: 7 day restriction. Your account is suspended until ${expiresAt}.`;
      break;
    case 'monetization_removed':
      message = `Strike ${strikeNumber} issued: Monetization privileges removed.`;
      break;
    case 'permanent_ban':
      message = `Strike ${strikeNumber} issued: Permanent ban. Your account has been permanently banned.`;
      break;
  }
  
  await prisma.notification.create({
    data: {
      userId,
      type: 'strike',
      title: `Strike ${strikeNumber} Issued`,
      message,
      isRead: false
    }
  });
}

// Check if user can post content
export async function canUserPost(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isBanned: true, isSuspended: true, suspendedUntil: true, monetizationEnabled: true }
  });
  
  if (user.isBanned) return false;
  if (user.isSuspended && user.suspendedUntil && new Date(user.suspendedUntil) > new Date()) return false;
  if (user.isSuspended && !user.suspendedUntil) return false;
  
  return true;
}

// Get user's current restriction status
export async function getUserRestrictionStatus(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { isBanned: true, isSuspended: true, suspendedUntil: true, monetizationEnabled: true }
  });
  
  const activeStrikes = await getActiveStrikeCount(userId);
  
  return {
    isBanned: user.isBanned,
    isSuspended: user.isSuspended,
    suspendedUntil: user.suspendedUntil,
    monetizationEnabled: user.monetizationEnabled,
    activeStrikes
  };
}