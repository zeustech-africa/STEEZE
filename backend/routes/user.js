import express from "express";
import { PrismaClient } from "@prisma/client";
import { authenticateAny as authenticateToken, optionalAuth } from "../middleware/auth.js";

const router = express.Router();
const prisma = new PrismaClient();

// ============================================
// PROFILE & SOCIAL ENDPOINTS
// ============================================

// Update user bio
router.put("/user/bio", authenticateToken, async (req, res) => {
  try {
    const { bio } = req.body;
    const userId = req.user.id;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { bio: bio || null }
    });

    res.json({ success: true, bio: updatedUser.bio });
  } catch (error) {
    console.error("Update bio error:", error);
    res.status(500).json({ error: "Failed to update bio" });
  }
});

// Get user's followers list (own)
router.get("/user/followers", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            fullName: true,
            username: true,
            profilePicUrl: true,
            userType: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Check if current user follows each follower
    const followersWithFollowStatus = await Promise.all(
      followers.map(async (f) => {
        const isFollowing = await prisma.follow.findFirst({
          where: {
            followerId: userId,
            followingId: f.follower.id
          }
        });
        return {
          id: f.follower.id,
          fullName: f.follower.fullName,
          username: f.follower.username,
          profilePicUrl: f.follower.profilePicUrl,
          userType: f.follower.userType,
          isFollowing: !!isFollowing,
          isCurrentUser: userId === f.follower.id
        };
      })
    );

    res.json({ success: true, followers: followersWithFollowStatus });
  } catch (error) {
    console.error("Get followers error:", error);
    res.status(500).json({ error: "Failed to get followers" });
  }
});

// Get user's following list (own)
router.get("/user/following", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            fullName: true,
            username: true,
            profilePicUrl: true,
            userType: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const followingWithFollowStatus = following.map((f) => ({
      id: f.following.id,
      fullName: f.following.fullName,
      username: f.following.username,
      profilePicUrl: f.following.profilePicUrl,
      userType: f.following.userType,
      isFollowing: true,
      isCurrentUser: userId === f.following.id
    }));

    res.json({ success: true, following: followingWithFollowStatus });
  } catch (error) {
    console.error("Get following error:", error);
    res.status(500).json({ error: "Failed to get following" });
  }
});

// Remove follower (own)
router.delete("/user/followers/:followerId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { followerId } = req.params;

    await prisma.follow.deleteMany({
      where: {
        followerId: followerId,
        followingId: userId
      }
    });

    res.json({ success: true, message: "Follower removed" });
  } catch (error) {
    console.error("Remove follower error:", error);
    res.status(500).json({ error: "Failed to remove follower" });
  }
});

// Unfollow user (own)
router.delete("/user/following/:followingId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { followingId } = req.params;

    await prisma.follow.deleteMany({
      where: {
        followerId: userId,
        followingId: followingId
      }
    });

    res.json({ success: true, message: "Unfollowed successfully" });
  } catch (error) {
    console.error("Unfollow error:", error);
    res.status(500).json({ error: "Failed to unfollow" });
  }
});

// ============================================
// FOLLOWER & FOLLOWING ENDPOINTS (any user)
// ============================================

