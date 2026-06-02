import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/creators/all - Get all creators for sitemap (no auth required)
router.get('/creators/all', async (req, res) => {
  try {
    const { limit = 10000, offset = 0 } = req.query;

    const creators = await prisma.approvedUser.findMany({
      where: {
        status: 'approved',
      },
      select: {
        id: true,
        username: true,
        artistName: true,
        createdAt: true,
        updatedAt: true,
      },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    res.json({ success: true, creators });
  } catch (error) {
    console.error('Get all creators error:', error);
    res.status(500).json({ error: 'Failed to get creators' });
  }
});

// GET /api/posts/popular - Get posts for sitemap
router.get('/posts/popular', async (req, res) => {
  try {
    const { limit = 5000, offset = 0 } = req.query;

    const posts = await prisma.post.findMany({
      where: {
        status: 'approved_global',
      },
      select: {
        id: true,
        title: true,
        type: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { views: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset),
    });

    res.json({ success: true, posts });
  } catch (error) {
    console.error('Get posts error:', error);
    res.status(500).json({ error: 'Failed to get posts' });
  }
});

export default router;