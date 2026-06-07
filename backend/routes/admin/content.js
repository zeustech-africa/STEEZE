import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateAdmin } from '../../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// ============================================
// GET PENDING CONTENT
// ============================================

// Get all pending content (requires admin)
router.get("/pending", authenticateAdmin, async (req, res) => {
  try {
    const { type, limit = 50, offset = 0 } = req.query;

    const where = { status: "pending" };
    if (type && type !== "all") {
      where.type = type;
    }

    const posts = await prisma.post.findMany({
      where,
      include: {
        creator: {
          select: {
            id: true,
            artistName: true,
            artistName: true,
            email: true,
            profilePicUrl: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.post.count({ where });

    res.json({ success: true, posts, total });
  } catch (error) {
    console.error("Get pending content error:", error);
    res.status(500).json({ error: "Failed to get pending content" });
  }
});

// Get single pending content
router.get("/pending/:postId", authenticateAdmin, async (req, res) => {
  try {
    const { postId } = req.params;

    const post = await prisma.post.findFirst({
      where: { id: postId, status: "pending" },
      include: {
        creator: {
          select: {
            id: true,
            artistName: true,
            artistName: true,
            email: true,
            profilePicUrl: true,
            bio: true
          }
        }
      }
    });

    if (!post) {
      return res.status(404).json({ error: "Content not found or already processed" });
    }

    res.json({ success: true, post });
  } catch (error) {
    console.error("Get pending content error:", error);
    res.status(500).json({ error: "Failed to get content" });
  }
});

// ============================================
// CONTENT APPROVAL ACTIONS
// ============================================

// Approve for Global Feed
router.post("/:postId/approve-global", authenticateAdmin, async (req, res) => {
  try {
    const { postId } = req.params;
    const adminId = req.user.id;
    const adminEmail = req.user.email;

    const post = await prisma.post.findFirst({
      where: { id: postId, status: "pending" },
      include: { creator: true }
    });

    if (!post) {
      return res.status(404).json({ error: "Content not found or already processed" });
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        status: "approved_global",
        approvedBy: adminId,
        approvedAt: new Date(),
        isGlobalFeed: true
      }
    });

    // Create audit log
    await prisma.adminAuditLog.create({
      data: {
        adminId,
        adminEmail,
        action: "APPROVE_GLOBAL",
        targetType: "post",
        targetId: postId,
        targetTitle: post.title,
        details: { creatorId: post.creatorId, creatorName: post.creator.artistName || post.creator.username }
      }
    });

    // Create notification for creator
    await prisma.notification.create({
      data: {
        userId: post.creatorId,
        type: "content_approved_global",
        message: `Your content "${post.title}" has been approved and is now visible in the Global Feed!`,
        relatedId: postId
      }
    });

    res.json({ success: true, post: updatedPost });
  } catch (error) {
    console.error("Approve global error:", error);
    res.status(500).json({ error: "Failed to approve content" });
  }
});

// Approve for Profile Only
router.post("/:postId/approve-profile", authenticateAdmin, async (req, res) => {
  try {
    const { postId } = req.params;
    const adminId = req.user.id;
    const adminEmail = req.user.email;

    const post = await prisma.post.findFirst({
      where: { id: postId, status: "pending" },
      include: { creator: true }
    });

    if (!post) {
      return res.status(404).json({ error: "Content not found or already processed" });
    }

    const updatedPost = await prisma.post.update({
      where: { id: postId },
      data: {
        status: "approved_profile",
        approvedBy: adminId,
        approvedAt: new Date(),
        isGlobalFeed: false
      }
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId,
        adminEmail,
        action: "APPROVE_PROFILE",
        targetType: "post",
        targetId: postId,
        targetTitle: post.title,
        details: { creatorId: post.creatorId, creatorName: post.creator.artistName || post.creator.username }
      }
    });

    await prisma.notification.create({
      data: {
        userId: post.creatorId,
        type: "content_approved_profile",
        message: `Your content "${post.title}" has been approved and is visible on your profile.`,
        relatedId: postId
      }
    });

    res.json({ success: true, post: updatedPost });
  } catch (error) {
    console.error("Approve profile error:", error);
    res.status(500).json({ error: "Failed to approve content" });
  }
});

// Reject content
router.post("/:postId/reject", authenticateAdmin, async (req, res) => {
  try {
    const { postId } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;
    const adminEmail = req.user.email;

    const post = await prisma.post.findFirst({
      where: { id: postId, status: "pending" },
      include: { creator: true }
    });

    if (!post) {
      return res.status(404).json({ error: "Content not found or already processed" });
    }

    await prisma.post.update({
      where: { id: postId },
      data: {
        status: "rejected",
        rejectionReason: reason || "Content did not meet community guidelines"
      }
    });

    await prisma.adminAuditLog.create({
      data: {
        adminId,
        adminEmail,
        action: "REJECT",
        targetType: "post",
        targetId: postId,
        targetTitle: post.title,
        details: { reason, creatorId: post.creatorId, creatorName: post.creator.artistName || post.creator.username }
      }
    });

    await prisma.notification.create({
      data: {
        userId: post.creatorId,
        type: "content_rejected",
        message: `Your content "${post.title}" was rejected. Reason: ${reason || "Content did not meet community guidelines"}`,
        relatedId: postId
      }
    });

    res.json({ success: true, message: "Content rejected and deleted" });
  } catch (error) {
    console.error("Reject content error:", error);
    res.status(500).json({ error: "Failed to reject content" });
  }
});

// ============================================
// ADMIN DELETE ANY CONTENT
// ============================================

// Delete any content (bypasses pending status)
router.delete("/:postId", authenticateAdmin, async (req, res) => {
  try {
    const { postId } = req.params;
    const adminId = req.user.id;
    const adminEmail = req.user.email;

    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { creator: true }
    });

    if (!post) {
      return res.status(404).json({ error: "Content not found" });
    }

    const postTitle = post.title;

    await prisma.post.delete({ where: { id: postId } });

    await prisma.adminAuditLog.create({
      data: {
        adminId,
        adminEmail,
        action: "DELETE_CONTENT",
        targetType: "post",
        targetId: postId,
        targetTitle: postTitle,
        details: { creatorId: post.creatorId, creatorName: post.creator.artistName || post.creator.username }
      }
    });

    res.json({ success: true, message: "Content deleted" });
  } catch (error) {
    console.error("Delete content error:", error);
    res.status(500).json({ error: "Failed to delete content" });
  }
});

