import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// AUDIT: User access levels
const ACCESS_LEVELS = {
  JUST_VIBES: 'just_vibes',
  VIBER: 'viber',
  BASIC: 'basic',
  PREMIUM: 'premium',
  GOLD: 'gold'
};

// AUDIT: Content type to required access level mapping
const CONTENT_ACCESS_REQUIREMENTS = {
  free: { full: ACCESS_LEVELS.VIBER, preview: ACCESS_LEVELS.JUST_VIBES },
  subscriber: { full: ACCESS_LEVELS.PREMIUM, preview: null },
  direct_purchase: { full: ACCESS_LEVELS.VIBER, preview: null }, // Requires purchase check
  creator_page_only: { full: ACCESS_LEVELS.VIBER, preview: ACCESS_LEVELS.JUST_VIBES }
};

// AUDIT: Get user's access level
export async function getUserAccessLevel(userId, userType = null, subscriptionTier = null) {
  // Just VIBES user (from justVibesUser table)
  if (userType === 'just_vibes') {
    return { level: ACCESS_LEVELS.JUST_VIBES, tier: null, isJustVibes: true };
  }

  if (!userId) {
    return { level: ACCESS_LEVELS.JUST_VIBES, tier: null, isJustVibes: false };
  }

  try {
    // Check if user is a regular user (VIBER)
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { 
        id: true, 
        subscriptionTier: true,
        role: true
      }
    });

    if (!user) {
      return { level: ACCESS_LEVELS.JUST_VIBES, tier: null, isJustVibes: false };
    }

    // Check subscription tier
    const tier = user.subscriptionTier;
    
    if (tier === 'gold') {
      return { level: ACCESS_LEVELS.GOLD, tier: 'gold', isJustVibes: false };
    }
    if (tier === 'premium') {
      return { level: ACCESS_LEVELS.PREMIUM, tier: 'premium', isJustVibes: false };
    }
    if (tier === 'basic') {
      return { level: ACCESS_LEVELS.BASIC, tier: 'basic', isJustVibes: false };
    }
    
    return { level: ACCESS_LEVELS.VIBER, tier: null, isJustVibes: false };
  } catch (error) {
    console.error('Get user access level error:', error);
    return { level: ACCESS_LEVELS.JUST_VIBES, tier: null, isJustVibes: false };
  }
}

// AUDIT: Check if user can save/repost content
export async function canSaveContent(userId, userAccessLevel = null) {
  // Just VIBES cannot save
  if (userAccessLevel === ACCESS_LEVELS.JUST_VIBES) {
    return { canSave: false, reason: 'Just VIBES users cannot save content. Become a VIBER to save and repost.' };
  }
  
  // All other access levels can save
  return { canSave: true, reason: null };
}

// AUDIT: Check if user has purchased direct content
export async function hasPurchasedContent(userId, postId) {
  if (!userId || !postId) return false;
  
  try {
    const purchase = await prisma.directPurchase.findFirst({
      where: {
        userId,
        postId,
        status: 'completed'
      }
    });
    return !!purchase;
  } catch (error) {
    console.error('Check purchase error:', error);
    return false;
  }
}

// AUDIT: Check if user can purchase direct content
export async function canPurchaseContent(userId, userAccessLevel = null) {
  // All registered users can purchase (VIBER and above)
  if (userAccessLevel === ACCESS_LEVELS.JUST_VIBES) {
    return { canPurchase: false, reason: 'Just VIBES users cannot purchase content. Become a VIBER to buy and support creators.' };
  }
  
  return { canPurchase: true, reason: null };
}

// AUDIT: Main function to check if user can access content
export async function canAccessContent(userId, post, userAccessLevel = null, userType = null) {
  const contentType = post.contentType;
  const accessLevel = userAccessLevel || (await getUserAccessLevel(userId, userType)).level;
  
  // Special handling for direct_purchase content
  if (contentType === 'direct_purchase') {
    const hasPurchased = await hasPurchasedContent(userId, post.id);
    if (hasPurchased) {
      return { canAccess: true, accessType: 'full', requiresPreview: false, reason: null };
    }
    
    const canPurchase = await canPurchaseContent(userId, accessLevel);
    return { 
      canAccess: false, 
      accessType: 'locked', 
      requiresPurchase: true,
      price: post.price,
      priceRands: post.price ? (post.price / 100).toFixed(2) : '0.00',
      reason: canPurchase.canPurchase ? `Purchase for R${post.price ? (post.price / 100).toFixed(2) : '0.00'} to unlock` : canPurchase.reason
    };
  }
  
  // Subscriber content: only premium and gold
  if (contentType === 'subscriber') {
    const canAccess = accessLevel === ACCESS_LEVELS.PREMIUM || accessLevel === ACCESS_LEVELS.GOLD;
    return {
      canAccess,
      accessType: canAccess ? 'full' : 'locked',
      requiresPreview: false,
      requiresSubscription: !canAccess,
      reason: !canAccess ? 'This content is for Premium and Golden VIBES subscribers only. Upgrade to access.' : null
    };
  }
  
  // Free content: Just VIBES get 30-sec preview only
  if (contentType === 'free') {
    const isJustVibes = accessLevel === ACCESS_LEVELS.JUST_VIBES;
    return {
      canAccess: true,
      accessType: isJustVibes ? 'preview' : 'full',
      requiresPreview: isJustVibes,
      previewDuration: 30,
      reason: isJustVibes ? '30-second preview only. Become a VIBER for full access.' : null
    };
  }
  
  // Creator-page-only content: All users can view on creator page
  if (contentType === 'creator_page_only') {
    return {
      canAccess: true,
      accessType: 'full',
      requiresPreview: false,
      reason: null
    };
  }
  
  // Default fallback
  return {
    canAccess: true,
    accessType: 'full',
    requiresPreview: false,
    reason: null
  };
}

// AUDIT: Filter posts based on user's access level
export async function getVisibleContent(userId, posts, options = {}) {
  const { userType = null, includeLocked = false, onCreatorPage = false } = options;
  
  if (!posts || posts.length === 0) {
    return { visiblePosts: [], hiddenCount: 0 };
  }
  
  const userAccessLevel = await getUserAccessLevel(userId, userType);
  const visiblePosts = [];
  const hiddenPosts = [];
  
  for (const post of posts) {
    // On creator page, creator_page_only content is visible to all
    if (onCreatorPage && post.contentType === 'creator_page_only') {
      visiblePosts.push({
        ...post,
        _access: { canAccess: true, accessType: 'full', requiresPreview: false }
      });
      continue;
    }
    
    const access = await canAccessContent(userId, post, userAccessLevel.level, userType);
    
    if (access.canAccess || includeLocked) {
      visiblePosts.push({
        ...post,
        _access: access
      });
    } else {
      hiddenPosts.push({ postId: post.id, reason: access.reason });
    }
  }
  
  return {
    visiblePosts,
    hiddenCount: hiddenPosts.length,
    hiddenPosts
  };
}

export default {
  ACCESS_LEVELS,
  CONTENT_ACCESS_REQUIREMENTS,
  getUserAccessLevel,
  canSaveContent,
  hasPurchasedContent,
  canPurchaseContent,
  canAccessContent,
  getVisibleContent
};