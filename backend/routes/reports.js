import express from 'express';
import { authenticateAny, authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();

// ============================================
// REPORT REASONS
// ============================================

const REPORT_REASONS = [
  { value: "spam", label: "Spam or misleading", description: "Promotional content, repetitive messages" },
  { value: "inappropriate", label: "Inappropriate content", description: "Nudity, violence, offensive material" },
  { value: "harassment", label: "Harassment or bullying", description: "Targeted abuse or threats" },
  { value: "hate_speech", label: "Hate speech", description: "Discrimination based on race, religion, gender" },
  { value: "copyright", label: "Copyright infringement", description: "Unauthorized use of copyrighted material" },
  { value: "impersonation", label: "Impersonation", description: "Pretending to be someone else" },
  { value: "misinformation", label: "Misinformation", description: "False or misleading information" },
  { value: "other", label: "Other", description: "Something else" },
];

// ============================================
// USER REPORT ENDPOINTS
// ============================================

// Submit a report
router.post("/reports/content", authenticateAny, async (req, res) => {
  try {
    const userId = req.user.id;
    const { targetType, targetId, reason, customReason } = req.body;

    if (!targetType || !targetId || !reason) {
      return res.status(400).json({ error: "Target type, ID, and reason are required" });
    }

    // Validate reason
    const validReason = REPORT_REASONS.find(r => r.value === reason);
    if (!validReason && reason !== "other") {
      return res.status(400).json({ error: "Invalid report reason" });
    }

    // Check if user already reported this content
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    try {
      const existingReport = await prisma.contentReport.findFirst({
        where: {
          reporterId: userId,
          targetId,
          targetType,
          status: { in: ["pending", "reviewing"] }
        }
      });

      if (existingReport) {
        return res.status(400).json({ error: "You have already reported this content" });
      }

      const report = await prisma.contentReport.create({
        data: {
          reporterId: userId,
          targetType,
          targetId,
          reason,
          customReason: customReason || null,
          status: "pending"
        }
      });

      res.json({ success: true, report });
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error("Submit report error:", error);
    res.status(500).json({ error: "Failed to submit report" });
  }
});

// Get report reasons (for frontend)
router.get("/reports/reasons", authenticateAny, (req, res) => {
  res.json({ success: true, reasons: REPORT_REASONS });
});

// ============================================
// ADMIN REPORT MANAGEMENT
// ============================================

// Get all reports (admin only)
router.get("/admin/reports", authenticateAdmin, async (req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    try {
      const { status, type, limit = 50, offset = 0 } = req.query;

      const where = {};
      if (status) where.status = status;
      if (type) where.targetType = type;

      const reports = await prisma.contentReport.findMany({
        where,
        include: {
          reporter: {
            select: { id: true, fullName: true, email: true, profilePicUrl: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        take: parseInt(limit),
        skip: parseInt(offset)
      });

      const total = await prisma.contentReport.count({ where });

      // Fetch target content details for each report
      const reportsWithContent = await Promise.all(
        reports.map(async (report) => {
          let targetContent = null;

          if (report.targetType === "post") {
            targetContent = await prisma.post.findUnique({
              where: { id: report.targetId },
              select: { id: true, title: true, type: true, creatorId: true, mediaUrl: true }
            });
          } else if (report.targetType === "comment") {
            targetContent = await prisma.comment.findUnique({
              where: { id: report.targetId },
              select: { id: true, text: true, userId: true }
            });
          } else if (report.targetType === "user") {
            targetContent = await prisma.user.findUnique({
              where: { id: report.targetId },
              select: { id: true, fullName: true, email: true, userType: true }
            });
          }

          return { ...report, targetContent };
        })
      );

      res.json({ success: true, reports: reportsWithContent, total });
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error("Get reports error:", error);
    res.status(500).json({ error: "Failed to get reports" });
  }
});

// Get single report details (admin only)
router.get("/admin/reports/:reportId", authenticateAdmin, async (req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    try {
      const { reportId } = req.params;

      const report = await prisma.contentReport.findUnique({
        where: { id: reportId },
        include: {
          reporter: {
            select: { id: true, fullName: true, email: true, profilePicUrl: true }
          }
        }
      });

      if (!report) {
        return res.status(404).json({ error: "Report not found" });
      }

      // Fetch target content
      let targetContent = null;
      if (report.targetType === "post") {
        targetContent = await prisma.post.findUnique({
          where: { id: report.targetId },
          include: { creator: { select: { id: true, fullName: true, artistName: true } } }
        });
      } else if (report.targetType === "comment") {
        targetContent = await prisma.comment.findUnique({
          where: { id: report.targetId },
          include: { user: { select: { id: true, fullName: true } } }
        });
      }

      res.json({ success: true, report, targetContent });
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error("Get report error:", error);
    res.status(500).json({ error: "Failed to get report" });
  }
});

// Update report status (admin only)
router.put("/admin/reports/:reportId", authenticateAdmin, async (req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    try {
      const { reportId } = req.params;
      const { status, adminNote, action } = req.body;

      const updateData = { status };
      if (adminNote) updateData.adminNote = adminNote;
      if (action) updateData.action = action;

      const report = await prisma.contentReport.update({
        where: { id: reportId },
        data: updateData
      });

      // If action is "delete_content", remove the reported content
      if (action === "delete_content") {
        if (report.targetType === "post") {
          await prisma.post.delete({ where: { id: report.targetId } });
        } else if (report.targetType === "comment") {
          await prisma.comment.delete({ where: { id: report.targetId } });
        }
      }

      res.json({ success: true, report });
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error("Update report error:", error);
    res.status(500).json({ error: "Failed to update report" });
  }
});

// Get report statistics (admin only)
router.get("/admin/reports/stats", authenticateAdmin, async (req, res) => {
  try {
    const { PrismaClient } = await import('@prisma/client');
    const prisma = new PrismaClient();
    try {
      const [pending, reviewing, resolved, dismissed] = await Promise.all([
        prisma.contentReport.count({ where: { status: "pending" } }),
        prisma.contentReport.count({ where: { status: "reviewing" } }),
        prisma.contentReport.count({ where: { status: "resolved" } }),
        prisma.contentReport.count({ where: { status: "dismissed" } })
      ]);

      const byType = await prisma.contentReport.groupBy({
        by: ['targetType'],
        _count: { id: true }
      });

      res.json({
        success: true,
        stats: { pending, reviewing, resolved, dismissed, byType }
      });
    } finally {
      await prisma.$disconnect();
    }
  } catch (error) {
    console.error("Get report stats error:", error);
    res.status(500).json({ error: "Failed to get report stats" });
  }
});

export default router;