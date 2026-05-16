import { Router } from "express";
import multer from "multer";
import path from "path";
import { PrismaClient } from "@prisma/client";
import { fileURLToPath } from "url";
import {
  addZLSWatermarkToImage,
  addStandardWatermarkToImage,
  addZLSWatermarkToVideo,
  addStandardWatermarkToVideo,
  addZLSWatermarkToAudio,
  addStandardWatermarkToAudio,
} from "../utils/watermark.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();
const router = Router();

// Multer setup
const storage = multer.diskStorage({
  destination: path.join(__dirname, "..", "uploads"),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});
const upload = multer({
  storage,
  limits: { fileSize: 500 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = /\.(mp3|wav|flac|aac|ogg|m4a|mp4|mov|avi|webm|mkv|jpg|jpeg|png|gif|webp|bmp)$/i;
    if (allowed.test(path.extname(file.originalname))) {
      cb(null, true);
    } else {
      cb(new Error("Invalid file type"));
    }
  },
});

// MIDDLEWARE: Auth (simple token/userId-based; use token from Authorization header)
const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "");
    if (!token) return res.status(401).json({ success: false, message: "Unauthorized" });
    const user = await prisma.user.findFirst({ where: { id: token } });
    if (!user) return res.status(401).json({ success: false, message: "Unauthorized" });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Unauthorized" });
  }
};

// ============================================================
// CREATOR SIGNUP
// ============================================================
router.post("/signup", upload.fields([{ name: "idDocument" }, { name: "selfie" }]), async (req, res) => {
  try {
    const {
      artistName, tagline, category, bio, musicJourney,
      idNumber, mobileNumber, dob, email,
      instagram, twitter, tiktok, youtube, spotify, appleMusic, facebook, website,
    } = req.body;

    if (!artistName || !email) {
      return res.status(400).json({ success: false, message: "artistName and email are required" });
    }

    const idDocFile = req.files?.idDocument?.[0];
    const selfieFile = req.files?.selfie?.[0];

    if (!idDocFile || !selfieFile) {
      return res.status(400).json({ success: false, message: "ID document and selfie are required" });
    }

    const existing = await prisma.user.findFirst({ where: { email } });
    if (existing) {
      return res.status(409).json({ success: false, message: "Email already registered" });
    }

    const user = await prisma.user.create({
      data: {
        artistName,
        tagline: tagline || "",
        email,
        role: "creator",
        verificationStatus: "pending_admin",
        isVerified: false,
        bio: bio || "",
        musicJourney: musicJourney || "",
        category: category || "",
        idNumber: idNumber || "",
        mobileNumber: mobileNumber || "",
        dob: dob ? new Date(dob) : null,
        idDocumentUrl: `/uploads/${idDocFile.filename}`,
        selfieUrl: `/uploads/${selfieFile.filename}`,
        socialLinks: {
          instagram: instagram || "",
          twitter: twitter || "",
          tiktok: tiktok || "",
          youtube: youtube || "",
          spotify: spotify || "",
          appleMusic: appleMusic || "",
          facebook: facebook || "",
          website: website || "",
        },
      },
    });

    res.json({ success: true, user: { id: user.id, artistName: user.artistName, verificationStatus: user.verificationStatus } });
  } catch (error) {
    console.error("Creator signup error:", error);
    res.status(500).json({ success: false, message: "Signup failed" });
  }
});

