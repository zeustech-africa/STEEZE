import express from "express";
import bcrypt from "bcryptjs";
import { PrismaClient } from "@prisma/client";

const router = express.Router();
const prisma = new PrismaClient();

// ==================== VIBE SIGNUP (EXISTING) ====================

// POST /api/vibes/signup - Multi-step VIBE registration
router.post("/signup", async (req, res) => {
  try {
    const {
      fullName,
      username,
      email,
      password,
      bio,
      profilePicPreview,
      profilePic,
      subscriptionTier,
      idType,
      idFile,
      idPreview,
      idNumber,
      country,
      selfie,
    } = req.body;

    if (!fullName || !username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields. Full name, username, email, and password are required.",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters.",
      });
    }

    if (username.length < 3) {
      return res.status(400).json({
        success: false,
        message: "Username must be at least 3 characters.",
      });
    }

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { artistName: username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email or username already taken.",
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        role: "vibe",
        verificationStatus: "pending",
        isVerified: false,
        artistName: username,
        bio: bio || "",
        profilePicUrl: profilePicPreview || null,
        idPhotoUrl: idPreview || null,
        selfiePhotoUrl: selfie || null,
        subscriptionTier: subscriptionTier || "free",
      },
    });

    // Create initial verification message for admin
    await prisma.verificationMessage.create({
      data: {
        creatorId: user.id,
        message: `New VIBE application from ${fullName} (@${username}). Tier: ${subscriptionTier || "free"}. ID Type: ${idType || "N/A"}. Country: ${country || "N/A"}.`,
        isFromAdmin: false,
      },
    });

    res.json({
      success: true,
      userId: user.id,
      message: "VIBE application submitted successfully. Please check your pending approval page.",
    });
  } catch (error) {
    console.error("VIBE signup error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error. Please try again later.",
    });
  }
});

