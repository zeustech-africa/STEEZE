import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateAny as auth } from "../middleware/auth.js";
import { commentLimiter } from "../middleware/rateLimit.js";

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/posts/:id/comment — add a comment to a post
router.post("/:id/comment", auth, commentLimiter, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content || !content.trim()) {
      return res.status(400).json({ error: "Comment content is required" });
    }

    const comment = await prisma.postComment.create({
      data: {
        postId: id,
        userId,
        content: content.trim(),
      },
      include: {
        user: {
          select: { id: true, username: true, profilePic: true, displayName: true },
        },
      },
    });

    return res.status(201).json({ success: true, comment });
  } catch (error) {
    console.error("Comment creation error:", error);
    return res.status(500).json({ error: "Failed to add comment" });
  }
});

// POST /api/posts/:id/like — like/unlike a post
router.post("/:id/like", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const existing = await prisma.postInteraction.findFirst({
      where: { postId: id, userId, type: "like" },
    });

    if (existing) {
      await prisma.postInteraction.delete({ where: { id: existing.id } });

      return res.json({ success: true, liked: false });
    }

    await prisma.postInteraction.create({
      data: { postId: id, userId, type: "like" },
    });

    // Increment views count if post exists
    await prisma.post.updateMany({
      where: { id },
      data: { viewsCount: { increment: 1 } },
    });

    res.json({ success: true, liked: true });
  } catch (error) {
    console.error("Like error:", error);
    res.status(500).json({ success: false, message: "Failed to like post" });
  }
});

// POST /api/posts/:id/save — SAVE = REPOST
// When a VIBES saves a post, it creates a repost record
router.post("/:id/save", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Check if already reposted
    const existing = await prisma.repost.findUnique({
      where: { originalPostId_repostedBy: { originalPostId: id, repostedBy: userId } },
      include: { originalPost: { select: { creatorId: true, title: true } } },
    });

    if (existing) {
      // Remove repost (unsave)
      await prisma.repost.delete({ where: { id: existing.id } });

      // Create notification for original creator (removed repost)
      await prisma.notification.create({
        data: {
          userId: existing.originalPost.creatorId,
          fromUserId: userId,
          type: "unsave",
          message: `@${req.user.username || req.user.email} removed their repost of your post`,
          postId: id,
        },
      });

      return res.json({ success: true, reposted: false });
    }

    // Get the original post to know the creator
    const post = await prisma.post.findUnique({
      where: { id },
      select: { creatorId: true, title: true },
    });

    if (!post) {
      return res.status(404).json({ success: false, message: "Post not found" });
    }

    // Create repost
    const repost = await prisma.repost.create({
      data: {
        originalPostId: id,
        repostedBy: userId,
      },
    });

    // Create notification for original creator
    await prisma.notification.create({
      data: {
        userId: post.creatorId,
        fromUserId: userId,
        type: "repost",
        message: `@${req.user.username || req.user.email} reposted your post "${post.title}"`,
        postId: id,
      },
    });

    res.json({ success: true, reposted: true, repost });
  } catch (error) {
    console.error("Save/repost error:", error);
    res.status(500).json({ success: false, message: "Failed to save post" });
  }
});

// GET /api/posts/user/liked — get current user's liked posts (for profile grid)
router.get("/user/liked", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const interactions = await prisma.postInteraction.findMany({
      where: { userId, type: "like" },
      include: {
        post: {
          include: {
            creator: {
              select: { id: true, artistName: true, username: true, profilePicUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const posts = interactions.map((interaction) => ({
      id: interaction.post.id,
      type: interaction.post.type,
      title: interaction.post.title,
      mediaUrl: interaction.post.mediaUrl,
      thumbnail: interaction.post.thumbnailUrl,
      description: interaction.post.description,
      createdAt: interaction.createdAt,
      creator: interaction.post.creator,
    }));

    res.json({ success: true, posts });
  } catch (error) {
    console.error("Get liked posts error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch liked posts" });
  }
});

// GET /api/posts/user/reposts — get current user's reposts (for profile grid)
router.get("/user/reposts", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const reposts = await prisma.repost.findMany({
      where: { repostedBy: userId },
      include: {
        originalPost: {
          include: {
            creator: {
              select: { id: true, artistName: true, username: true, profilePicUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedReposts = reposts.map((repost) => ({
      id: repost.originalPost.id,
      repostId: repost.id,
      type: repost.originalPost.type,
      title: repost.originalPost.title,
      mediaUrl: repost.originalPost.mediaUrl,
      thumbnail: repost.originalPost.thumbnailUrl,
      createdAt: repost.createdAt,
      originalCreator: repost.originalPost.creator,
      attribution: `Reposted from @${repost.originalPost.creator.username}`,
    }));

    res.json({ success: true, reposts: formattedReposts });
  } catch (error) {
    console.error("Get reposts error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch reposts" });
  }
});

// GET /api/posts/user/:id/reposts — get a specific user's reposts
router.get("/user/:id/reposts", auth, async (req, res) => {
  try {
    const { id } = req.params;

    const reposts = await prisma.repost.findMany({
      where: { repostedBy: id },
      include: {
        originalPost: {
          include: {
            creator: {
              select: { id: true, artistName: true, username: true, profilePicUrl: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedReposts = reposts.map((repost) => ({
      id: repost.originalPost.id,
      repostId: repost.id,
      type: repost.originalPost.type,
      title: repost.originalPost.title,
      mediaUrl: repost.originalPost.mediaUrl,
      thumbnail: repost.originalPost.thumbnailUrl,
      createdAt: repost.createdAt,
      originalCreator: repost.originalPost.creator,
      attribution: `Reposted from @${repost.originalPost.creator.username}`,
    }));

    res.json({ success: true, reposts: formattedReposts });
  } catch (error) {
    console.error("Get user reposts error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch reposts" });
  }
});

// GET /api/posts/:id/download - Download post content (subscriber only)
router.get("/:id/download", auth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get post
    const post = await prisma.post.findUnique({
      where: { id },
      include: { creator: true }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    // Check user subscription tier
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { subscriptionTier: true }
    });

    const userTier = user?.subscriptionTier;
    const canDownload = userTier === 'basic' || userTier === 'premium' || userTier === 'gold';

    // Check if user is Just VIBES
    const justVibesUser = await prisma.justVibesUser.findUnique({
      where: { id: userId }
    });

    if (justVibesUser || !canDownload) {
      return res.status(403).json({
        error: 'Download requires Basic, Premium, or Gold subscription. Upgrade to download.'
      });
    }

    // For direct purchase content, check if purchased
    if (post.contentType === 'direct_purchase') {
      const purchase = await prisma.directPurchase.findFirst({
        where: { userId, postId: id, status: 'completed' }
      });
      if (!purchase) {
        return res.status(403).json({ error: 'You must purchase this content before downloading' });
      }
    }

    // Generate signed download URL using storage service
    const { getSignedDownloadUrl } = await import('../services/storage.js');
    const downloadUrl = await getSignedDownloadUrl(post.mediaUrl.split('/').pop(), 300);

    res.json({ success: true, downloadUrl });
  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: 'Failed to prepare download' });
  }
});

export default router;
