import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';
import {
  getRevenueFraudStats,
  getRevenueFraudAlerts,
  resolveRevenueFraudAlert,
  markRevenueFraudFalsePositive,
  detectAbnormalEarnings,
  detectSuspiciousWithdrawals,
  detectRevenueManipulation
} from '../../services/revenueFraudService.js';

const router = express.Router();
const prisma = new PrismaClient();

// ============ REVENUE FRAUD ALERTS ============

// GET /api/admin/revenue-fraud/alerts - List revenue fraud alerts
router.get('/alerts', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, severity, alertType, userId, page = 1, limit = 20 } = req.query;
    const filters = { status, severity, alertType, userId };
    const result = await getRevenueFraudAlerts(filters, parseInt(page), parseInt(limit));
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Get revenue fraud alerts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch alerts' });
  }
});

// GET /api/admin/revenue-fraud/alerts/:id - Get single alert
router.get('/alerts/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await prisma.revenueFraudAlert.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, email: true, username: true, artistName: true } },
        investigator: { select: { id: true, email: true, username: true } }
      }
    });
    
    if (!alert) {
      return res.status(404).json({ success: false, message: 'Alert not found' });
    }
    
    res.json({ success: true, alert });
  } catch (error) {
    console.error('Get revenue fraud alert error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch alert' });
  }
});

// POST /api/admin/revenue-fraud/alerts/:id/resolve - Resolve alert
router.post('/alerts/:id/resolve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;
    const adminId = req.user.id;
    
    const alert = await resolveRevenueFraudAlert(id, adminId, resolution);
    res.json({ success: true, alert });
  } catch (error) {
    console.error('Resolve revenue fraud alert error:', error);
    res.status(500).json({ success: false, message: 'Failed to resolve alert' });
  }
});

// POST /api/admin/revenue-fraud/alerts/:id/false-positive - Mark as false positive
router.post('/alerts/:id/false-positive', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;
    const adminId = req.user.id;
    
    const alert = await markRevenueFraudFalsePositive(id, adminId, resolution);
    res.json({ success: true, alert });
  } catch (error) {
    console.error('Mark false positive error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark as false positive' });
  }
});

// ============ REVENUE FRAUD DASHBOARD ============

// GET /api/admin/revenue-fraud/dashboard - Dashboard stats
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await getRevenueFraudStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Get revenue fraud dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
});

// ============ REVENUE FRAUD SCANNING ============

// POST /api/admin/revenue-fraud/scan - Run manual fraud scan
router.post('/scan', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.body;
    let results = {};
    
    if (userId) {
      results.abnormalEarnings = await detectAbnormalEarnings(userId);
      results.suspiciousWithdrawals = await detectSuspiciousWithdrawals(userId);
      results.revenueManipulation = await detectRevenueManipulation(userId);
    } else {
      // Scan all users
      const users = await prisma.user.findMany({
        where: { userType: { in: ['zls_artist', 'independent_creator'] } },
        select: { id: true }
      });
      
      for (const user of users) {
        await detectAbnormalEarnings(user.id);
        await detectSuspiciousWithdrawals(user.id);
        await detectRevenueManipulation(user.id);
      }
      results = { message: `Scanned ${users.length} creators` };
    }
    
    res.json({ success: true, results });
  } catch (error) {
    console.error('Revenue fraud scan error:', error);
    res.status(500).json({ success: false, message: 'Failed to run fraud scan' });
  }
});

// ============ FRAUD LOGS ============

// GET /api/admin/revenue-fraud/streaming-logs - Get streaming fraud logs
router.get('/streaming-logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, isSuspicious } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {};
    if (isSuspicious !== undefined) where.isSuspicious = isSuspicious === 'true';
    
    const [logs, total] = await Promise.all([
      prisma.streamingFraudLog.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, username: true } }
        }
      }),
      prisma.streamingFraudLog.count({ where })
    ]);
    
    res.json({ success: true, logs, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error('Get streaming logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch streaming logs' });
  }
});

// GET /api/admin/revenue-fraud/withdrawal-logs - Get withdrawal fraud logs
router.get('/withdrawal-logs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 50, isSuspicious } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {};
    if (isSuspicious !== undefined) where.isSuspicious = isSuspicious === 'true';
    
    const [logs, total] = await Promise.all([
      prisma.withdrawalFraudLog.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: { select: { id: true, email: true, username: true } }
        }
      }),
      prisma.withdrawalFraudLog.count({ where })
    ]);
    
    res.json({ success: true, logs, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error('Get withdrawal logs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch withdrawal logs' });
  }
});

// ============ ALERT TYPES ============

// GET /api/admin/revenue-fraud/alert-types - Get alert type options
router.get('/alert-types', authenticateToken, requireAdmin, async (req, res) => {
  const alertTypes = [
    { value: 'abnormal_earnings', label: 'Abnormal Earnings', severity: 'high' },
    { value: 'suspicious_withdrawal', label: 'Suspicious Withdrawal', severity: 'medium' },
    { value: 'revenue_manipulation', label: 'Revenue Manipulation', severity: 'critical' },
    { value: 'fake_streaming', label: 'Fake Streaming', severity: 'medium' },
    { value: 'click_fraud', label: 'Click Fraud', severity: 'high' }
  ];
  res.json({ success: true, alertTypes });
});

export default router;