// ============================================
// ADMIN DELETE COMMENTS
// ============================================

// Delete any comment
router.delete("/comments/:commentId", authenticateAdmin, async (req, res) => {
  try {
    const { commentId } = req.params;
    const adminId = req.user.id;
    const adminEmail = req.user.email;

    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: { post: true, user: true }
    });

    if (!comment) {
      return res.status(404).json({ error: "Comment not found" });
    }

    const commentText = comment.text;
    const postTitle = comment.post?.title || "Unknown post";

    await prisma.comment.delete({ where: { id: commentId } });

    await prisma.adminAuditLog.create({
      data: {
        adminId,
        adminEmail,
        action: "DELETE_COMMENT",
        targetType: "comment",
        targetId: commentId,
        targetTitle: postTitle,
        details: { commentText, userId: comment.userId, userName: comment.user?.username }
      }
    });

    res.json({ success: true, message: "Comment deleted" });
  } catch (error) {
    console.error("Delete comment error:", error);
    res.status(500).json({ error: "Failed to delete comment" });
  }
});

// ============================================
// AUDIT LOGS
// ============================================

// Get admin audit logs
router.get("/audit-logs", authenticateAdmin, async (req, res) => {
  try {
    const { limit = 100, offset = 0, action } = req.query;

    const where = {};
    if (action && action !== "all") {
      where.action = action;
    }

    const logs = await prisma.adminAuditLog.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });

    const total = await prisma.adminAuditLog.count({ where });

    res.json({ success: true, logs, total });
  } catch (error) {
    console.error("Get audit logs error:", error);
    res.status(500).json({ error: "Failed to get audit logs" });
  }
});

// Get content approval stats
router.get("/stats", authenticateAdmin, async (req, res) => {
  try {
    const [pending, approvedGlobal, approvedProfile, rejected] = await Promise.all([
      prisma.post.count({ where: { status: "pending" } }),
      prisma.post.count({ where: { status: "approved_global" } }),
      prisma.post.count({ where: { status: "approved_profile" } }),
      prisma.post.count({ where: { status: "rejected" } })
    ]);

    const byType = await prisma.post.groupBy({
      by: ['type'],
      where: { status: "pending" },
      _count: { id: true }
    });

    res.json({
      success: true,
      stats: { pending, approvedGlobal, approvedProfile, rejected, byType }
    });
  } catch (error) {
    console.error("Get stats error:", error);
    res.status(500).json({ error: "Failed to get stats" });
  }
});

export default router;