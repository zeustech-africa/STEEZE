import express from 'express';
import { PrismaClient } from '@prisma/client';
import { sendAlert } from '../services/alertService.js';

const router = express.Router();
const prisma = new PrismaClient();

// Report content (post, comment, user)
router.post('/', async (req, res) => {
  try {
    const { targetType, targetId, reason, details } = req.body;

    // Check if already reported by this user
    const existingReport = await prisma.contentReport.findFirst({
      where: {
        reporterId: req.user.id,
        targetType,
        targetId,
        status: 'pending',
      },
    });

    if (existingReport) {
      return res.status(400).json({ success: false, message: 'You have already reported this content' });
    }

    const report = await prisma.contentReport.create({
      data: {
        reporterId: req.user.id,
        targetType,
        targetId,
        reason,
        details,
        status: 'pending',
      },
    });

    // Notify admins
    await sendAlert(
      'content_reported',
      `Content reported by user: ${req.user.username || req.user.email}`,
      JSON.stringify({ reportId: report.id, targetType, targetId, reason }),
    );

    res.json({ success: true, reportId: report.id });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to submit report' });
  }
});

// Get user's reports (for tracking)
router.get('/my', async (req, res) => {
  try {
    const reports = await prisma.contentReport.findMany({
      where: { reporterId: req.user.id },
      orderBy: { createdAt: 'desc' },
    });
    res.json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch reports' });
  }
});

// Admin: Get all reports
router.get('/all', async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const reports = await prisma.contentReport.findMany({
      orderBy: { createdAt: 'desc' },
      include: { reporter: { select: { id: true, username: true, email: true } } },
    });
    res.json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch reports' });
  }
});

// Admin: Update report status
router.patch('/:reportId', async (req, res) => {
  try {
    if (!req.user.isAdmin) {
      return res.status(403).json({ success: false, message: 'Admin access required' });
    }

    const { status } = req.body;
    const report = await prisma.contentReport.update({
      where: { id: req.params.reportId },
      data: {
        status,
        reviewedAt: new Date(),
        reviewedBy: req.user.id,
      },
    });
    res.json({ success: true, report });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to update report' });
  }
});

export default router;