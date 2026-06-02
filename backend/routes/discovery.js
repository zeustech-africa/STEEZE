import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, optionalAuth } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// ============================================
// RECOMMENDED CREATORS
// ============================================

// Get recommended creators for user
router.get('/discovery/recommended-creators', optionalAuth, async (req, res) => {
  try {
    const userId = req.user?.id;

    // Base query for active creators with approved content
    const baseQuery = {
      where: {
        userType: { in: ['independent_creator', 'zls_artist'] },
        status: 'approved',
        isBanned: false,
        posts: { some: { status: 'approved_global' } }
      },
      select: {
        id: true,
        fullName: true,
        artistName: true,
        username: true,
        profilePicUrl: true,
        tagline: true,
        _count: { select: { followers: true, posts: true } }
      },
      take: 20
    };

    let recommendedCreators = [];

    if (userId) {
      // Get user's interests from liked posts and followed creators
      const userLikes = await prisma.postInteraction.findMany({
        where: { userId, type: 'like' },
        include: { post: { include: { creator: true } } },
        take: 20
      });

      const followedCreators = await prisma.follow.findMany({
        where: { followerId: userId },
        select: { followingId: true }
      });

      const followedIds = followedCreators.map(f => f.followingId);
      const likedCreatorIds = [...new Set(userLikes.map(l => l.post.creatorId))];

      // Find creators similar to followed/liked
      if (likedCreatorIds.length > 0 || followedIds.length > 0) {
        const similarCreators = await prisma.user.findMany({
          where: {
            id: { notIn: [...followedIds, userId] },
            userType: { in: ['independent_creator', 'zls_artist'] },
            status: 'approved',
            OR: [
              { category: { in: userLikes.map(l => l.post.category).filter(Boolean) } },
              { genre: { in: userLikes.map(l => l.post.genre).filter(Boolean) } }
            ]
          },
          ...baseQuery,
          take: 10
        });
        recommendedCreators.push(...similarCreators);
      }
    }

    // Fill remaining with trending creators
    if (recommendedCreators.length < 20) {
      const trendingCreators = await prisma.user.findMany({
        ...baseQuery,
        where: {
          ...baseQuery.where,
          id: { notIn: [...recommendedCreators.map(c => c.id), userId].filter(Boolean) }
        },
        orderBy: { followers: { _count: 'desc' } },
        take: 20 - recommendedCreators.length
      });
      recommendedCreators.push(...trendingCreators);
    }

    const sanitized = recommendedCreators.map(creator => ({
      id: creator.id,
      name: creator.artistName || creator.fullName,
      username: creator.username,
      profilePicUrl: creator.profilePicUrl,
      tagline: creator.tagline,
      followerCount: creator._count?.followers || 0,
      postCount: creator._count?.posts || 0
    }));

    res.json({ success: true, creators: sanitized });
  } catch (error) {
    console.error('Get recommended creators error:', error);
    res.status(500).json({ error: 'Failed to get recommendations' });
  }
});

// ============================================
// RELATED CONTENT ENGINE
// ============================================

// Get related content based on post
router.get('/discovery/related/:postId', optionalAuth, async (req, res) => {
  try {
    const { postId } = req.params;
    const userId = req.user?.id;

    const currentPost = await prisma.post.findUnique({
      where: { id: postId },
      select: { category: true, genre: true, type: true, creatorId: true }
    });

    if (!currentPost) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Find similar content
    const similarPosts = await prisma.post.findMany({
      where: {
        id: { not: postId },
        status: 'approved_global',
        OR: [
          { category: currentPost.category },
          { genre: currentPost.genre },
          { type: currentPost.type }
        ]
      },
      include: {
        creator: {
          select: { id: true, artistName: true, fullName: true, profilePicUrl: true }
        }
      },
      orderBy: { views: 'desc' },
      take: 10
    });

    // Also get content from same creator
    const creatorContent = await prisma.post.findMany({
      where: {
        creatorId: currentPost.creatorId,
        id: { not: postId },
        status: 'approved_global'
      },
      include: {
        creator: {
          select: { id: true, artistName: true, fullName: true, profilePicUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const related = [...similarPosts, ...creatorContent];
    const uniqueRelated = [...new Map(related.map(item => [item.id, item])).values()];

    const sanitized = uniqueRelated.map(post => ({
      id: post.id,
      title: post.title,
      type: post.type,
      thumbnailUrl: post.thumbnailUrl,
      creator: post.creator,
      views: post.views,
      likes: post.likes
    }));

    res.json({ success: true, related: sanitized });
  } catch (error) {
    console.error('Get related content error:', error);
    res.status(500).json({ error: 'Failed to get related content' });
  }
});

// ============================================
// TRENDING CONTENT
// ============================================

// Get trending content (last 24 hours)
router.get('/discovery/trending', optionalAuth, async (req, res) => {
  try {
    const { type = 'all', limit = 20 } = req.query;
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    const where = {
      status: 'approved_global',
      createdAt: { gte: oneDayAgo }
    };

    if (type && type !== 'all') {
      where.type = type;
    }

    const trending = await prisma.post.findMany({
      where,
      include: {
        creator: {
          select: { id: true, artistName: true, fullName: true, profilePicUrl: true }
        }
      },
      orderBy: [
        { views: 'desc' },
        { likes: 'desc' },
        { comments: 'desc' }
      ],
      take: parseInt(limit)
    });

    res.json({ success: true, trending });
  } catch (error) {
    console.error('Get trending error:', error);
    res.status(500).json({ error: 'Failed to get trending' });
  }
});

export default router;