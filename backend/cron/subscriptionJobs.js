import { PrismaClient } from '@prisma/client';
import { addDays, isAfter, isBefore, subDays } from 'date-fns';
import { 
  downgradeSubscription, 
  processRetry, 
  sendFailureNotification,
  getSubscriptionStatus
} from '../services/subscriptionService.js';

const prisma = new PrismaClient();

// AUDIT: Process expired subscriptions and downgrade them
export async function processExpiredSubscriptions() {
  const now = new Date();
  
  console.log(`[Cron] Processing expired subscriptions at ${now.toISOString()}`);
  
  try {
    // Find subscriptions that have expired (expiresAt < now and status is active or grace_period)
    const expiredSubscriptions = await prisma.user.findMany({
      where: {
        subscriptionTier: { not: 'free' },
        subscriptionStatus: { in: ['active', 'grace_period'] },
        OR: [
          { subscriptionExpiresAt: { lt: now } },
          { gracePeriodEndsAt: { lt: now } }
        ]
      },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        subscriptionStatus: true,
        subscriptionExpiresAt: true,
        gracePeriodEndsAt: true
      }
    });
    
    console.log(`[Cron] Found ${expiredSubscriptions.length} expired subscriptions`);
    
    for (const user of expiredSubscriptions) {
      try {
        await downgradeSubscription(user.id);
        console.log(`[Cron] Downgraded user ${user.id} from ${user.subscriptionTier} to free`);
      } catch (error) {
        console.error(`[Cron] Failed to downgrade user ${user.id}:`, error);
      }
    }
    
    return { processed: expiredSubscriptions.length };
  } catch (error) {
    console.error('[Cron] Error processing expired subscriptions:', error);
    return { error: error.message };
  }
}