// POST /api/creators/upload - Upload content (audio/video/image/text/event)
router.post("/upload", upload.single("file"), async (req, res) => {
  try {
    const { type, title, description, isFree, price, distribution, creatorId, status, scheduledFor, lyrics, album, thumbnailUrl, coverArtUrl, isAgeRestricted } = req.body;
    const fileUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const parsedDistribution = distribution ? JSON.parse(distribution) : {};

    if (!title || !creatorId) {
      return res.status(400).json({ success: false, message: "Title and creatorId are required" });
    }

    // Apply watermark based on creator type
    let watermarkedUrl = fileUrl;
    if (req.file && type !== "text") {
      try {
        const creator = await prisma.user.findUnique({ where: { id: creatorId }, select: { userType: true, username: true, artistName: true } });
        if (creator) {
          const inputPath = req.file.path;
          const outputPath = inputPath.replace(/\.([^.]+)$/, "_wm.$1");
          if (type === "image") {
            if (creator.userType === "zls_artist") {
              await addZLSWatermarkToImage(inputPath, outputPath, creator.username, creator.artistName);
            } else {
              await addStandardWatermarkToImage(inputPath, outputPath, creator.username);
            }
            watermarkedUrl = `/uploads/${outputPath.split("/").pop()}`;
          } else if (type === "video") {
            if (creator.userType === "zls_artist") {
              await addZLSWatermarkToVideo(inputPath, outputPath, creator.username, creator.artistName);
            } else {
              await addStandardWatermarkToVideo(inputPath, outputPath, creator.username);
            }
            watermarkedUrl = `/uploads/${outputPath.split("/").pop()}`;
          } else if (type === "audio") {
            if (creator.userType === "zls_artist") {
              await addZLSWatermarkToAudio(inputPath, outputPath, creator.username, creator.artistName);
            } else {
              await addStandardWatermarkToAudio(inputPath, outputPath, creator.username);
            }
            watermarkedUrl = `/uploads/${outputPath.split("/").pop()}`;
          }
        }
      } catch (wmError) {
        console.warn("Watermark application failed, using original:", wmError.message);
      }
    }

    const post = await prisma.post.create({
      data: {
        type: type || "text",
        title,
        description: description || "",
        mediaUrl: watermarkedUrl,
        thumbnailUrl: thumbnailUrl || coverArtUrl || (type === "video" ? watermarkedUrl : null),
        isFree: isFree === "true" || isFree === true,
        price: price ? parseFloat(price) : 0,
        creatorId,
        distributionSelections: parsedDistribution,
        status: status || "pending_admin",
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        lyrics: lyrics || null,
        album: album || null,
        isAgeRestricted: isAgeRestricted === "true" || isAgeRestricted === true,
      },
    });

    // If it's an image type post, add to galleryPhotos
    if (type === "image" && fileUrl) {
      const creator = await prisma.user.findUnique({ where: { id: creatorId } });
      const existingGallery = creator?.galleryPhotos || [];
      await prisma.user.update({
        where: { id: creatorId },
        data: {
          galleryPhotos: [...existingGallery, { url: fileUrl, story: description || "" }],
        },
      });
    }

    // Create notification for followers
    if (status === "published") {
      try {
        await createPostNotification(creatorId, post.id, post.title);
      } catch {}
    }

    res.json({ success: true, post });
  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ success: false, message: "Upload failed" });
  }
});

// Helper: Notify followers of new post
async function createPostNotification(creatorId, postId, postTitle) {
  const creator = await prisma.user.findUnique({ where: { id: creatorId }, select: { artistName: true } });
  const followers = await prisma.follow.findMany({ where: { followingId: creatorId }, select: { followerId: true } });
  const notifications = followers.map((f) => ({
    userId: f.followerId,
    type: "like",
    message: `${creator?.artistName || "Someone"} posted: "${postTitle?.slice(0, 50)}"`,
    fromUserId: creatorId,
    postId,
  }));
  if (notifications.length > 0) {
    await prisma.notification.createMany({ data: notifications });
  }
}

// PUT /api/creators/posts/:id - Edit post
router.put("/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, price, thumbnailUrl, coverArtUrl, lyrics, album, isFree } = req.body;

    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const updateData = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (price !== undefined) updateData.price = parseFloat(price);
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;
    if (coverArtUrl !== undefined) updateData.coverArtUrl = coverArtUrl;
    if (lyrics !== undefined) updateData.lyrics = lyrics;
    if (album !== undefined) updateData.album = album;
    if (isFree !== undefined) updateData.isFree = isFree === "true" || isFree === true;

    const updated = await prisma.post.update({ where: { id }, data: updateData });
    res.json({ success: true, post: updated });
  } catch (error) {
    console.error("Edit post error:", error);
    res.status(500).json({ success: false, message: "Edit failed" });
  }
});

// DELETE /api/creators/posts/:id - Delete post
router.delete("/posts/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    // Remove all interactions
    await prisma.postInteraction.deleteMany({ where: { postId: id } });
    await prisma.commentLike.deleteMany({ where: { comment: { postId: id } } });
    await prisma.comment.deleteMany({ where: { postId: id } });
    await prisma.notification.deleteMany({ where: { postId: id } });
    await prisma.post.delete({ where: { id } });

    res.json({ success: true, message: "Post deleted" });
  } catch (error) {
    console.error("Delete post error:", error);
    res.status(500).json({ success: false, message: "Delete failed" });
  }
});

