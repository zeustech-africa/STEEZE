import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/admin/notes/user/:userId - Get all notes for a user
router.get('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    
    const notes = await prisma.adminNote.findMany({
      where: { userId },
      include: {
        admin: {
          select: { id: true, email: true, username: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ success: true, notes });
  } catch (error) {
    console.error('Get admin notes error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch notes' });
  }
});

// POST /api/admin/notes/user/:userId - Add a note to a user
router.post('/user/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { note, type = 'general' } = req.body;
    const adminId = req.user.id;

    if (!note || note.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Note content is required' });
    }

    const adminNote = await prisma.adminNote.create({
      data: {
        userId,
        adminId,
        note: note.trim(),
        type
      },
      include: {
        admin: {
          select: { id: true, email: true, username: true }
        }
      }
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'add_admin_note',
        targetType: 'user',
        targetId: userId,
        details: { note: note.substring(0, 100), type }
      }
    });

    res.json({ success: true, note: adminNote });
  } catch (error) {
    console.error('Add admin note error:', error);
    res.status(500).json({ success: false, message: 'Failed to add note' });
  }
});

// DELETE /api/admin/notes/:noteId - Delete a note
router.delete('/:noteId', authenticateToken, async (req, res) => {
  try {
    const { noteId } = req.params;
    const adminId = req.user.id;

    const note = await prisma.adminNote.findUnique({
      where: { id: noteId }
    });

    if (!note) {
      return res.status(404).json({ success: false, message: 'Note not found' });
    }

    await prisma.adminNote.delete({ where: { id: noteId } });

    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'delete_admin_note',
        targetType: 'user',
        targetId: note.userId,
        details: { noteId }
      }
    });

    res.json({ success: true, message: 'Note deleted' });
  } catch (error) {
    console.error('Delete admin note error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete note' });
  }
});

export default router;