// Get followers list for a user
router.get("/user/:userId/followers", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const followers = await prisma.follow.findMany({
      where: { followingId: userId },
      include: {
        follower: {
          select: {
            id: true,
            fullName: true,
            username: true,
            profilePicUrl: true,
            userType: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Check if current user follows each follower
    const followersWithFollowStatus = await Promise.all(
      followers.map(async (f) => {
        const isFollowing = await prisma.follow.findFirst({
          where: {
            followerId: currentUserId,
            followingId: f.follower.id
          }
        });
        return {
          id: f.follower.id,
          fullName: f.follower.fullName,
          username: f.follower.username,
          profilePicUrl: f.follower.profilePicUrl,
          userType: f.follower.userType,
          isFollowing: !!isFollowing,
          isCurrentUser: currentUserId === f.follower.id
        };
      })
    );

    res.json({ success: true, followers: followersWithFollowStatus });
  } catch (error) {
    console.error("Get followers error:", error);
    res.status(500).json({ error: "Failed to get followers" });
  }
});

// Get following list for a user
router.get("/user/:userId/following", authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const currentUserId = req.user.id;

    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      include: {
        following: {
          select: {
            id: true,
            fullName: true,
            username: true,
            profilePicUrl: true,
            userType: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const followingWithFollowStatus = following.map((f) => ({
      id: f.following.id,
      fullName: f.following.fullName,
      username: f.following.username,
      profilePicUrl: f.following.profilePicUrl,
      userType: f.following.userType,
      isFollowing: true,
      isCurrentUser: currentUserId === f.following.id
    }));

    res.json({ success: true, following: followingWithFollowStatus });
  } catch (error) {
    console.error("Get following error:", error);
    res.status(500).json({ error: "Failed to get following" });
  }
});

// Remove follower
router.delete("/user/:userId/remove-follower/:followerId", authenticateToken, async (req, res) => {
  try {
    const { userId, followerId } = req.params;
    const currentUserId = req.user.id;

    // Verify user is removing their own follower
    if (currentUserId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await prisma.follow.deleteMany({
      where: {
        followerId: followerId,
        followingId: userId
      }
    });

    res.json({ success: true, message: "Follower removed" });
  } catch (error) {
    console.error("Remove follower error:", error);
    res.status(500).json({ error: "Failed to remove follower" });
  }
});

// Unfollow user
router.delete("/user/:userId/unfollow/:followingId", authenticateToken, async (req, res) => {
  try {
    const { userId, followingId } = req.params;
    const currentUserId = req.user.id;

    if (currentUserId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await prisma.follow.deleteMany({
      where: {
        followerId: userId,
        followingId: followingId
      }
    });

    res.json({ success: true, message: "Unfollowed successfully" });
  } catch (error) {
    console.error("Unfollow error:", error);
    res.status(500).json({ error: "Failed to unfollow" });
  }
});

// ============================================
// BLOCK & MUTE ENDPOINTS
// ============================================

// Block user (own)
router.post("/user/block/:targetId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetId } = req.params;

    if (userId === targetId) {
      return res.status(400).json({ error: "Cannot block yourself" });
    }

    // Remove follow relationships if they exist
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: userId, followingId: targetId },
          { followerId: targetId, followingId: userId }
        ]
      }
    });

    // Create block record (upsert to avoid duplicates)
    await prisma.blockedUser.upsert({
      where: { blockerId_blockedId: { blockerId: userId, blockedId: targetId } },
      update: {},
      create: { blockerId: userId, blockedId: targetId }
    });

    res.json({ success: true, message: "User blocked" });
  } catch (error) {
    console.error("Block user error:", error);
    res.status(500).json({ error: "Failed to block user" });
  }
});

// Unblock user (own)
router.delete("/user/block/:targetId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetId } = req.params;

    await prisma.blockedUser.deleteMany({
      where: {
        blockerId: userId,
        blockedId: targetId
      }
    });

    res.json({ success: true, message: "User unblocked" });
  } catch (error) {
    console.error("Unblock user error:", error);
    res.status(500).json({ error: "Failed to unblock user" });
  }
});

// Check if user is blocked (own)
router.get("/user/block/:targetId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetId } = req.params;

    const block = await prisma.blockedUser.findFirst({
      where: {
        blockerId: userId,
        blockedId: targetId
      }
    });

    res.json({ isBlocked: !!block });
  } catch (error) {
    console.error("Check block error:", error);
    res.status(500).json({ error: "Failed to check block status" });
  }
});

// Block user (any user context)
router.post("/user/:userId/block/:targetId", authenticateToken, async (req, res) => {
  try {
    const { userId, targetId } = req.params;
    const currentUserId = req.user.id;

    if (currentUserId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    if (userId === targetId) {
      return res.status(400).json({ error: "Cannot block yourself" });
    }

    // Remove follow relationships if they exist
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: userId, followingId: targetId },
          { followerId: targetId, followingId: userId }
        ]
      }
    });

    // Create block record
    await prisma.blockedUser.upsert({
      where: { blockerId_blockedId: { blockerId: userId, blockedId: targetId } },
      update: {},
      create: { blockerId: userId, blockedId: targetId }
    });

    res.json({ success: true, message: "User blocked" });
  } catch (error) {
    console.error("Block user error:", error);
    res.status(500).json({ error: "Failed to block user" });
  }
});

// Unblock user (any user context)
router.delete("/user/:userId/unblock/:targetId", authenticateToken, async (req, res) => {
  try {
    const { userId, targetId } = req.params;
    const currentUserId = req.user.id;

    if (currentUserId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await prisma.blockedUser.deleteMany({
      where: {
        blockerId: userId,
        blockedId: targetId
      }
    });

    res.json({ success: true, message: "User unblocked" });
  } catch (error) {
    console.error("Unblock user error:", error);
    res.status(500).json({ error: "Failed to unblock user" });
  }
});

// Check if user is blocked (any user context)
router.get("/user/:userId/block-status/:targetId", authenticateToken, async (req, res) => {
  try {
    const { userId, targetId } = req.params;

    const block = await prisma.blockedUser.findFirst({
      where: {
        blockerId: userId,
        blockedId: targetId
      }
    });

    res.json({ isBlocked: !!block });
  } catch (error) {
    console.error("Check block status error:", error);
    res.status(500).json({ error: "Failed to check block status" });
  }
});

// Mute user
router.post("/user/:userId/mute/:targetId", authenticateToken, async (req, res) => {
  try {
    const { userId, targetId } = req.params;
    const currentUserId = req.user.id;

    if (currentUserId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await prisma.mutedUser.upsert({
      where: { userId_mutedUserId: { userId, mutedUserId: targetId } },
      update: {},
      create: { userId, mutedUserId: targetId }
    });

    res.json({ success: true, message: "User muted" });
  } catch (error) {
    console.error("Mute user error:", error);
    res.status(500).json({ error: "Failed to mute user" });
  }
});

// Unmute user
router.delete("/user/:userId/unmute/:targetId", authenticateToken, async (req, res) => {
  try {
    const { userId, targetId } = req.params;
    const currentUserId = req.user.id;

    if (currentUserId !== userId) {
      return res.status(403).json({ error: "Unauthorized" });
    }

    await prisma.mutedUser.deleteMany({
      where: { userId, mutedUserId: targetId }
    });

    res.json({ success: true, message: "User unmuted" });
  } catch (error) {
    console.error("Unmute user error:", error);
    res.status(500).json({ error: "Failed to unmute user" });
  }
});

// Get muted users list
router.get("/user/muted", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const muted = await prisma.mutedUser.findMany({
      where: { userId },
      include: {
        mutedUser: {
          select: {
            id: true,
            fullName: true,
            username: true,
            profilePicUrl: true,
          }
        }
      }
    });

    res.json({ success: true, muted: muted.map(m => m.mutedUser) });
  } catch (error) {
    console.error("Get muted users error:", error);
    res.status(500).json({ error: "Failed to get muted users" });
  }
});

