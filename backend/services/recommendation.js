import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  }
});

// AUDIT: Valid interaction types only
const VALID_INTERACTION_TYPES = new Set([
  'view', 'like', 'comment', 'share', 'save', 'skip', 'report', 'block_creator'
]);

// AUDIT: Interaction weights (reviewed and approved)
const INTERACTION_WEIGHTS = {
  like: 2.0,
  comment: 3.0,
  share: 4.0,
  save: 3.0,
  view: 0.5,
  skip: -1.5,
  report: -5.0,
  block_creator: -10.0
};

const DECAY_FACTOR = Math.pow(0.5, 1 / 30);
let pendingUpdates = new Set();
let updateTimeout = null;

// AUDIT: Input validation helper
const validateInteractionInput = (userId, postId, type, watchTime) => {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }
  if (!postId || typeof postId !== 'string') {
    throw new Error('Invalid postId');
  }
  if (!VALID_INTERACTION_TYPES.has(type)) {
    throw new Error(`Invalid interaction type: ${type}`);
  }
  if (watchTime !== undefined && (typeof watchTime !== 'number' || watchTime < 0 || watchTime > 3600)) {
    throw new Error('Invalid watchTime (must be 0-3600 seconds)');
  }
  return true;
};

// AUDIT: Calculate weight with time decay
function calculateWeight(interactionType, daysOld) {
  const baseWeight = INTERACTION_WEIGHTS[interactionType] || 1.0;
  const decay = Math.pow(DECAY_FACTOR, daysOld);
  const weight = baseWeight * decay;
  return isNaN(weight) || !isFinite(weight) ? baseWeight : weight;
}

// AUDIT: Batch update with transaction guarantee
export async function scheduleUserPreferenceUpdate(userId) {
  if (!userId) return;
  pendingUpdates.add(userId);
  
  if (updateTimeout) clearTimeout(updateTimeout);
  updateTimeout = setTimeout(async () => {
    const userIds = Array.from(pendingUpdates);
    pendingUpdates.clear();
    
    // AUDIT: Use transaction for batch updates
    await prisma.$transaction(async (tx) => {
      for (const uid of userIds) {
        await updateUserPreferences(uid, tx);
      }
    });
    updateTimeout = null;
  }, 5000);
}

// AUDIT: Update preferences with transaction support
export async function updateUserPreferences(userId, tx = prisma) {
  try {
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);
    
    const interactions = await tx.userInteraction.findMany({
      where: {
        userId,
        createdAt: { gte: ninetyDaysAgo }
      },
      include: {
        post: {
          include: {
            creator: true
          }
        }
      }
    });
    
    if (interactions.length === 0) {
      return null;
    }
    
    const categoryScores = new Map();
    const genreScores = new Map();
    const creatorScores = new Map();
    const negativeCategories = new Map();
    
    for (const interaction of interactions) {
      const daysOld = Math.min(90, (Date.now() - new Date(interaction.createdAt).getTime()) / (1000 * 60 * 60 * 24));
      const weight = calculateWeight(interaction.type, daysOld);
      
      const isNegative = ['skip', 'report', 'block_creator'].includes(interaction.type);
      
      if (interaction.post.category && typeof interaction.post.category === 'string') {
        const target = isNegative ? negativeCategories : categoryScores;
        const current = target.get(interaction.post.category) || 0;
        target.set(interaction.post.category, current + (isNegative ? Math.abs(weight) : weight));
      }
      
      if (interaction.post.genre && typeof interaction.post.genre === 'string') {
        const target = isNegative ? negativeCategories : genreScores;
        const current = target.get(interaction.post.genre) || 0;
        target.set(interaction.post.genre, current + (isNegative ? Math.abs(weight) : weight));
      }
      
      if (interaction.post.creatorId && !isNegative) {
        const current = creatorScores.get(interaction.post.creatorId) || 0;
        creatorScores.set(interaction.post.creatorId, current + weight);
      }
    }
    
    const preferences = {
      preferredCategories: Object.fromEntries(categoryScores),
      preferredGenres: Object.fromEntries(genreScores),
      preferredCreators: Object.fromEntries(creatorScores),
      negativeCategories: Object.fromEntries(negativeCategories),
      lastCalculated: new Date()
    };
    
    await tx.userPreference.upsert({
      where: { userId },
      update: preferences,
      create: { userId, ...preferences }
    });
    
    return preferences;
  } catch (error) {
    console.error('Update user preferences error:', error);
    return null;
  }
}

// AUDIT: Track interaction with idempotency and validation
export async function trackInteraction(userId, postId, type, watchTime = null, ipAddress = null, userAgent = null) {
  try {
    validateInteractionInput(userId, postId, type, watchTime);
    
    // AUDIT: Idempotency - check if duplicate within last second
    const oneSecondAgo = new Date(Date.now() - 1000);
    const existing = await prisma.userInteraction.findFirst({
      where: {
        userId,
        postId,
        type,
        createdAt: { gte: oneSecondAgo }
      }
    });
    
    if (existing) {
      // Duplicate ignored - prevents spam
      return true;
    }
    
    // AUDIT: Create with transaction guarantee
    await prisma.$transaction(async (tx) => {
      await tx.userInteraction.create({
        data: {
          userId,
          postId,
          type,
          watchTime: watchTime && typeof watchTime === 'number' && watchTime > 0 ? Math.floor(watchTime) : null,
          weight: INTERACTION_WEIGHTS[type] || 1.0,
          ipAddress,
          userAgent
        }
      });
      
      // AUDIT: Update post engagement counters for like/comment/share/save
      if (['like', 'comment', 'share', 'save'].includes(type)) {
        const updateField = `${type}s`;
        await tx.post.update({
          where: { id: postId },
          increment: { [updateField]: 1 }
        }).catch(() => {});
      }
    });
    
    // Schedule preference update
    scheduleUserPreferenceUpdate(userId);
    
    return true;
  } catch (error) {
    console.error('Track interaction error:', error);
    return false;
  }
}

