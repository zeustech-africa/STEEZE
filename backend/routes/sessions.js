import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

/**
 * GET /api/sessions
 * Get all active sessions for the currently authenticated user.
 * Includes device info, IP, timestamps, and marks the current session.
 */
router.get('/sessions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    const sessions = await prisma.session.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() }
      },
      orderBy: { lastActiveAt: 'desc' },
      select: {
        id: true,
        userAgent: true,
        ipAddress: true,
        createdAt: true,
        lastActiveAt: true,
        expiresAt: true,
        token: true
      }
    });

    // Identify the current session by matching the cookie token
    const currentToken = req.cookies?.accessToken;
    const formattedSessions = sessions.map(session => ({
      id: session.id,
      userAgent: session.userAgent || 'Unknown device',
      ipAddress: session.ipAddress || 'Unknown',
      createdAt: session.createdAt,
      lastActiveAt: session.lastActiveAt,
      expiresAt: session.expiresAt,
      isCurrent: currentToken ? session.token === currentToken : false
    }));

    res.json({ success: true, sessions: formattedSessions });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch sessions' });
  }
});

/**
 * DELETE /api/sessions/:sessionId
 * Revoke a specific session (remote logout of a device).
 */
router.delete('/sessions/:sessionId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { sessionId } = req.params;

    const session = await prisma.session.findFirst({
      where: { id: sessionId, userId }
    });

    if (!session) {
      return res.status(404).json({ success: false, error: 'Session not found' });
    }

    await prisma.session.delete({ where: { id: sessionId } });

    res.json({ success: true, message: 'Session revoked' });
  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({ success: false, error: 'Failed to revoke session' });
  }
});

/**
 * POST /api/sessions/terminate-others
 * Terminate all sessions except the current one.
 */
router.post('/sessions/terminate-others', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const currentToken = req.cookies?.accessToken;

    if (!currentToken) {
      return res.status(400).json({ success: false, error: 'Cannot identify current session' });
    }

    const currentSession = await prisma.session.findFirst({
      where: { token: currentToken, userId }
    });

    if (!currentSession) {
      return res.status(400).json({ success: false, error: 'Current session not found' });
    }

    await prisma.session.deleteMany({
      where: {
        userId,
        id: { not: currentSession.id }
      }
    });

    res.json({ success: true, message: 'All other sessions terminated' });
  } catch (error) {
    console.error('Terminate others error:', error);
    res.status(500).json({ success: false, error: 'Failed to terminate sessions' });
  }
});

export default router;