// POST /api/creators/posts/:id/pin - Pin/unpin post
router.post("/posts/:id/pin", async (req, res) => {
  try {
    const { id } = req.params;
    const post = await prisma.post.findUnique({ where: { id } });
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const updated = await prisma.post.update({
      where: { id },
      data: { isPinned: !post.isPinned },
    });
    res.json({ success: true, post: updated });
  } catch (error) {
    console.error("Pin post error:", error);
    res.status(500).json({ success: false, message: "Pin toggle failed" });
  }
});

// GET /api/creators/posts/:id/analytics - Post analytics
router.get("/posts/:id/analytics", async (req, res) => {
  try {
    const { id } = req.params;
    const post = await prisma.post.findUnique({ where: { id }, include: { interactions: true } });
    if (!post) return res.status(404).json({ success: false, message: "Post not found" });

    const views = post.interactions.filter((i) => i.type === "view").length;
    const likes = post.interactions.filter((i) => i.type === "like").length;
    const comments = post.interactions.filter((i) => i.type === "comment").length;
    const downloads = post.interactions.filter((i) => i.type === "download").length;
    const shares = post.interactions.filter((i) => i.type === "share").length;
    const paidDownloads = post.interactions.filter((i) => i.type === "download" && !post.isFree).length;
    const earnings = paidDownloads * post.price;

    res.json({
      success: true,
      analytics: {
        views, likes, comments, downloads, shares,
        paidDownloads, earnings,
        postTitle: post.title,
      },
    });
  } catch (error) {
    console.error("Post analytics error:", error);
    res.status(500).json({ success: false, message: "Analytics fetch failed" });
  }
});

// ============================================================
// COMMENTS
// ============================================================
// GET /api/creators/posts/:id/comments
router.get("/posts/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const comments = await prisma.comment.findMany({
      where: { postId: id },
      include: {
        user: { select: { id: true, artistName: true, profilePhotoUrl: true } },
        _count: { select: { commentLikes: true, replies: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Build nested structure
    const topLevel = comments.filter((c) => !c.parentId);
    const children = comments.filter((c) => c.parentId);

    const nested = topLevel.map((c) => ({
      ...c,
      likes: c._count.commentLikes,
      replyCount: c._count.replies,
      replies: children.filter((r) => r.parentId === c.id).map((r) => ({
        ...r,
        likes: r._count.commentLikes,
        replyCount: r._count.replies,
      })),
    }));

    res.json({ success: true, comments: nested });
  } catch (error) {
    console.error("Get comments error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch comments" });
  }
});

// POST /api/creators/posts/:id/comments - Add comment
router.post("/posts/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, text, parentId } = req.body;
    if (!userId || !text) {
      return res.status(400).json({ success: false, message: "userId and text are required" });
    }

    const comment = await prisma.comment.create({
      data: { postId: id, userId, text, parentId: parentId || null },
      include: {
        user: { select: { id: true, artistName: true, profilePhotoUrl: true } },
        _count: { select: { commentLikes: true } },
      },
    });

    // Notify post owner
    const post = await prisma.post.findUnique({ where: { id }, select: { creatorId: true } });
    if (post && post.creatorId !== userId) {
      await prisma.notification.create({
        data: {
          userId: post.creatorId,
          type: "comment",
          message: `${comment.user.artistName || "Someone"} commented on your post`,
          fromUserId: userId,
          postId: id,
        },
      });
    }

    res.json({ success: true, comment: { ...comment, likes: comment._count.commentLikes } });
  } catch (error) {
    console.error("Add comment error:", error);
    res.status(500).json({ success: false, message: "Comment failed" });
  }
});

// POST /api/creators/comments/:id/like - Like/unlike comment
router.post("/comments/:id/like", async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: "userId is required" });

    const existing = await prisma.commentLike.findUnique({
      where: { userId_commentId: { userId, commentId: id } },
    });

    if (existing) {
      await prisma.commentLike.delete({ where: { userId_commentId: { userId, commentId: id } } });
      return res.json({ success: true, liked: false });
    }

    await prisma.commentLike.create({ data: { userId, commentId: id } });
    res.json({ success: true, liked: true });
  } catch (error) {
    console.error("Like comment error:", error);
    res.status(500).json({ success: false, message: "Like failed" });
  }
});

// DELETE /api/creators/comments/:id - Delete comment
router.delete("/comments/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await prisma.comment.findUnique({ where: { id }, include: { post: true } });
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });

    // Also delete nested replies and their likes
    const childIds = await prisma.comment.findMany({ where: { parentId: id }, select: { id: true } });
    for (const child of childIds) {
      await prisma.commentLike.deleteMany({ where: { commentId: child.id } });
    }
    await prisma.comment.deleteMany({ where: { parentId: id } });
    await prisma.commentLike.deleteMany({ where: { commentId: id } });
    await prisma.comment.delete({ where: { id } });

    res.json({ success: true, message: "Comment deleted" });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ success: false, message: "Delete failed" });
  }
});

