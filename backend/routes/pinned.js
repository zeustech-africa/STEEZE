import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const MAX_PINNED = 3;

// Get pinned posts for a creator
router.get('/pinned/:creatorId', async (req, res) => {
  try {
    const { creatorId } = req.params;

    const pinnedPosts = await prisma.post.findMany({
      where: {
        creatorId,
        isPinned: true,
      },
      include: {
        creator: {
          select: {
            id: true,
            artistName: true,
            profilePicUrl: true,
          }
        }
      },
      orderBy: { pinnedOrder: 'asc' },
    });

    res.json({ success: true, pinnedPosts });
  } catch (error) {
    console.error('Get pinned posts error:', error);
    res.status(500).json({ error: 'Failed to get pinned posts' });
  }
});

// Pin a post
router.post('/pinned/:postId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;

    // Verify post belongs to user
    const post = await prisma.post.findFirst({
      where: { id: postId, creatorId: userId }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Count existing pinned posts
    const pinnedCount = await prisma.post.count({
      where: { creatorId: userId, isPinned: true }
    });

    if (pinnedCount >= MAX_PINNED) {
      return res.status(400).json({
        error: `You can only pin up to ${MAX_PINNED} posts. Unpin another post first.`
      });
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        isPinned: true,
        pinnedOrder: pinnedCount,
        pinnedAt: new Date(),
      }
    });

    res.json({ success: true, post: updatedPost });
  } catch (error) {
    console.error('Pin post error:', error);
    res.status(500).json({ error: 'Failed to pin post' });
  }
});

// Unpin a post
router.delete('/pinned/:postId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;

    const post = await prisma.post.findFirst({
      where: { id: postId, creatorId: userId }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        isPinned: false,
        pinnedOrder: null,
        pinnedAt: null,
      }
    });

    // Reorder remaining pinned posts
    const remainingPinned = await prisma.post.findMany({
      where: { creatorId: userId, isPinned: true },
      orderBy: { pinnedOrder: 'asc' }
    });

    for (let i = 0; i < remainingPinned.length; i++) {
      await prisma.post.update({
        where: { id: remainingPinned[i].id },
        data: { pinnedOrder: i }
      });
    }

    res.json({ success: true, post: updatedPost });
  } catch (error) {
    console.error('Unpin post error:', error);
    res.status(500).json({ error: 'Failed to unpin post' });
  }
});

// Reorder pinned posts
router.put('/pinned/reorder', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { postIds } = req.body; // Array of post IDs in desired order

    if (!Array.isArray(postIds)) {
      return res.status(400).json({ error: 'Invalid request' });
    }

    for (let i = 0; i < postIds.length; i++) {
      await prisma.post.updateMany({
        where: { id: postIds[i], creatorId: userId },
        data: { pinnedOrder: i }
      });
    }

    res.json({ success: true, message: 'Pinned posts reordered' });
  } catch (error) {
    console.error('Reorder pinned posts error:', error);
    res.status(500).json({ error: 'Failed to reorder pinned posts' });
  }
});

// Admin: Unpin any post
router.delete('/admin/pinned/:postId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { postId } = req.params;
    const adminId = req.user.id;
    const adminEmail = req.user.email;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { creator: true }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    await prisma.post.update({
      where: { id: postId },
      data: {
        isPinned: false,
        pinnedOrder: null,
        pinnedAt: null,
      }
    });

    // Log admin action
    await prisma.adminAuditLog.create({
      data: {
        adminId,
        adminEmail,
        action: 'ADMIN_UNPIN',
        targetType: 'post',
        targetId: postId,
        targetTitle: post.title,
        details: { creatorId: post.creatorId, creatorName: post.creator?.artistName }
      }
    });

    res.json({ success: true, message: 'Post unpinned by admin' });
  } catch (error) {
    console.error('Admin unpin error:', error);
    res.status(500).json({ error: 'Failed to unpin post' });
  }
});

export default router;