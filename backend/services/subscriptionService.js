import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// AUDIT: Subscription tier mapping
const TIER_ORDER = {
  free: 0,
  basic: 1,
  premium: 2,
  gold: 3,
};

// AUDIT: Retry schedule (days after initial failure)
const RETRY_SCHEDULE = [1, 3, 7];

// AUDIT: Grace period in days
const GRACE_PERIOD_DAYS = 7;

// ─── Native date helpers (avoids date-fns dependency) ───
function addDays(date, days) {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

// ─── AUDIT: Get current subscription status for a user ───
export async function getSubscriptionStatus(userId) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionTier: true,
      subscriptionStatus: true,
      subscriptionExpiresAt: true,
      gracePeriodEndsAt: true,
      paymentFailureCount: true,
    },
  });

  if (!user) {
    return { tier: 'free', status: 'active', isActive: true };
  }

  const now = new Date();
  let isActive = false;
  let status = user.subscriptionStatus;

  // Check if subscription is active
  if (user.subscriptionStatus === 'active') {
    if (user.subscriptionExpiresAt && now > new Date(user.subscriptionExpiresAt)) {
      status = 'expired';
      isActive = false;
    } else {
      isActive = true;
    }
  } else if (user.subscriptionStatus === 'grace_period') {
    if (user.gracePeriodEndsAt && now > new Date(user.gracePeriodEndsAt)) {
      status = 'expired';
      isActive = false;
    } else {
      isActive = true;
    }
  }

  return {
    tier: user.subscriptionTier,
    status,
    isActive,
    expiresAt: user.subscriptionExpiresAt,
    gracePeriodEndsAt: user.gracePeriodEndsAt,
    failureCount: user.paymentFailureCount,
  };
}

// ─── AUDIT: Record a payment failure ───
export async function recordPaymentFailure(userId, amount, errorMessage = null) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { paymentFailureCount: true, subscriptionTier: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  const newFailureCount = user.paymentFailureCount + 1;
  const retryDay = RETRY_SCHEDULE[newFailureCount - 1] || null;

  // Update user with new failure count and grace period
  await prisma.user.update({
    where: { id: userId },
    data: {
      paymentFailureCount: newFailureCount,
      subscriptionStatus: 'grace_period',
      gracePeriodEndsAt: addDays(new Date(), GRACE_PERIOD_DAYS),
      lastPaymentAttemptAt: new Date(),
    },
  });

  // Log the failure
  const failureLog = await prisma.paymentFailureLog.create({
    data: {
      userId,
      attemptNumber: newFailureCount,
      amount: amount || 0,
      errorMessage,
      status: retryDay ? 'retry_scheduled' : 'failed',
    },
  });

  // Send notification to user
  await sendFailureNotification(userId, newFailureCount, retryDay);

  // Schedule retry if applicable, otherwise schedule downgrade after grace period
  if (retryDay) {
    scheduleRetry(userId, retryDay, amount);
  } else {
    await scheduleDowngrade(userId);
  }

  return {
    failureCount: newFailureCount,
    retryScheduled: !!retryDay,
    retryDay,
    gracePeriodEndsAt: addDays(new Date(), GRACE_PERIOD_DAYS),
  };
}

// ─── Schedule a retry attempt ───
// In production, use a job queue (Bull/BullMQ) and a cron worker that polls
// PaymentFailureLog for records with status='retry_scheduled' and a due date.
async function scheduleRetry(userId, daysFromNow, amount) {
  const retryDate = addDays(new Date(), daysFromNow);

  // Store the retry date on the latest failure log for this user
  await prisma.paymentFailureLog.updateMany({
    where: { userId, status: 'retry_scheduled' },
    data: { notifiedAt: retryDate },
  });

  console.log(
    `[Subscription] Scheduled payment retry for user ${userId} on ${retryDate.toISOString()}`
  );
}

// ─── Schedule downgrade after grace period ───
// In production, use a job queue (Bull/BullMQ) and a cron worker that checks
// for users whose gracePeriodEndsAt has passed.
async function scheduleDowngrade(userId) {
  const downgradeDate = addDays(new Date(), GRACE_PERIOD_DAYS);

  console.log(
    `[Subscription] Scheduled downgrade for user ${userId} on ${downgradeDate.toISOString()}`
  );
}