// ============================================================
// POST INTERACTION (like, comment, save, share, download, view)
// ============================================================
router.post("/interact", async (req, res) => {
  try {
    const { userId, postId, type, content } = req.body;
    if (!userId || !postId || !type) {
      return res.status(400).json({ success: false, message: "userId, postId, and type are required" });
    }

    const interaction = await prisma.postInteraction.create({
      data: { userId, postId, type, content: content || null },
    });

    // Notify post creator on like/comment
    if (type === "like" || type === "comment") {
      const post = await prisma.post.findUnique({ where: { id: postId }, select: { creatorId: true, title: true } });
      if (post && post.creatorId !== userId) {
        await prisma.notification.create({
          data: {
            userId: post.creatorId,
            type,
            message: `Someone ${type === "like" ? "liked" : "commented on"} your post: "${post.title?.slice(0, 40)}"`,
            fromUserId: userId,
            postId,
          },
        });
      }
    }

    res.json({ success: true, interaction });
  } catch (error) {
    console.error("Interaction error:", error);
    res.status(500).json({ success: false, message: "Interaction failed" });
  }
});

// ============================================================
// FOLLOW / UNFOLLOW
// ============================================================
router.post("/follow", async (req, res) => {
  try {
    const { followerId, followingId } = req.body;
    if (!followerId || !followingId) {
      return res.status(400).json({ success: false, message: "followerId and followingId are required" });
    }

    // Check if blocked
    const blocked = await prisma.blockedUser.findUnique({
      where: { blockerId_blockedId: { blockerId: followingId, blockedId: followerId } },
    });
    if (blocked) {
      return res.status(403).json({ success: false, message: "You cannot follow this creator" });
    }

    const existing = await prisma.follow.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });

    if (existing) {
      await prisma.follow.delete({ where: { followerId_followingId: { followerId, followingId } } });
      return res.json({ success: true, following: false });
    }

    await prisma.follow.create({ data: { followerId, followingId } });

    // Notify
    await prisma.notification.create({
      data: {
        userId: followingId,
        type: "follow",
        message: "Someone started following you",
        fromUserId: followerId,
      },
    });

    res.json({ success: true, following: true });
  } catch (error) {
    console.error("Follow error:", error);
    res.status(500).json({ success: false, message: "Follow action failed" });
  }
});

