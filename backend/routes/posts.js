import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateAny as auth } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

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

export default router;