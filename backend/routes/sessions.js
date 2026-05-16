import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Get all active sessions for current user
router.get('/', async (req, res) => {
  try {
    const sessions = await prisma.session.findMany({
      where: { userId: req.user.id },
      select: { id: true, createdAt: true, expiresAt: true },
    });
    res.json({ success: true, sessions });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to fetch sessions' });
  }
});

// Terminate a specific session (remote logout)
router.delete('/:sessionId', async (req, res) => {
  try {
    await prisma.session.delete({ where: { id: req.params.sessionId } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to terminate session' });
  }
});

// Terminate all other sessions (keep current)
router.post('/terminate-others', async (req, res) => {
  try {
    await prisma.session.deleteMany({
      where: { userId: req.user.id, id: { not: req.session.id } },
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to terminate sessions' });
  }
});

export default router;