// GET /api/creators/:id/followers - Get followers list
router.get("/:id/followers", async (req, res) => {
  try {
    const { id } = req.params;
    const follows = await prisma.follow.findMany({
      where: { followingId: id },
      include: {
        follower: {
          select: { id: true, artistName: true, email: true, profilePhotoUrl: true, coverPhotoUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, followers: follows.map((f) => f.follower) });
  } catch (error) {
    console.error("Get followers error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch followers" });
  }
});

// GET /api/creators/:id/subscribers - Get subscribers list with subscription details
router.get("/:id/subscribers", async (req, res) => {
  try {
    const { id } = req.params;
    const subs = await prisma.subscription.findMany({
      where: { creatorId: id, status: "active" },
      include: {
        subscriber: {
          select: { id: true, artistName: true, email: true, profilePhotoUrl: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
    const subscribers = subs.map((s) => ({
      id: s.subscriber.id,
      name: s.subscriber.artistName,
      email: s.subscriber.email,
      avatar: s.subscriber.profilePhotoUrl,
      tier: s.tier,
      joinedDate: s.createdAt,
      price: s.price,
    }));

    // Revenue breakdown
    const basicRevenue = subs.filter((s) => s.tier === "Basic").reduce((sum, s) => sum + s.price, 0);
    const premiumRevenue = subs.filter((s) => s.tier === "Premium").reduce((sum, s) => sum + s.price, 0);
    const goldRevenue = subs.filter((s) => s.tier === "Gold").reduce((sum, s) => sum + s.price, 0);
    const totalRevenue = basicRevenue + premiumRevenue + goldRevenue;

    res.json({
      success: true,
      subscribers,
      revenue: { basic: basicRevenue, premium: premiumRevenue, gold: goldRevenue, total: totalRevenue },
    });
  } catch (error) {
    console.error("Get subscribers error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch subscribers" });
  }
});

// ============================================================
// BLOCK USERS
// ============================================================
// POST /api/creators/users/:id/block - Block a user
router.post("/users/:id/block", async (req, res) => {
  try {
    const { id } = req.params; // user to block
    const { blockerId } = req.body;
    if (!blockerId) return res.status(400).json({ success: false, message: "blockerId is required" });

    const existing = await prisma.blockedUser.findUnique({
      where: { blockerId_blockedId: { blockerId, blockedId: id } },
    });
    if (existing) {
      await prisma.blockedUser.delete({ where: { blockerId_blockedId: { blockerId, blockedId: id } } });
      return res.json({ success: true, blocked: false });
    }

    await prisma.blockedUser.create({ data: { blockerId, blockedId: id } });

    // Remove any follow relationship
    await prisma.follow.deleteMany({
      where: {
        OR: [
          { followerId: blockerId, followingId: id },
          { followerId: id, followingId: blockerId },
        ],
      },
    });

    res.json({ success: true, blocked: true });
  } catch (error) {
    console.error("Block user error:", error);
    res.status(500).json({ success: false, message: "Block failed" });
  }
});

// ============================================================
// REPORTS
// ============================================================
// POST /api/creators/reports - Report a user
router.post("/reports", async (req, res) => {
  try {
    const { reporterId, reportedUserId, reason, details } = req.body;
    if (!reporterId || !reportedUserId || !reason) {
      return res.status(400).json({ success: false, message: "reporterId, reportedUserId, and reason are required" });
    }

    const report = await prisma.report.create({
      data: { reporterId, reportedUserId, reason, details: details || "" },
    });
    res.json({ success: true, report });
  } catch (error) {
    console.error("Report error:", error);
    res.status(500).json({ success: false, message: "Report failed" });
  }
});

// ============================================================
// NOTIFICATIONS
// ============================================================
// GET /api/creators/notifications/:userId - Get notifications
router.get("/notifications/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      include: {
        fromUser: { select: { id: true, artistName: true, profilePhotoUrl: true } },
      },
    });
    const unreadCount = await prisma.notification.count({ where: { userId, read: false } });

    res.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error("Get notifications error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch notifications" });
  }
});

// POST /api/creators/notifications/mark-read - Mark notifications as read
router.post("/notifications/mark-read", async (req, res) => {
  try {
    const { userId, notificationIds } = req.body;
    if (!userId) return res.status(400).json({ success: false, message: "userId is required" });

    if (notificationIds && notificationIds.length > 0) {
      await prisma.notification.updateMany({
        where: { id: { in: notificationIds }, userId },
        data: { read: true },
      });
    } else {
      await prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });
    }
    res.json({ success: true });
  } catch (error) {
    console.error("Mark notifications read error:", error);
    res.status(500).json({ success: false, message: "Mark read failed" });
  }
});

// ============================================================
// WITHDRAWALS
// ============================================================
// GET /api/creators/:id/withdrawals - Get withdrawal history
router.get("/:id/withdrawals", async (req, res) => {
  try {
    const { id } = req.params;
    const withdrawals = await prisma.withdrawal.findMany({
      where: { creatorId: id },
      orderBy: { createdAt: "desc" },
    });
    res.json({ success: true, withdrawals });
  } catch (error) {
    console.error("Get withdrawals error:", error);
    res.status(500).json({ success: false, message: "Failed to fetch withdrawals" });
  }
});

// POST /api/creators/withdraw - Request withdrawal
router.post("/withdraw", async (req, res) => {
  try {
    const { creatorId, amount, bankDetails } = req.body;
    const MIN_WITHDRAWAL = 500;
    if (!creatorId || !amount) {
      return res.status(400).json({ success: false, message: "creatorId and amount are required" });
    }
    if (parseFloat(amount) < MIN_WITHDRAWAL) {
      return res.status(400).json({ success: false, message: `Minimum withdrawal amount is R${MIN_WITHDRAWAL}` });
    }

    const withdrawal = await prisma.withdrawal.create({
      data: {
        creatorId,
        amount: parseFloat(amount),
        bankDetails: bankDetails || "Default bank",
        status: "pending",
      },
    });
    res.json({ success: true, withdrawal });
  } catch (error) {
    console.error("Withdraw error:", error);
    res.status(500).json({ success: false, message: "Withdrawal request failed" });
  }
});

