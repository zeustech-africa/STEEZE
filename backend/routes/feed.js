import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateAny as auth } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/feed/interactions — return liked and saved post IDs for the current user
router.get("/interactions", auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const [likedInteractions, reposts] = await Promise.all([
      prisma.postInteraction.findMany({
        where: { userId, type: "like" },
        select: { postId: true },
      }),
      prisma.repost.findMany({
        where: { repostedBy: userId },
        select: { originalPostId: true },
      }),
    ]);

    const liked = likedInteractions.map((i) => i.postId);
    const saved = reposts.map((r) => r.originalPostId);

    res.json({ success: true, liked, saved });
  } catch (error) {
    console.error("Feed interactions error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch interactions" });
  }
});

// GET /api/feed/for-you — algorithm-based feed
router.get("/for-you", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Get user's liked categories for preference-based ranking
    const userLikes = await prisma.postInteraction.findMany({
      where: { userId, type: "like" },
      include: { post: { select: { category: true } } },
      take: 50,
    });

    const categoryPreferences = [
      ...new Set(userLikes.map((l) => l.post?.category).filter(Boolean)),
    ];

    // Check if user is under 18 for age filtering
    const viewerAge = req.user?.birthDate
      ? Math.floor((new Date().getTime() - new Date(req.user.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000))
      : 99;
    const ageRestrictionFilter = viewerAge < 18 ? { isAgeRestricted: false } : {};

    // Get original posts
    const originalPosts = await prisma.post.findMany({
      where: {
        adminStatus: "approved_global",
        ...ageRestrictionFilter,
        ...(categoryPreferences.length > 0
          ? { category: { in: categoryPreferences } }
          : {}),
      },
      skip,
      take,
      include: {
        creator: {
          select: { id: true, artistName: true, username: true, profilePicUrl: true },
        },
        _count: { select: { interactions: true, comments: true, reposts: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Get reposts
    const reposts = await prisma.repost.findMany({
      where: {},
      skip,
      take,
      include: {
        originalPost: {
          include: {
            creator: {
              select: { id: true, artistName: true, username: true, profilePicUrl: true },
            },
          },
        },
        repostedByUser: {
          select: { id: true, artistName: true, username: true, profilePicUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // Format reposts to look like posts with attribution
    const formattedReposts = reposts.map((repost) => ({
      id: repost.id,
      type: repost.originalPost.type,
      title: repost.originalPost.title,
      description: repost.originalPost.description,
      mediaUrl: repost.originalPost.mediaUrl,
      thumbnail: repost.originalPost.thumbnailUrl,
      content: repost.originalPost.content,
      caption: repost.repostComment,
      category: repost.originalPost.category,
      createdAt: repost.createdAt,
      creator: repost.originalPost.creator,
      creatorId: repost.originalPost.creatorId,
      likeCount: 0,
      commentCount: 0,
      saveCount: 1,
      isRepost: true,
      repostedBy: repost.repostedByUser,
      originalCreator: repost.originalPost.creator,
    }));

    // Combine and sort by date
    const allPosts = [
      ...originalPosts.map((p) => ({
        ...p,
        likeCount: p._count?.interactions ?? 0,
        commentCount: p._count?.comments ?? 0,
        saveCount: p._count?.reposts ?? 0,
        isRepost: false,
      })),
      ...formattedReposts,
    ];
    allPosts.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const paginatedPosts = allPosts.slice(skip, skip + take);

    res.json({
      success: true,
      posts: paginatedPosts,
      hasMore: allPosts.length > skip + take,
    });
  } catch (error) {
    console.error("For-you feed error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch feed" });
  }
});

// GET /api/feed/following — posts from followed creators
router.get("/following", auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);

    if (followingIds.length === 0) {
      return res.json({ success: true, posts: [], hasMore: false });
    }

    const originalPosts = await prisma.post.findMany({
      where: { creatorId: { in: followingIds }, adminStatus: "approved_global" },
      skip,
      take,
      include: {
        creator: {
          select: { id: true, artistName: true, username: true, profilePicUrl: true },
        },
        _count: { select: { interactions: true, comments: true, reposts: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const repostsFromFollowed = await prisma.repost.findMany({
      where: { repostedBy: { in: followingIds } },
      skip,
      take,
      include: {
        originalPost: {
          include: {
            creator: {
              select: { id: true, artistName: true, username: true, profilePicUrl: true },
            },
          },
        },
        repostedByUser: {
          select: { id: true, artistName: true, username: true, profilePicUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formattedReposts = repostsFromFollowed.map((repost) => ({
      id: repost.id,
      type: repost.originalPost.type,
      title: repost.originalPost.title,
      mediaUrl: repost.originalPost.mediaUrl,
      thumbnail: repost.originalPost.thumbnailUrl,
      category: repost.originalPost.category,
      createdAt: repost.createdAt,
      creator: repost.originalPost.creator,
      creatorId: repost.originalPost.creatorId,
      likeCount: 0,
      commentCount: 0,
      saveCount: 1,
      isRepost: true,
      repostedBy: repost.repostedByUser,
      originalCreator: repost.originalPost.creator,
    }));

    const allPosts = [
      ...originalPosts.map((p) => ({
        ...p,
        likeCount: p._count?.interactions ?? 0,
        commentCount: p._count?.comments ?? 0,
        saveCount: p._count?.reposts ?? 0,
        isRepost: false,
      })),
      ...formattedReposts,
    ];
    allPosts.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const paginatedPosts = allPosts.slice(0, take);

    res.json({
      success: true,
      posts: paginatedPosts,
      hasMore: allPosts.length > take,
    });
  } catch (error) {
    console.error("Following feed error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch feed" });
  }
});

// GET /api/feed/:topic — topic-based feed (music, comedy, dance, drama)
router.get("/:topic", auth, async (req, res) => {
  try {
    const { topic } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const take = parseInt(limit);

    // Map frontend feed IDs to category names
    const topicCategoryMap = {
      music: "music",
      comedy: "comedy",
      dance: "dance",
      drama: "drama",
    };

    const category = topicCategoryMap[topic];
    if (!category) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid topic" });
    }

    const posts = await prisma.post.findMany({
      where: { category, adminStatus: "approved_global" },
      skip,
      take,
      include: {
        creator: {
          select: { id: true, artistName: true, username: true, profilePicUrl: true },
        },
        _count: { select: { interactions: true, comments: true, reposts: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = posts.map((p) => ({
      ...p,
      likeCount: p._count?.interactions ?? 0,
      commentCount: p._count?.comments ?? 0,
      saveCount: p._count?.reposts ?? 0,
      isRepost: false,
    }));

    res.json({
      success: true,
      posts: formatted,
      hasMore: formatted.length === take,
    });
  } catch (error) {
    console.error("Topic feed error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch feed" });
  }
});

export default router;