import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const router = express.Router();
const prisma = new PrismaClient();

// Request account deletion (with 30-day grace period)
router.post('/delete-request', async (req, res) => {
  try {
    const { password } = req.body;

    // Verify password
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    // Set deletion scheduled date (30 days from now)
    const deletionScheduledAt = new Date();
    deletionScheduledAt.setDate(deletionScheduledAt.getDate() + 30);

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        deletionScheduledAt,
        deletionStatus: 'pending',
      },
    });

    res.json({
      success: true,
      message: 'Account deletion scheduled. You have 30 days to cancel. All data will be permanently deleted after that.',
      cancelDeadline: deletionScheduledAt,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to schedule deletion' });
  }
});

// Cancel account deletion
router.post('/delete-cancel', async (req, res) => {
  try {
    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        deletionScheduledAt: null,
        deletionStatus: null,
      },
    });
    res.json({ success: true, message: 'Account deletion cancelled.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to cancel deletion' });
  }
});

// Immediate delete (for GDPR compliance)
router.delete('/delete-immediate', async (req, res) => {
  try {
    const { password } = req.body;

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid password' });
    }

    // Delete all user data (cascade)
    await prisma.postInteraction.deleteMany({ where: { userId: req.user.id } });
    await prisma.post.deleteMany({ where: { creatorId: req.user.id } });
    await prisma.follow.deleteMany({ where: { followerId: req.user.id } });
    await prisma.follow.deleteMany({ where: { followingId: req.user.id } });
    await prisma.subscription.deleteMany({ where: { fanId: req.user.id } });
    await prisma.repost.deleteMany({ where: { repostedBy: req.user.id } });
    await prisma.session.deleteMany({ where: { userId: req.user.id } });
    await prisma.loginHistory.deleteMany({ where: { userId: req.user.id } });
    await prisma.report.deleteMany({ where: { reporterId: req.user.id } });
    await prisma.user.delete({ where: { id: req.user.id } });

    res.json({ success: true, message: 'Account permanently deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to delete account' });
  }
});

export default router;