// ============================================================
// PROFILE / TEMPLATE
// ============================================================
// PUT /api/creators/:id/update - Update creator profile
router.put("/:id/update", upload.single("coverImage"), async (req, res) => {
  try {
    const { id } = req.params;
    const { artistName, tagline, fullBio, musicJourney, category, socialLinks, template } = req.body;

    const creator = await prisma.user.findUnique({ where: { id } });
    if (!creator) {
      return res.status(404).json({ success: false, message: "Creator not found" });
    }

    const updateData = {};

    if (artistName) updateData.artistName = artistName;
    if (tagline !== undefined) updateData.tagline = tagline;
    if (fullBio) updateData.bio = fullBio;
    if (musicJourney) updateData.musicJourney = musicJourney;
    if (category) updateData.category = category;
    if (template) updateData.template = template;

    if (socialLinks) {
      const parsed = JSON.parse(socialLinks);
      updateData.socialLinks = {
        instagram: parsed.instagram || creator.socialLinks?.instagram || "",
        twitter: parsed.twitter || creator.socialLinks?.twitter || "",
        tiktok: parsed.tiktok || creator.socialLinks?.tiktok || "",
        youtube: parsed.youtube || creator.socialLinks?.youtube || "",
        spotify: parsed.spotify || creator.socialLinks?.spotify || "",
        appleMusic: parsed.appleMusic || creator.socialLinks?.appleMusic || "",
        facebook: parsed.facebook || creator.socialLinks?.facebook || "",
        website: parsed.website || creator.socialLinks?.website || "",
      };
    }

    if (req.file) {
      updateData.coverPhotoUrl = `/uploads/${req.file.filename}`;
    }

    const updated = await prisma.user.update({ where: { id }, data: updateData });
    res.json({ success: true, creator: updated });
  } catch (error) {
    console.error("Update creator error:", error);
    res.status(500).json({ success: false, message: "Update failed" });
  }
});

// PUT /api/creators/:id/template - Update template only
router.put("/:id/template", async (req, res) => {
  try {
    const { id } = req.params;
    const { template } = req.body;
    if (!template) return res.status(400).json({ success: false, message: "template is required" });

    const updated = await prisma.user.update({ where: { id }, data: { template } });
    res.json({ success: true, template: updated.template });
  } catch (error) {
    console.error("Update template error:", error);
    res.status(500).json({ success: false, message: "Template update failed" });
  }
});

// GET /api/creators/status/:userId - Get verification status
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
        createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (error) {
    console.error("Status check error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// GET /api/creators/:username - Get creator profile with all content
router.get("/:username", async (req, res) => {
  try {
    const { username } = req.params;
    const preview = req.query.preview === "true";

    const creator = await prisma.user.findFirst({
      where: {
        artistName: { equals: username, mode: "insensitive" },
        role: "creator",
        verificationStatus: "approved",
      },
      include: {
        posts: {
          orderBy: [{ isPinned: "desc" }, { createdAt: "desc" }],
          include: { interactions: true },
        },
      },
    });

    if (!creator) {
      return res.status(404).json({ success: false, message: "Creator not found" });
    }

    // Separate posts by type
    const songs = creator.posts.filter((p) => p.type === "audio");
    const videos = creator.posts.filter((p) => p.type === "video");
    const galleryPhotos = creator.galleryPhotos || [];
    const textPosts = creator.posts.filter((p) => p.type === "text");
    const imagePosts = creator.posts.filter((p) => p.type === "image");
    const vipContent = creator.posts.filter((p) => !p.isFree);
    const events = creator.posts.filter((p) => p.type === "event");
    const drafts = creator.posts.filter((p) => p.status === "draft");
    const scheduled = creator.posts.filter((p) => p.status === "scheduled");

    // Build derived stats
    const followerCount = await prisma.follow.count({ where: { followingId: creator.id } });
    const subscriberCount = await prisma.subscription.count({ where: { creatorId: creator.id, status: "active" } });
    const totalLikes = creator.posts.reduce((sum, p) => sum + (p.interactions?.filter((i) => i.type === "like").length || 0), 0);
    const totalViews = creator.posts.reduce((sum, p) => sum + (p.interactions?.filter((i) => i.type === "view").length || 0), 0);

    res.json({
      success: true,
      preview,
      creator: {
        ...creator,
        songs,
        videos,
        galleryPhotos,
        posts: [...textPosts, ...imagePosts],
        vipContent,
        events,
        drafts,
        scheduled,
        followerCount,
        subscriberCount,
        totalLikes,
        totalViews,
      },
    });
  } catch (error) {
    console.error("Get creator error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

export default router;