import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Helper to send notification to content owner
async function notifyContentOwner(contentId, message, type) {
  // Find content and its owner
  const content = await prisma.post.findFirst({
    where: { id: contentId },
    select: { userId: true, title: true }
  });
  
  if (content) {
    await prisma.notification.create({
      data: {
        userId: content.userId,
        type: type,
        title: 'Copyright Claim Update',
        message: message,
        isRead: false
      }
    });
  }
}

// GET /api/admin/copyright - List all copyright claims
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const claims = await prisma.copyrightClaim.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });
    
    const total = await prisma.copyrightClaim.count({ where });
    
    res.json({ 
      success: true, 
      claims, 
      total, 
      page: parseInt(page), 
      limit: parseInt(limit) 
    });
  } catch (error) {
    console.error('Get copyright claims error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch copyright claims' });
  }
});

// GET /api/admin/copyright/:id - Get single copyright claim
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const claim = await prisma.copyrightClaim.findUnique({
      where: { id }
    });
    
    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }
    
    res.json({ success: true, claim });
  } catch (error) {
    console.error('Get copyright claim error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch claim' });
  }
});

// POST /api/admin/copyright/:id/approve - Approve takedown
router.post('/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes, action = 'takedown' } = req.body;
    const adminId = req.user.id;
    
    const claim = await prisma.copyrightClaim.findUnique({
      where: { id }
    });
    
    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }
    
    // If contentId exists, take down the content
    if (claim.contentId && action === 'takedown') {
      await prisma.post.update({
        where: { id: claim.contentId },
        data: { 
          status: 'takedown',
          isActive: false,
          takedownReason: 'Copyright infringement - DMCA claim'
        }
      });
      
      await notifyContentOwner(
        claim.contentId,
        `Your content has been removed due to a copyright claim. You may file a counter-notice if you believe this was in error.`,
        'copyright_takedown'
      );
    }
    
    const updatedClaim = await prisma.copyrightClaim.update({
      where: { id },
      data: {
        status: 'approved',
        action,
        adminNotes,
        resolvedAt: new Date(),
        resolvedBy: adminId
      }
    });
    
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'approve_copyright_claim',
        targetType: 'copyright_claim',
        targetId: id,
        details: { action, adminNotes }
      }
    });
    
    res.json({ success: true, claim: updatedClaim });
  } catch (error) {
    console.error('Approve copyright claim error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve claim' });
  }
});

// POST /api/admin/copyright/:id/reject - Reject copyright claim
router.post('/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { adminNotes, resolutionNote } = req.body;
    const adminId = req.user.id;
    
    const claim = await prisma.copyrightClaim.findUnique({
      where: { id }
    });
    
    if (!claim) {
      return res.status(404).json({ success: false, message: 'Claim not found' });
    }
    
    const updatedClaim = await prisma.copyrightClaim.update({
      where: { id },
      data: {
        status: 'rejected',
        adminNotes,
        resolutionNote,
        resolvedAt: new Date(),
        resolvedBy: adminId
      }
    });
    
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'reject_copyright_claim',
        targetType: 'copyright_claim',
        targetId: id,
        details: { resolutionNote }
      }
    });
    
    res.json({ success: true, claim: updatedClaim });
  } catch (error) {
    console.error('Reject copyright claim error:', error);
    res.status(500).json({ success: false, message: 'Failed to reject claim' });
  }
});

// POST /api/admin/copyright/:id/resolve - Mark as resolved
router.post('/:id/resolve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { resolutionNote } = req.body;
    const adminId = req.user.id;
    
    const updatedClaim = await prisma.copyrightClaim.update({
      where: { id },
      data: {
        status: 'resolved',
        resolutionNote,
        resolvedAt: new Date(),
        resolvedBy: adminId
      }
    });
    
    res.json({ success: true, claim: updatedClaim });
  } catch (error) {
    console.error('Resolve copyright claim error:', error);
    res.status(500).json({ success: false, message: 'Failed to resolve claim' });
  }
});

export default router;