// GET /api/vibes/check-email - Check if email is available
router.get("/check-email", async (req, res) => {
  try {
    const { email } = req.query;
    if (!email) {
      return res.status(400).json({ success: false, message: "Email is required" });
    }
    const existing = await prisma.user.findUnique({ where: { email: String(email) } });
    res.json({ success: true, available: !existing });
  } catch (error) {
    console.error("Check email error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/vibes/status/:userId - Get verification status
router.get("/status/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        artistName: true,
        email: true,
        verificationStatus: true,
        isVerified: true,
        subscriptionTier: true,
        createdAt: true,
      },
    });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    res.json({ success: true, user });
  } catch (error) {
    console.error("Status check error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ==================== VIBES FEATURES (NEW) ====================

// Helper: compute age restriction filter for a user
function getAgeRestrictionFilter(user) {
  let viewerAge = 99;
  if (user?.birthDate) {
    viewerAge = Math.floor((new Date().getTime() - new Date(user.birthDate).getTime()) / (365.25 * 24 * 60 * 60 * 1000));
  }
  return viewerAge < 18 ? { isAgeRestricted: false } : {};
}

// ============ EXPLORE PAGE ============
router.get("/explore", async (req, res) => {
  try {
    const { category, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const ageFilter = getAgeRestrictionFilter(req.user);

    let where = { adminStatus: "approved_global", ...ageFilter };
    if (category && category !== "for-you") {
      where.category = category;
    }

    const posts = await prisma.post.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: "desc" },
      include: { creator: { select: { artistName: true, username: true, profilePicUrl: true, category: true } } },
    });

    res.json({ success: true, posts });
  } catch (error) {
    console.error("Explore error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ============ SEARCH CREATORS ============
router.get("/search", async (req, res) => {
  try {
    const { q, category } = req.query;

    const where = { role: "creator", verificationStatus: "approved" };
    if (q) {
      where.OR = [
        { artistName: { contains: q, mode: "insensitive" } },
        { email: { contains: q, mode: "insensitive" } },
      ];
    }
    if (category && category !== "all") {
      where.category = category;
    }

    const creators = await prisma.user.findMany({
      where,
      select: { id: true, artistName: true, email: true, category: true, profilePicUrl: true },
    });

    res.json({ success: true, creators });
  } catch (error) {
    console.error("Search error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ============ TRENDING POSTS ============
router.get("/trending", async (req, res) => {
  try {
    const last24h = new Date();
    last24h.setHours(last24h.getHours() - 24);

    const ageFilter = getAgeRestrictionFilter(req.user);

    const posts = await prisma.post.findMany({
      where: { adminStatus: "approved_global", createdAt: { gte: last24h }, ...ageFilter },
      include: {
        creator: { select: { artistName: true, username: true, profilePicUrl: true, category: true } },
        _count: { select: { interactions: { where: { type: "like" } } } },
      },
      orderBy: [{ isGlobalFeed: "desc" }, { createdAt: "desc" }],
      take: 20,
    });

    res.json({ success: true, posts });
  } catch (error) {
    console.error("Trending error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ============ FOLLOW FEED ============
router.get("/feed/following", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const ageFilter = getAgeRestrictionFilter(req.user);

    const following = await prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);
    const posts = await prisma.post.findMany({
      where: { creatorId: { in: followingIds }, adminStatus: "approved_global", ...ageFilter },
      include: { creator: { select: { artistName: true, username: true, profilePicUrl: true, category: true } } },
      orderBy: { createdAt: "desc" },
    });

    res.json({ success: true, posts });
  } catch (error) {
    console.error("Following feed error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ============ FOR YOU FEED (Algorithm) ============
router.get("/feed/for-you", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const ageFilter = getAgeRestrictionFilter(req.user);

    // Get user's liked categories
    const userLikes = await prisma.postInteraction.findMany({
      where: { userId, type: "like" },
      include: { post: { select: { category: true } } },
    });

    const categoryPreferences = [...new Set(userLikes.map((l) => l.post?.category).filter(Boolean))];

    const where = { adminStatus: "approved_global", ...ageFilter };
    if (categoryPreferences.length > 0) {
      where.OR = [{ category: { in: categoryPreferences } }];
    }

    const posts = await prisma.post.findMany({
      where,
      include: { creator: { select: { artistName: true, username: true, profilePicUrl: true, category: true } } },
      orderBy: { createdAt: "desc" },
      take: 30,
    });

    res.json({ success: true, posts });
  } catch (error) {
    console.error("For you feed error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ============ REPOST ============
router.post("/posts/:id/repost", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    const { comment } = req.body;

    const existing = await prisma.repost.findUnique({
      where: { originalPostId_repostedBy: { originalPostId: id, repostedBy: userId } },
    });

    if (existing) {
      await prisma.repost.delete({ where: { id: existing.id } });
      return res.json({ success: true, reposted: false });
    }

    const repost = await prisma.repost.create({
      data: { originalPostId: id, repostedBy: userId, repostComment: comment },
    });
    res.json({ success: true, reposted: true, repost });
  } catch (error) {
    console.error("Repost error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ============ GET USER REPOSTS ============
router.get("/user/:id/reposts", async (req, res) => {
  try {
    const { id } = req.params;
    const reposts = await prisma.repost.findMany({
      where: { repostedBy: id },
      include: { originalPost: { include: { creator: { select: { artistName: true, username: true, profilePicUrl: true, category: true } } } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, reposts });
  } catch (error) {
    console.error("Get reposts error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ============ REPOST LIKES ============
router.post("/reposts/:id/like", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }

    const existing = await prisma.repostLike.findUnique({
      where: { repostId_userId: { repostId: id, userId } },
    });

    if (existing) {
      await prisma.repostLike.delete({ where: { id: existing.id } });
      return res.json({ success: true, liked: false });
    }

    await prisma.repostLike.create({ data: { repostId: id, userId } });
    res.json({ success: true, liked: true });
  } catch (error) {
    console.error("Repost like error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ============ REPOST COMMENTS ============
router.post("/reposts/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    const { comment } = req.body;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    if (!comment?.trim()) {
      return res.status(400).json({ success: false, message: "Comment is required" });
    }

    const repostComment = await prisma.repostComment.create({
      data: { repostId: id, userId, comment: comment.trim() },
      include: { user: { select: { artistName: true, username: true, profilePicUrl: true } } },
    });
    res.json({ success: true, comment: repostComment });
  } catch (error) {
    console.error("Repost comment error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/reposts/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await prisma.repostComment.findMany({
      where: { repostId: id },
      include: { user: { select: { artistName: true, username: true, profilePicUrl: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, comments });
  } catch (error) {
    console.error("Get repost comments error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ============ MUTE CREATOR ============
router.post("/mute/:creatorId", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    const { creatorId } = req.params;

    const existing = await prisma.mutedUser.findUnique({
      where: { userId_mutedUserId: { userId, mutedUserId: creatorId } },
    });

    if (existing) {
      await prisma.mutedUser.delete({ where: { id: existing.id } });
      return res.json({ success: true, muted: false });
    }

    await prisma.mutedUser.create({ data: { userId, mutedUserId: creatorId } });
    res.json({ success: true, muted: true });
  } catch (error) {
    console.error("Mute error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/muted", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    const muted = await prisma.mutedUser.findMany({
      where: { userId },
      select: { mutedUser: { select: { id: true, artistName: true, username: true, profilePicUrl: true } } },
    });
    res.json({ success: true, muted: muted.map((m) => m.mutedUser) });
  } catch (error) {
    console.error("Get muted users error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ============ PRIVACY SETTINGS ============
router.get("/privacy", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isPrivate: true },
    });
    res.json({ success: true, isPrivate: user?.isPrivate || false });
  } catch (error) {
    console.error("Privacy get error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.put("/privacy", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    const { isPrivate } = req.body;
    await prisma.user.update({
      where: { id: userId },
      data: { isPrivate },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Privacy update error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ============ FOLLOWER REQUESTS ============
router.get("/follower-requests", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    const requests = await prisma.followerRequest.findMany({
      where: { toUserId: userId, status: "pending" },
      include: { fromUser: { select: { id: true, artistName: true, username: true, profilePicUrl: true } } },
    });
    res.json({ success: true, requests });
  } catch (error) {
    console.error("Follower requests get error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.put("/follower-requests/:id", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    const { id } = req.params;
    const { action } = req.body;

    const request = await prisma.followerRequest.findUnique({ where: { id } });
    if (!request || request.toUserId !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    await prisma.followerRequest.update({
      where: { id },
      data: { status: action === "approve" ? "approved" : "declined" },
    });

    if (action === "approve") {
      await prisma.follow.create({
        data: { followerId: request.fromUserId, followingId: request.toUserId },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Follower request update error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ============ REMOVE FOLLOWER ============
router.delete("/followers/:followerId", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    const { followerId } = req.params;

    await prisma.follow.delete({
      where: { followerId_followingId: { followerId, followingId: userId } },
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Remove follower error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ============ SUBSCRIPTION MANAGEMENT ============
router.get("/subscriptions", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    const subscriptions = await prisma.subscription.findMany({
      where: { userId, status: "active" },
      include: { creator: { select: { artistName: true, username: true, profilePicUrl: true } } },
    });
    res.json({ success: true, subscriptions });
  } catch (error) {
    console.error("Subscriptions get error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.delete("/subscriptions/:id", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    await prisma.subscription.update({
      where: { id: req.params.id },
      data: { status: "cancelled", endDate: new Date() },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Cancel subscription error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.put("/subscriptions/:id/tier", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    const { tier } = req.body;
    const tierPrices = { basic: 50, premium: 99, gold: 199 };

    await prisma.subscription.update({
      where: { id: req.params.id },
      data: { tier, price: tierPrices[tier] },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Change tier error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ============ SUBSCRIBE TO CREATOR ============
router.post("/subscribe/:creatorId", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    const { creatorId } = req.params;
    const { tier = "basic" } = req.body;
    const tierPrices = { basic: 50, premium: 99, gold: 199 };

    const existing = await prisma.subscription.findFirst({
      where: { userId, creatorId, status: "active" },
    });

    if (existing) {
      return res.status(400).json({ success: false, message: "Already subscribed" });
    }

    const subscription = await prisma.subscription.create({
      data: {
        userId,
        creatorId,
        tier,
        price: tierPrices[tier],
        status: "active",
      },
    });

    // Create payment record
    await prisma.payment.create({
      data: {
        userId,
        creatorId,
        amount: tierPrices[tier],
        tier,
        status: "completed",
      },
    });

    res.json({ success: true, subscription });
  } catch (error) {
    console.error("Subscribe error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ============ PAYMENT HISTORY ============
router.get("/payments", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    const payments = await prisma.payment.findMany({
      where: { userId },
      include: { creator: { select: { artistName: true, username: true } } },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, payments });
  } catch (error) {
    console.error("Payments get error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ============ PLAYLISTS ============
router.get("/playlists", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    const playlists = await prisma.playlist.findMany({
      where: { userId },
      include: {
        songs: {
          include: {
            post: {
              select: { id: true, title: true, type: true, mediaUrl: true, thumbnailUrl: true, creator: { select: { artistName: true, username: true } } },
            },
          },
          orderBy: { order: "asc" },
        },
      },
      orderBy: { updatedAt: "desc" },
    });
    res.json({ success: true, playlists });
  } catch (error) {
    console.error("Playlists get error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/playlists", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    const { name, description } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: "Playlist name is required" });
    }
    const playlist = await prisma.playlist.create({
      data: { name: name.trim(), description, userId },
    });
    res.json({ success: true, playlist });
  } catch (error) {
    console.error("Playlist create error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.delete("/playlists/:id", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    await prisma.playlist.delete({ where: { id: req.params.id, userId } });
    res.json({ success: true });
  } catch (error) {
    console.error("Playlist delete error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/playlists/:id/songs", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    const { postId } = req.body;
    const { id } = req.params;

    const playlist = await prisma.playlist.findUnique({ where: { id } });
    if (!playlist || playlist.userId !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const songCount = await prisma.playlistSong.count({ where: { playlistId: id } });
    await prisma.playlistSong.create({
      data: { playlistId: id, postId, order: songCount },
    });
    res.json({ success: true });
  } catch (error) {
    console.error("Add song to playlist error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.delete("/playlists/:id/songs/:songId", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    const playlist = await prisma.playlist.findUnique({ where: { id: req.params.id } });
    if (!playlist || playlist.userId !== userId) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    await prisma.playlistSong.delete({ where: { id: req.params.songId } });
    res.json({ success: true });
  } catch (error) {
    console.error("Remove song from playlist error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// ============ RECENTLY PLAYED ============
router.post("/track-play", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    const { postId } = req.body;

    await prisma.recentlyPlayed.deleteMany({
      where: { userId, postId },
    });

    await prisma.recentlyPlayed.create({
      data: { userId, postId, playedAt: new Date() },
    });

    // Keep only last 50
    const old = await prisma.recentlyPlayed.findMany({
      where: { userId },
      orderBy: { playedAt: "desc" },
      skip: 50,
      select: { id: true },
    });
    if (old.length > 0) {
      await prisma.recentlyPlayed.deleteMany({
        where: { id: { in: old.map((o) => o.id) } },
      });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Track play error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.get("/recently-played", async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Authentication required" });
    }
    const recentlyPlayed = await prisma.recentlyPlayed.findMany({
      where: { userId },
      include: { post: { include: { creator: { select: { artistName: true, username: true, profilePicUrl: true } } } } },
      orderBy: { playedAt: "desc" },
      take: 20,
    });
    res.json({ success: true, recentlyPlayed });
  } catch (error) {
    console.error("Recently played get error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;