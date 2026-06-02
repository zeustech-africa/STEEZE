import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';
import { interactionRateLimiter } from '../middleware/rateLimiter.js';
import { 
  getPersonalizedFeed, 
  trackInteraction, 
  getTrendingFeed,
  healthCheck
} from '../services/recommendation.js';
import crypto from 'crypto';

const router = express.Router();
const prisma = new PrismaClient();

// AUDIT: Health check endpoint for monitoring
router.get('/feed/health', async (req, res) => {
  const health = await healthCheck();
  const statusCode = health.status === 'healthy' ? 200 : 503;
  res.status(statusCode).json(health);
});

// GET /api/feed/for-you - Personalized For You feed
router.get('/feed/for-you', authenticateToken, async (req, res) => {
  const requestId = crypto.randomUUID();
  const startTime = Date.now();
  
  try {
    const userId = req.user.id;
    const { limit = 30, offset = 0 } = req.query;
    
    const parsedLimit = Math.min(100, parseInt(limit) || 30);
    const parsedOffset = parseInt(offset) || 0;
    
    // Get user's seen posts to avoid duplicates
    const seenPosts = await prisma.userInteraction.findMany({
      where: { 
        userId, 
        type: { in: ['view', 'skip'] }
      },
      select: { postId: true },
      orderBy: { createdAt: 'desc' },
      take: 200
    });
    
    const excludeIds = seenPosts.map(p => p.postId);
    
    const feed = await getPersonalizedFeed(userId, parsedLimit, parsedOffset, excludeIds, requestId);
    
    // AUDIT: Non-blocking impression tracking
    for (const post of feed) {
      prisma.userInteraction.upsert({
        where: {
          userId_postId_type: {
            userId,
            postId: post.id,
            type: 'impression'
          }
        },
        update: {},
        create: {
          userId,
          postId: post.id,
          type: 'impression',
          weight: 0.1
        }
      }).catch(() => {});
    }
    
    res.json({ 
      success: true, 
      feed, 
      hasMore: feed.length === parsedLimit,
      total: feed.length,
      responseTime: Date.now() - startTime
    });
  } catch (error) {
    console.error('For You feed error:', error);
    res.status(500).json({ error: 'Failed to load feed' });
  }
});

// POST /api/feed/interaction - Track user interaction with rate limiting
router.post('/feed/interaction', authenticateToken, interactionRateLimiter, async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId, type, watchTime } = req.body;
    const ipAddress = req.ip || req.headers['x-forwarded-for'] || null;
    const userAgent = req.headers['user-agent'] || null;
    
    // AUDIT: Validate required fields
    if (!postId || !type) {
      return res.status(400).json({ error: 'postId and type are required' });
    }
    
    // AUDIT: Validate type against whitelist
    const validTypes = ['view', 'like', 'comment', 'share', 'save', 'skip'];
    if (!validTypes.includes(type)) {
      return res.status(400).json({ error: 'Invalid interaction type' });
    }
    
    // AUDIT: Validate post exists
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { id: true }
    });
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }
    
    const success = await trackInteraction(userId, postId, type, watchTime, ipAddress, userAgent);
    
    if (success) {
      res.json({ success: true });
    } else {
      res.status(500).json({ error: 'Failed to track interaction' });
    }
  } catch (error) {
    console.error('Track interaction error:', error);
    res.status(500).json({ error: 'Failed to track interaction' });
  }
});

// GET /api/feed/trending - Trending feed (fallback for new users)
router.get('/feed/trending', optionalAuth, async (req, res) => {
  try {
    const { limit = 30, offset = 0 } = req.query;
    const parsedLimit = Math.min(100, parseInt(limit) || 30);
    const parsedOffset = parseInt(offset) || 0;
    
    const feed = await getTrendingFeed(parsedLimit, parsedOffset);
    
    res.json({ success: true, feed, hasMore: feed.length === parsedLimit });
  } catch (error) {
    console.error('Trending feed error:', error);
    res.status(500).json({ error: 'Failed to load trending' });
  }
});

export default router;