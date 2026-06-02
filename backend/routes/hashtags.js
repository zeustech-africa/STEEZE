import express from 'express';
import { PrismaClient } from '@prisma/client';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Extract hashtags from text
function extractHashtags(text) {
  const hashtagRegex = /#[\w\u0590-\u05fe]+/g;
  const matches = text?.match(hashtagRegex) || [];
  return matches.map(tag => tag.slice(1).toLowerCase());
}

// Get trending hashtags
router.get('/hashtags/trending', async (req, res) => {
  try {
    const oneDayAgo = new Date();
    oneDayAgo.setDate(oneDayAgo.getDate() - 1);

    // Aggregate hashtag usage from recent posts
    const recentPosts = await prisma.post.findMany({
      where: {
        status: 'approved_global',
        createdAt: { gte: oneDayAgo }
      },
      select: { description: true, caption: true }
    });

    const hashtagCounts = new Map();

    for (const post of recentPosts) {
      const hashtags = extractHashtags(post.description + ' ' + (post.caption || ''));
      for (const tag of hashtags) {
        hashtagCounts.set(tag, (hashtagCounts.get(tag) || 0) + 1);
      }
    }

    const trending = Array.from(hashtagCounts.entries())
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    res.json({ success: true, trending });
  } catch (error) {
    console.error('Get trending hashtags error:', error);
    res.status(500).json({ error: 'Failed to get trending hashtags' });
  }
});

// Search posts by hashtag
router.get('/hashtags/:tag/posts', optionalAuth, async (req, res) => {
  try {
    const { tag } = req.params;
    const { limit = 50, offset = 0 } = req.query;

    const posts = await prisma.post.findMany({
      where: {
        status: 'approved_global',
        OR: [
          { description: { contains: `#${tag}` } },
          { caption: { contains: `#${tag}` } }
        ]
      },
      include: {
        creator: {
          select: { id: true, artistName: true, fullName: true, profilePicUrl: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.post.count({
      where: {
        status: 'approved_global',
        OR: [
          { description: { contains: `#${tag}` } },
          { caption: { contains: `#${tag}` } }
        ]
      }
    });

    res.json({ success: true, posts, total, tag });
  } catch (error) {
    console.error('Search by hashtag error:', error);
    res.status(500).json({ error: 'Failed to search by hashtag' });
  }
});

export { extractHashtags };
export default router;