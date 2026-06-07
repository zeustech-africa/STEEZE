import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin, requireSuperAdmin } from '../../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// ============ LEGAL REQUESTS ============

// GET /api/admin/legal/requests - List all legal requests
router.get('/requests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, type, page = 1, limit = 20 } = req.query;
    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    
    const skip = (parseInt(page) - 1) * parseInt(limit);
    const requests = await prisma.legalRequest.findMany({
      where,
      skip,
      take: parseInt(limit),
      orderBy: { createdAt: 'desc' }
    });
    
    const total = await prisma.legalRequest.count({ where });
    
    res.json({ 
      success: true, 
      requests, 
      total, 
      page: parseInt(page), 
      limit: parseInt(limit) 
    });
  } catch (error) {
    console.error('Get legal requests error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch legal requests' });
  }
});

// GET /api/admin/legal/requests/:id - Get single legal request
router.get('/requests/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const request = await prisma.legalRequest.findUnique({
      where: { id }
    });
    
    if (!request) {
      return res.status(404).json({ success: false, message: 'Request not found' });
    }
    
    res.json({ success: true, request });
  } catch (error) {
    console.error('Get legal request error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch request' });
  }
});

// POST /api/admin/legal/requests/:id/process - Process legal request
router.post('/requests/:id/process', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, resolution, adminNotes, assignedTo, priority } = req.body;
    const adminId = req.user.id;
    
    const data = {
      status: status || 'processing',
      resolution: resolution,
      adminNotes: adminNotes,
      assignedTo: assignedTo,
      priority: priority,
      updatedAt: new Date()
    };
    
    if (status === 'completed') {
      data.completedAt = new Date();
      data.completedBy = adminId;
    }
    
    const request = await prisma.legalRequest.update({
      where: { id },
      data
    });
    
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'process_legal_request',
        targetType: 'legal_request',
        targetId: id,
        details: { status, resolution, adminNotes }
      }
    });
    
    res.json({ success: true, request });
  } catch (error) {
    console.error('Process legal request error:', error);
    res.status(500).json({ success: false, message: 'Failed to process request' });
  }
});

// POST /api/admin/legal/requests - Create legal request (for manual entry)
router.post('/requests', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { type, userEmail, requestDetails, priority = 'normal' } = req.body;
    const adminId = req.user.id;
    
    if (!type || !userEmail || !requestDetails) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    const request = await prisma.legalRequest.create({
      data: {
        type,
        userEmail,
        requestDetails,
        priority,
        assignedTo: adminId,
        createdAt: new Date()
      }
    });
    
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'create_legal_request',
        targetType: 'legal_request',
        targetId: request.id,
        details: { type, userEmail }
      }
    });
    
    res.json({ success: true, request });
  } catch (error) {
    console.error('Create legal request error:', error);
    res.status(500).json({ success: false, message: 'Failed to create legal request' });
  }
});

// ============ LEGAL HOLDS ============

// GET /api/admin/legal/holds - List active legal holds
router.get('/holds', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const holds = await prisma.legalRequest.findMany({
      where: { legalHoldActive: true },
      orderBy: { createdAt: 'desc' }
    });
    
    const evidencePreservations = await prisma.evidencePreservation.findMany({
      where: { status: 'active' },
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ 
      success: true, 
      legalHolds: holds,
      evidencePreservations
    });
  } catch (error) {
    console.error('Get legal holds error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch legal holds' });
  }
});

// POST /api/admin/legal/holds/user/:userId - Place legal hold on user
router.post('/holds/user/:userId', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason, expiresAt, legalCaseRef } = req.body;
    const adminId = req.user.id;
    
    if (!reason) {
      return res.status(400).json({ success: false, message: 'Reason is required' });
    }
    
    // Update user to indicate legal hold
    await prisma.user.update({
      where: { id: userId },
      data: { legalHoldActive: true }
    });
    
    // Create legal request record for the hold
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true }
    });
    
    const legalHold = await prisma.legalRequest.create({
      data: {
        type: 'legal_hold',
        userId,
        userEmail: user?.email || '',
        requestDetails: reason,
        status: 'processing',
        priority: 'legal_hold',
        legalHoldActive: true,
        legalHoldReason: reason,
        legalHoldExpires: expiresAt ? new Date(expiresAt) : null,
        assignedTo: adminId
      }
    });
    
    // Create evidence preservation record
    await prisma.evidencePreservation.create({
      data: {
        caseId: `LEGAL-${Date.now()}`,
        userId,
        contentType: 'user_data',
        reason,
        preservedBy: adminId,
        legalCaseRef,
        expiresAt: expiresAt ? new Date(expiresAt) : null
      }
    });
    
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'place_legal_hold',
        targetType: 'user',
        targetId: userId,
        details: { reason, legalCaseRef }
      }
    });
    
    res.json({ success: true, legalHold });
  } catch (error) {
    console.error('Place legal hold error:', error);
    res.status(500).json({ success: false, message: 'Failed to place legal hold' });
  }
});

// DELETE /api/admin/legal/holds/user/:userId - Release legal hold
router.delete('/holds/user/:userId', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { releaseReason } = req.body;
    const adminId = req.user.id;
    
    // Update user to remove legal hold
    await prisma.user.update({
      where: { id: userId },
      data: { legalHoldActive: false }
    });
    
    // Update legal request
    await prisma.legalRequest.updateMany({
      where: { userId, legalHoldActive: true },
      data: {
        legalHoldActive: false,
        status: 'completed',
        resolution: `Legal hold released. Reason: ${releaseReason || 'Not specified'}`,
        completedAt: new Date(),
        completedBy: adminId
      }
    });
    
    // Update evidence preservation
    await prisma.evidencePreservation.updateMany({
      where: { userId, status: 'active' },
      data: {
        status: 'released',
        releasedAt: new Date(),
        releasedBy: adminId,
        releaseReason
      }
    });
    
    await prisma.auditLog.create({
      data: {
        adminId,
        action: 'release_legal_hold',
        targetType: 'user',
        targetId: userId,
        details: { releaseReason }
      }
    });
    
    res.json({ success: true, message: 'Legal hold released' });
  } catch (error) {
    console.error('Release legal hold error:', error);
    res.status(500).json({ success: false, message: 'Failed to release legal hold' });
  }
});

// ============ EVIDENCE PRESERVATION ============

// GET /api/admin/legal/evidence - List evidence preservations
router.get('/evidence', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};
    if (status) where.status = status;
    
    const evidence = await prisma.evidencePreservation.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    });
    
    res.json({ success: true, evidence });
  } catch (error) {
    console.error('Get evidence error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch evidence' });
  }
});

export default router;