import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// AUDIT: Valid subscription tiers
const SUBSCRIPTION_TIERS = {
  BASIC: 'basic',
  PREMIUM: 'premium',
  GOLD: 'gold'
};

// AUDIT: Tier hierarchy for access checks
const TIER_HIERARCHY = {
  basic: 1,
  premium: 2,
  gold: 3
};

// AUDIT: Get user's subscription tier and status
export async function getUserSubscriptionTier(userId) {
  if (!userId || typeof userId !== 'string') {
    return { tier: null, isActive: false, expiresAt: null };
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        subscriptionTier: true,
        subscriptionExpiresAt: true,
        subscriptionStatus: true
      }
    });

    if (!user) {
      return { tier: null, isActive: false, expiresAt: null };
    }

    // Check if subscription is active
    const now = new Date();
    const hasValidTier = user.subscriptionTier && 
      ['basic', 'premium', 'gold'].includes(user.subscriptionTier);
    const notExpired = !user.subscriptionExpiresAt || 
      new Date(user.subscriptionExpiresAt) > now;
    const statusActive = user.subscriptionStatus === 'active';

    const isActive = hasValidTier && notExpired && statusActive;

    return {
      tier: isActive ? user.subscriptionTier : null,
      isActive,
      expiresAt: user.subscriptionExpiresAt,
      status: user.subscriptionStatus
    };
  } catch (error) {
    console.error('Get user subscription tier error:', error);
    return { tier: null, isActive: false, expiresAt: null };
  }
}

// AUDIT: Check if user has active subscription (any paid tier)
export async function hasActiveSubscription(userId) {
  const { isActive } = await getUserSubscriptionTier(userId);
  return isActive;
}

// AUDIT: Check if user has minimum required tier
export async function hasMinimumTier(userId, requiredTier) {
  const { tier, isActive } = await getUserSubscriptionTier(userId);
  
  if (!isActive || !tier) return false;
  
  const userLevel = TIER_HIERARCHY[tier] || 0;
  const requiredLevel = TIER_HIERARCHY[requiredTier] || 0;
  
  return userLevel >= requiredLevel;
}

// AUDIT: Middleware - Require any active subscription (Basic, Premium, or Gold)
export async function requireSubscriber(req, res, next) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const hasSubscription = await hasActiveSubscription(userId);
    
    if (!hasSubscription) {
      return res.status(403).json({
        error: 'This content requires an active subscription. Please subscribe to access.',
        code: 'SUBSCRIPTION_REQUIRED',
        requiredTier: 'basic'
      });
    }
    
    next();
  } catch (error) {
    console.error('Require subscriber error:', error);
    res.status(500).json({ error: 'Failed to verify subscription status' });
  }
}

// AUDIT: Middleware - Require Premium or Gold subscription
export async function requirePremium(req, res, next) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const hasPremium = await hasMinimumTier(userId, SUBSCRIPTION_TIERS.PREMIUM);
    
    if (!hasPremium) {
      return res.status(403).json({
        error: 'This content requires a Premium or Gold subscription. Upgrade to access.',
        code: 'PREMIUM_REQUIRED',
        requiredTier: 'premium'
      });
    }
    
    next();
  } catch (error) {
    console.error('Require premium error:', error);
    res.status(500).json({ error: 'Failed to verify subscription status' });
  }
}

// AUDIT: Middleware - Require Gold subscription only
export async function requireGold(req, res, next) {
  try {
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'Authentication required',
        code: 'UNAUTHORIZED'
      });
    }

    const hasGold = await hasMinimumTier(userId, SUBSCRIPTION_TIERS.GOLD);
    
    if (!hasGold) {
      return res.status(403).json({
        error: 'This content requires a Golden VIBES subscription. Upgrade to access.',
        code: 'GOLD_REQUIRED',
        requiredTier: 'gold'
      });
    }
    
    next();
  } catch (error) {
    console.error('Require gold error:', error);
    res.status(500).json({ error: 'Failed to verify subscription status' });
  }
}

// AUDIT: Express middleware wrapper for easier usage in routes
export const requireSubscriberMiddleware = (req, res, next) => {
  requireSubscriber(req, res, next);
};

export const requirePremiumMiddleware = (req, res, next) => {
  requirePremium(req, res, next);
};

export const requireGoldMiddleware = (req, res, next) => {
  requireGold(req, res, next);
};

export default {
  requireSubscriber,
  requirePremium,
  requireGold,
  requireSubscriberMiddleware,
  requirePremiumMiddleware,
  requireGoldMiddleware,
  hasActiveSubscription,
  hasMinimumTier,
  getUserSubscriptionTier,
  SUBSCRIPTION_TIERS,
  TIER_HIERARCHY
};