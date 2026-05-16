import express from 'express';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { processDataExport } from '../services/dataExport.js';
import { authenticateAny, authenticateAdmin } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Request data export
router.post('/request', authenticateAny, async (req, res) => {
  try {
    const { dataTypes } = req.body;
    const userId = req.user.id;

    if (!dataTypes || !Array.isArray(dataTypes) || dataTypes.length === 0) {
      return res.status(400).json({ success: false, message: 'Please select at least one data type to export.' });
    }

    const validTypes = ['profile', 'posts', 'interactions', 'social', 'subscriptions', 'messages', 'login_history'];
    const invalidTypes = dataTypes.filter(t => !validTypes.includes(t));
    if (invalidTypes.length > 0) {
      return res.status(400).json({ success: false, message: `Invalid data types: ${invalidTypes.join(', ')}` });
    }

    const exportRequest = await prisma.dataExportRequest.create({
      data: {
        userId,
        dataTypes,
        status: 'pending',
        requestedAt: new Date(),
      }
    });

    // Process asynchronously (background job)
    setImmediate(() => {
      processDataExport(exportRequest.id).catch(err => {
        console.error('Background export processing error:', err);
      });
    });

    res.json({
      success: true,
      message: 'Export request received. You will receive an email when your data is ready.',
      requestId: exportRequest.id
    });
  } catch (error) {
    console.error('Data export request error:', error);
    res.status(500).json({ success: false, message: 'Failed to create export request.' });
  }
});

// Get export status
router.get('/status/:requestId', authenticateAny, async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await prisma.dataExportRequest.findFirst({
      where: { id: requestId, userId: req.user.id }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Export request not found.' });
    }

    res.json({
      success: true,
      status: request.status,
      fileUrl: request.fileUrl,
      fileSize: request.fileSize,
      expiresAt: request.expiresAt,
      requestedAt: request.requestedAt,
      completedAt: request.completedAt,
      downloadedAt: request.downloadedAt,
    });
  } catch (error) {
    console.error('Export status error:', error);
    res.status(500).json({ success: false, message: 'Failed to get export status.' });
  }
});

// Mark export as downloaded
router.post('/downloaded/:requestId', authenticateAny, async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await prisma.dataExportRequest.findFirst({
      where: { id: requestId, userId: req.user.id }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Export request not found.' });
    }

    await prisma.dataExportRequest.update({
      where: { id: requestId },
      data: { downloadedAt: new Date() }
    });

    res.json({ success: true, message: 'Download recorded.' });
  } catch (error) {
    console.error('Download tracking error:', error);
    res.status(500).json({ success: false, message: 'Failed to record download.' });
  }
});

// Get user's export history
router.get('/history', authenticateAny, async (req, res) => {
  try {
    const exports = await prisma.dataExportRequest.findMany({
      where: { userId: req.user.id },
      orderBy: { requestedAt: 'desc' },
      select: {
        id: true,
        status: true,
        dataTypes: true,
        fileUrl: true,
        fileSize: true,
        expiresAt: true,
        requestedAt: true,
        completedAt: true,
        downloadedAt: true,
      }
    });

    res.json({ success: true, exports });
  } catch (error) {
    console.error('Export history error:', error);
    res.status(500).json({ success: false, message: 'Failed to get export history.' });
  }
});

// Request account deletion (GDPR right to be forgotten)
router.post('/delete-account', authenticateAny, async (req, res) => {
  try {
    const { password } = req.body;
    const userId = req.user.id;

    if (!password) {
      return res.status(400).json({ success: false, message: 'Password is required to confirm account deletion.' });
    }

    // Verify password
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ success: false, message: 'Invalid password.' });
    }

    const deletionScheduledAt = new Date();
    deletionScheduledAt.setDate(deletionScheduledAt.getDate() + 30);

    await prisma.user.update({
      where: { id: userId },
      data: {
        deletionScheduledAt,
        deletionStatus: 'pending',
        isSuspended: true,
      }
    });

    res.json({
      success: true,
      message: 'Account deletion scheduled. You have 30 days to cancel before your data is permanently deleted. You may cancel at any time during this period.',
      cancelDeadline: deletionScheduledAt,
    });
  } catch (error) {
    console.error('Account deletion request error:', error);
    res.status(500).json({ success: false, message: 'Failed to schedule account deletion.' });
  }
});

// Cancel account deletion
router.post('/delete-cancel', authenticateAny, async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.deletionScheduledAt) {
      return res.status(400).json({ success: false, message: 'No pending account deletion found.' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        deletionScheduledAt: null,
        deletionStatus: null,
        isSuspended: false,
      }
    });

    res.json({ success: true, message: 'Account deletion cancelled. Your account has been restored.' });
  } catch (error) {
    console.error('Account deletion cancel error:', error);
    res.status(500).json({ success: false, message: 'Failed to cancel account deletion.' });
  }
});

// Admin: Get all export requests
router.get('/admin/queue', authenticateAdmin, async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;
    const pageNum = parseInt(page);
    const limitNum = parseInt(limit);
    const skip = (pageNum - 1) * limitNum;

    const where = {};
    if (status && ['pending', 'processing', 'completed', 'failed'].includes(status)) {
      where.status = status;
    }

    const [exports, total] = await Promise.all([
      prisma.dataExportRequest.findMany({
        where,
        include: {
          user: { select: { id: true, email: true, username: true, artistName: true } }
        },
        orderBy: { requestedAt: 'desc' },
        skip,
        take: limitNum,
      }),
      prisma.dataExportRequest.count({ where }),
    ]);

    res.json({
      success: true,
      exports,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      }
    });
  } catch (error) {
    console.error('Admin export queue error:', error);
    res.status(500).json({ success: false, message: 'Failed to get export queue.' });
  }
});

// Admin: Force expire an export
router.post('/admin/expire/:requestId', authenticateAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await prisma.dataExportRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Export request not found.' });
    }

    await prisma.dataExportRequest.update({
      where: { id: requestId },
      data: {
        expiresAt: new Date(),
        fileUrl: null,
        status: 'failed',
      }
    });

    res.json({ success: true, message: 'Export has been expired.' });
  } catch (error) {
    console.error('Admin expire export error:', error);
    res.status(500).json({ success: false, message: 'Failed to expire export.' });
  }
});

// Admin: Retry failed export
router.post('/admin/retry/:requestId', authenticateAdmin, async (req, res) => {
  try {
    const { requestId } = req.params;

    const request = await prisma.dataExportRequest.findUnique({
      where: { id: requestId }
    });

    if (!request) {
      return res.status(404).json({ success: false, message: 'Export request not found.' });
    }

    if (request.status !== 'failed') {
      return res.status(400).json({ success: false, message: 'Only failed exports can be retried.' });
    }

    await prisma.dataExportRequest.update({
      where: { id: requestId },
      data: { status: 'pending' }
    });

    setImmediate(() => {
      processDataExport(requestId).catch(err => {
        console.error('Retry export processing error:', err);
      });
    });

    res.json({ success: true, message: 'Export retry initiated.' });
  } catch (error) {
    console.error('Admin retry export error:', error);
    res.status(500).json({ success: false, message: 'Failed to retry export.' });
  }
});

export default router;