// AUDIT: Health check for monitoring
export async function healthCheck() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const count = await prisma.userInteraction.count({ take: 1 });
    return { status: 'healthy', database: 'connected', interactionsExist: count > 0 };
  } catch (error) {
    return { status: 'unhealthy', database: 'disconnected', error: error.message };
  }
}

// AUDIT: Score a post for a user with bounds checking
export async function scorePostForUser(userId, post) {
  let score = 0;
  
  const preferences = await prisma.userPreference.findUnique({
    where: { userId }
  });
  
  if (!preferences) {
    // Default: trending score based on views/likes
    return Math.min(100, (post.views || 0) * 0.1 + (post.likes || 0) * 0.5);
  }
  
  try {
    // Category match (positive)
    if (post.category && preferences.preferredCategories) {
      const categoryScore = preferences.preferredCategories[post.category] || 0;
      score += Math.min(50, Math.max(-50, categoryScore * 1.5));
    }
    
    // Category mismatch (negative from skipped content)
    if (post.category && preferences.negativeCategories) {
      const negativeScore = preferences.negativeCategories[post.category] || 0;
      score -= Math.min(50, Math.max(-50, negativeScore * 2.0));
    }
    
    // Genre match
    if (post.genre && preferences.preferredGenres) {
      const genreScore = preferences.preferredGenres[post.genre] || 0;
      score += Math.min(40, Math.max(-40, genreScore * 1.2));
    }
    
    // Creator affinity
    if (post.creatorId && preferences.preferredCreators) {
      const creatorScore = preferences.preferredCreators[post.creatorId] || 0;
      score += Math.min(60, Math.max(-60, creatorScore * 2.0));
    }
    
    // Engagement boost (popular content)
    score += Math.min(20, (post.views || 0) * 0.05);
    score += Math.min(30, (post.likes || 0) * 0.2);
    
    // Recency boost (newer content gets slight boost)
    const daysOld = Math.min(30, (Date.now() - new Date(post.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    score += Math.max(0, 14 - daysOld) * 0.3;
    
    // AUDIT: Bound final score
    return Math.min(200, Math.max(0, score));
  } catch (error) {
    console.error('Score calculation error:', error);
    return 0;
  }
}

// AUDIT: Get personalized feed for user with logging
export async function getPersonalizedFeed(userId, limit = 30, offset = 0, excludeIds = [], requestId = null) {
  const startTime = Date.now();
  
  try {
    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);
    
    let candidates = await prisma.post.findMany({
      where: {
        status: 'approved_global',
        createdAt: { gte: fourteenDaysAgo },
        id: { notIn: excludeIds }
      },
      include: {
        creator: {
          select: {
            id: true,
            artistName: true,
            fullName: true,
            profilePicUrl: true
          }
        }
      },
      take: 500
    });
    
    // If not enough candidates, get older popular content
    if (candidates.length < 30) {
      const olderPosts = await prisma.post.findMany({
        where: {
          status: 'approved_global',
          createdAt: { lt: fourteenDaysAgo },
          id: { notIn: excludeIds }
        },
        include: {
          creator: {
            select: {
              id: true,
              artistName: true,
              fullName: true,
              profilePicUrl: true
            }
          }
        },
        orderBy: { likes: 'desc' },
        take: 200
      });
      candidates = [...candidates, ...olderPosts];
    }
    
    // Score each candidate
    const scored = await Promise.all(
      candidates.map(async (post) => ({
        ...post,
        score: await scorePostForUser(userId, post)
      }))
    );
    
    const finalPosts = scored.sort((a, b) => b.score - a.score);
    
    // AUDIT: Log recommendation request for monitoring
    await prisma.recommendationLog.create({
      data: {
        userId,
        requestId: requestId || Math.random().toString(36).substring(7),
        limit,
        offset,
        resultCount: finalPosts.length,
        responseTime: Date.now() - startTime,
        status: 'success'
      }
    }).catch(() => {}); // Non-critical, don't fail
    
    return finalPosts.slice(offset, offset + limit);
  } catch (error) {
    console.error('Get personalized feed error:', error);
    
    // AUDIT: Log error
    await prisma.recommendationLog.create({
      data: {
        userId,
        requestId: requestId || Math.random().toString(36).substring(7),
        limit,
        offset,
        resultCount: 0,
        responseTime: Date.now() - startTime,
        status: 'error',
        errorMessage: error.message
      }
    }).catch(() => {});
    
    return [];
  }
}

// AUDIT: Get trending feed (fallback for new users)
export async function getTrendingFeed(limit = 30, offset = 0) {
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  
  const trending = await prisma.post.findMany({
    where: {
      status: 'approved_global',
      createdAt: { gte: oneDayAgo }
    },
    include: {
      creator: {
        select: {
          id: true,
          artistName: true,
          fullName: true,
          profilePicUrl: true
        }
      }
    },
    orderBy: [
      { views: 'desc' },
      { likes: 'desc' }
    ],
    take: limit,
    skip: offset
  });
  
  return trending;
}

export default {
  trackInteraction,
  updateUserPreferences,
  healthCheck,
  scheduleUserPreferenceUpdate,
  scorePostForUser,
  getPersonalizedFeed,
  getTrendingFeed
};