// AUDIT: Process scheduled payment retries
export async function processScheduledRetries() {
  const now = new Date();
  
  console.log(`[Cron] Processing scheduled retries at ${now.toISOString()}`);
  
  try {
    // Use PaymentFailureLog for retry tracking since ScheduledJob model doesn't exist
    const pendingRetries = await prisma.paymentFailureLog.findMany({
      where: {
        status: 'retry_scheduled',
        notifiedAt: { lte: now }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    console.log(`[Cron] Found ${pendingRetries.length} pending retries`);
    
    const results = { success: [], failed: [] };
    
    for (const job of pendingRetries) {
      try {
        const amount = job.amount || 0;
        const result = await processRetry(job.userId, amount);
        
        if (result.success) {
          results.success.push({ userId: job.userId, message: result.message });
          
          // Mark as resolved
          await prisma.paymentFailureLog.update({
            where: { id: job.id },
            data: { status: 'resolved' }
          });
        } else {
          results.failed.push({ userId: job.userId, error: result.error });
          
          // Increment attempt and mark if exhausted
          const newAttempt = job.attemptNumber + 1;
          await prisma.paymentFailureLog.update({
            where: { id: job.id },
            data: {
              attemptNumber: newAttempt,
              status: newAttempt >= 3 ? 'failed' : 'retry_scheduled',
              errorMessage: result.error
            }
          });
          
          // Notify on final failure
          if (newAttempt >= 3) {
            await sendFailureNotification(job.userId);
          }
        }
      } catch (error) {
        console.error(`[Cron] Failed to process retry for user ${job.userId}:`, error);
        results.failed.push({ userId: job.userId, error: error.message });
      }
    }
    
    return results;
  } catch (error) {
    console.error('[Cron] Error processing scheduled retries:', error);
    return { error: error.message };
  }
}

// AUDIT: Send expiration reminders to users
export async function sendExpirationReminders() {
  const now = new Date();
  const threeDaysFromNow = addDays(now, 3);
  const oneDayFromNow = addDays(now, 1);
  
  console.log(`[Cron] Sending expiration reminders at ${now.toISOString()}`);
  
  try {
    // Find subscriptions expiring in 3 days
    const expiringIn3Days = await prisma.user.findMany({
      where: {
        subscriptionTier: { not: 'free' },
        subscriptionStatus: 'active',
        subscriptionExpiresAt: {
          gt: now,
          lt: threeDaysFromNow
        }
      },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true
      }
    });
    
    // Find subscriptions expiring in 1 day (urgent)
    const expiringIn1Day = await prisma.user.findMany({
      where: {
        subscriptionTier: { not: 'free' },
        subscriptionStatus: 'active',
        subscriptionExpiresAt: {
          gt: now,
          lt: oneDayFromNow
        }
      },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        subscriptionExpiresAt: true
      }
    });
    
    // Send reminders for 3-day expiry
    for (const user of expiringIn3Days) {
      // Skip if already sent reminder in the last 24 hours
      const recentNotification = await prisma.notification.findFirst({
        where: {
          userId: user.id,
          type: 'subscription_expiring',
          createdAt: { gt: subDays(now, 1) }
        }
      });
      
      if (!recentNotification) {
        await prisma.notification.create({
          data: {
            userId: user.id,
            type: 'subscription_expiring',
            title: 'Subscription Expiring Soon',
            message: `Your ${user.subscriptionTier.toUpperCase()} VIBES subscription will expire in 3 days. Update your payment method to continue enjoying benefits.`,
            link: '/settings/subscriptions'
          }
        });
        console.log(`[Cron] Sent 3-day reminder to user ${user.id}`);
      }
    }
    
    // Send urgent reminders for 1-day expiry
    for (const user of expiringIn1Day) {
      await prisma.notification.create({
        data: {
          userId: user.id,
          type: 'subscription_expiring_urgent',
          title: 'Subscription Expires Tomorrow',
          message: `Your ${user.subscriptionTier.toUpperCase()} VIBES subscription expires tomorrow. Update your payment method now to avoid interruption.`,
          link: '/settings/subscriptions'
        }
      });
      console.log(`[Cron] Sent 1-day reminder to user ${user.id}`);
    }
    
    return {
      threeDayReminders: expiringIn3Days.length,
      oneDayReminders: expiringIn1Day.length
    };
  } catch (error) {
    console.error('[Cron] Error sending expiration reminders:', error);
    return { error: error.message };
  }
}

// AUDIT: Update expired grace periods
export async function updateExpiredGracePeriods() {
  const now = new Date();
  
  console.log(`[Cron] Updating expired grace periods at ${now.toISOString()}`);
  
  try {
    // Find users with expired grace periods
    const expiredGracePeriods = await prisma.user.findMany({
      where: {
        subscriptionStatus: 'grace_period',
        gracePeriodEndsAt: { lt: now }
      },
      select: {
        id: true,
        email: true,
        subscriptionTier: true,
        gracePeriodEndsAt: true
      }
    });
    
    console.log(`[Cron] Found ${expiredGracePeriods.length} expired grace periods`);
    
    for (const user of expiredGracePeriods) {
      try {
        await downgradeSubscription(user.id);
        console.log(`[Cron] Downgraded user ${user.id} after grace period expiration`);
      } catch (error) {
        console.error(`[Cron] Failed to downgrade user ${user.id}:`, error);
      }
    }
    
    return { processed: expiredGracePeriods.length };
  } catch (error) {
    console.error('[Cron] Error updating expired grace periods:', error);
    return { error: error.message };
  }
}

// AUDIT: Run all subscription maintenance jobs
export async function runSubscriptionMaintenance() {
  console.log('[Cron] Starting subscription maintenance jobs...');
  
  const results = {
    expiredSubscriptions: await processExpiredSubscriptions(),
    scheduledRetries: await processScheduledRetries(),
    expirationReminders: await sendExpirationReminders(),
    expiredGracePeriods: await updateExpiredGracePeriods(),
    timestamp: new Date().toISOString()
  };
  
  console.log('[Cron] Subscription maintenance jobs completed');
  return results;
}

export default {
  processExpiredSubscriptions,
  processScheduledRetries,
  sendExpirationReminders,
  updateExpiredGracePeriods,
  runSubscriptionMaintenance
};