// Mute user (own)
router.post("/user/mute/:targetId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetId } = req.params;

    await prisma.mutedUser.upsert({
      where: { userId_mutedUserId: { userId, mutedUserId: targetId } },
      update: {},
      create: { userId, mutedUserId: targetId }
    });

    res.json({ success: true, message: "User muted" });
  } catch (error) {
    console.error("Mute user error:", error);
    res.status(500).json({ error: "Failed to mute user" });
  }
});

// Unmute user (own)
router.delete("/user/mute/:targetId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetId } = req.params;

    await prisma.mutedUser.deleteMany({
      where: { userId, mutedUserId: targetId }
    });

    res.json({ success: true, message: "User unmuted" });
  } catch (error) {
    console.error("Unmute user error:", error);
    res.status(500).json({ error: "Failed to unmute user" });
  }
});

// Get user's saved posts (for adding to playlists)
router.get("/user/saved-posts", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const savedPosts = await prisma.repost.findMany({
      where: { repostedBy: userId },
      include: {
        originalPost: {
          include: {
            creator: {
              select: {
                id: true,
                fullName: true,
                artistName: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      savedPosts: savedPosts.map(rp => ({
        id: rp.originalPost.id,
        title: rp.originalPost.title,
        mediaUrl: rp.originalPost.mediaUrl,
        type: rp.originalPost.type,
        creator: rp.originalPost.creator
      }))
    });
  } catch (error) {
    console.error("Get saved posts error:", error);
    res.status(500).json({ error: "Failed to get saved posts" });
  }
});

// GET /api/users/:userId/saved - Get user's saved posts with pagination
router.get("/users/:userId/saved", optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0 } = req.query;
    
    const parsedLimit = Math.min(100, parseInt(limit) || 20);
    const parsedOffset = parseInt(offset) || 0;
    
    const [savedPosts, total] = await Promise.all([
      prisma.savedPost.findMany({
        where: { userId },
        include: {
          post: {
            include: {
              creator: {
                select: {
                  id: true,
                  artistName: true,
                  fullName: true,
                  profilePicUrl: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: parsedLimit,
        skip: parsedOffset
      }),
      prisma.savedPost.count({ where: { userId } })
    ]);

    // Enrich with originalCreator attribution
    const enrichedPosts = await Promise.all(savedPosts.map(async (sp) => {
      let originalCreator = sp.post.creator;
      if (sp.post.originalCreatorId) {
        const oc = await prisma.user.findUnique({
          where: { id: sp.post.originalCreatorId },
          select: { id: true, artistName: true, fullName: true }
        });
        if (oc) originalCreator = oc;
      }
      return {
        id: sp.id,
        createdAt: sp.createdAt,
        post: {
          id: sp.post.id,
          title: sp.post.title,
          caption: sp.post.caption,
          mediaUrl: sp.post.mediaUrl,
          mediaType: sp.post.mediaType,
          contentType: sp.post.contentType,
          creator: sp.post.creator,
          originalCreator
        }
      };
    }));
    
    res.json({
      success: true,
      savedPosts: enrichedPosts,
      total,
      hasMore: parsedOffset + parsedLimit < total
    });
  } catch (error) {
    console.error("Get saved posts error:", error);
    res.status(500).json({ error: "Failed to fetch saved posts" });
  }
});

// GET /api/users/:userId/saved/count - Get saved post count
router.get("/users/:userId/saved/count", optionalAuth, async (req, res) => {
  try {
    const { userId } = req.params;
    const count = await prisma.savedPost.count({ where: { userId } });
    res.json({ success: true, count });
  } catch (error) {
    console.error("Get saved count error:", error);
    res.status(500).json({ error: "Failed to fetch saved count" });
  }
});

export default router;