// ─── AUDIT: Process a retry payment attempt ───
export async function processRetry(userId, amount) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { paymentFailureCount: true },
  });

  if (!user) {
    throw new Error('User not found');
  }

  let success = false;
  let errorMessage = null;

  try {
    // const result = await chargePaymentMethod(userId, amount);
    // success = result.success;

    // For MVP, simulate successful retry
    success = true;
  } catch (error) {
    errorMessage = error.message;
    success = false;
  }

  if (success) {
    // Reset failure count on successful payment
    await prisma.user.update({
      where: { id: userId },
      data: {
        paymentFailureCount: 0,
        subscriptionStatus: 'active',
        gracePeriodEndsAt: null,
        subscriptionExpiresAt: addDays(new Date(), 30), // Extend by 30 days
        lastPaymentAttemptAt: new Date(),
      },
    });

    // Update failure logs to resolved
    await prisma.paymentFailureLog.updateMany({
      where: { userId, status: 'retry_scheduled' },
      data: { status: 'resolved' },
    });

    // Send success notification
    await sendPaymentRecoveredNotification(userId);

    return { success: true, message: 'Payment recovered' };
  } else {
    // Record another failure
    return await recordPaymentFailure(userId, amount, errorMessage);
  }
}

// ─── AUDIT: Apply grace period to user ───
export async function applyGracePeriod(userId, days = GRACE_PERIOD_DAYS) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }

  const gracePeriodEndsAt = addDays(new Date(), days);

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionStatus: 'grace_period',
      gracePeriodEndsAt,
    },
  });

  return { gracePeriodEndsAt };
}

// ─── AUDIT: Downgrade subscription to FREE VIBES ───
export async function downgradeSubscription(userId) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  if (!user) {
    throw new Error('User not found');
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: 'free',
      subscriptionStatus: 'expired',
      subscriptionExpiresAt: null,
      gracePeriodEndsAt: null,
      paymentFailureCount: 0,
    },
  });

  // Send downgrade notification
  await sendDowngradeNotification(userId, user.subscriptionTier);

  return {
    success: true,
    previousTier: user.subscriptionTier,
    newTier: 'free',
    message: 'Subscription downgraded to FREE VIBES',
  };
}

// ─── AUDIT: Send failure notification to user ───
export async function sendFailureNotification(userId, failureCount, retryDay) {
  if (!userId) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, artistName: true },
  });

  if (!user) return;

  const message = retryDay
    ? `Your subscription payment failed. We will automatically retry in ${retryDay} day(s). You have a 7-day grace period to update your payment method.`
    : `Your subscription payment has failed after multiple attempts. You have been moved to the FREE VIBES plan. Update your payment method to restore your benefits.`;

  // Create in-app notification (schema: type + message)
  await prisma.notification.create({
    data: {
      userId,
      type: 'payment_failed',
      message,
    },
  });

  // TODO: Send email notification via email service
  console.log(`[Subscription] Failure notification sent to ${user.email}`);
}

// ─── Send payment recovered notification ───
async function sendPaymentRecoveredNotification(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user) return;

  await prisma.notification.create({
    data: {
      userId,
      type: 'payment_recovered',
      message:
        'Your subscription payment has been successfully processed. Thank you for your continued support!',
    },
  });

  console.log(`[Subscription] Recovery notification sent to ${user.email}`);
}

// ─── Send downgrade notification ───
async function sendDowngradeNotification(userId, previousTier) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });

  if (!user) return;

  await prisma.notification.create({
    data: {
      userId,
      type: 'subscription_downgraded',
      message: `Your ${previousTier.toUpperCase()} VIBES subscription has ended. You are now on the FREE VIBES plan. Upgrade anytime to restore your benefits.`,
    },
  });

  console.log(`[Subscription] Downgrade notification sent to ${user.email}`);
}

// ─── Helper: get current failure count ───
async function getFailureCount(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { paymentFailureCount: true },
  });
  return user?.paymentFailureCount || 0;
}

export default {
  getSubscriptionStatus,
  recordPaymentFailure,
  processRetry,
  applyGracePeriod,
  downgradeSubscription,
  sendFailureNotification,
  TIER_ORDER,
  RETRY_SCHEDULE,
  GRACE_PERIOD_DAYS,
};