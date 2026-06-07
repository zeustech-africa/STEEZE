import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin, requireSuperAdmin } from '../../middleware/auth.js';
import {
  getFraudAlerts,
  resolveFraudAlert,
  markAsFalsePositive,
  getFraudDashboardStats,
  recordDeviceFingerprint,
  detectDuplicateAccounts,
  getAdvancedFraudStats,
  getFraudTrends,
  getHighRiskUsers
} from '../../services/fraudDetectionService.js';

const router = express.Router();
const prisma = new PrismaClient();

// ============ FRAUD ALERTS ============

// GET /api/admin/fraud/alerts - List fraud alerts
router.get('/alerts', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { status, severity, alertType, userId, page = 1, limit = 20 } = req.query;
    const filters = { status, severity, alertType, userId };
    const result = await getFraudAlerts(filters, parseInt(page), parseInt(limit));
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Get fraud alerts error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch fraud alerts' });
  }
});

// GET /api/admin/fraud/alerts/:id - Get single fraud alert
router.get('/alerts/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await prisma.fraudAlert.findUnique({
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
    console.error('Get fraud alert error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch alert' });
  }
});

// POST /api/admin/fraud/alerts/:id/resolve - Resolve fraud alert
router.post('/alerts/:id/resolve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;
    const adminId = req.user.id;
    
    const alert = await resolveFraudAlert(id, adminId, resolution);
    res.json({ success: true, alert });
  } catch (error) {
    console.error('Resolve fraud alert error:', error);
    res.status(500).json({ success: false, message: 'Failed to resolve alert' });
  }
});

// POST /api/admin/fraud/alerts/:id/false-positive - Mark as false positive
router.post('/alerts/:id/false-positive', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const { resolution } = req.body;
    const adminId = req.user.id;
    
    const alert = await markAsFalsePositive(id, adminId, resolution);
    res.json({ success: true, alert });
  } catch (error) {
    console.error('Mark false positive error:', error);
    res.status(500).json({ success: false, message: 'Failed to mark as false positive' });
  }
});

// ============ FRAUD DASHBOARD ============

// GET /api/admin/fraud/dashboard - Fraud detection dashboard
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await getFraudDashboardStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Get fraud dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard stats' });
  }
});

// ============ DEVICE MANAGEMENT ============

// GET /api/admin/fraud/devices - List suspicious devices
router.get('/devices', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { page = 1, limit = 20, flagged = 'true' } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const where = {};
    if (flagged === 'true') where.flagged = true;
    
    const [devices, total] = await Promise.all([
      prisma.deviceFingerprint.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { riskScore: 'desc' }
      }),
      prisma.deviceFingerprint.count({ where })
    ]);
    
    res.json({ success: true, devices, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (error) {
    console.error('Get devices error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch devices' });
  }
});

// GET /api/admin/fraud/devices/:fingerprint - Get device details
router.get('/devices/:fingerprint', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { fingerprint } = req.params;
    const device = await prisma.deviceFingerprint.findUnique({
      where: { fingerprint }
    });
    
    if (!device) {
      return res.status(404).json({ success: false, message: 'Device not found' });
    }
    
    // Get user details for each userId in the device
    const userIds = device.userIds || [];
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, email: true, username: true, artistName: true }
    });
    
    res.json({ success: true, device, users });
  } catch (error) {
    console.error('Get device error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch device' });
  }
});

// POST /api/admin/fraud/devices/:fingerprint/flag - Flag/unflag device
router.post('/devices/:fingerprint/flag', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { fingerprint } = req.params;
    const { flagged } = req.body;
    
    const device = await prisma.deviceFingerprint.update({
      where: { fingerprint },
      data: { flagged: flagged !== undefined ? flagged : true }
    });
    
    res.json({ success: true, device });
  } catch (error) {
    console.error('Flag device error:', error);
    res.status(500).json({ success: false, message: 'Failed to flag device' });
  }
});

// ============ FRAUD ALERT TYPES ============

// GET /api/admin/fraud/alert-types - Get alert type options
router.get('/alert-types', authenticateToken, requireAdmin, async (req, res) => {
  const alertTypes = [
    { value: 'duplicate_account', label: 'Duplicate Account', severity: 'medium' },
    { value: 'multiple_accounts', label: 'Multiple Accounts (Same Device)', severity: 'medium' },
    { value: 'suspicious_device', label: 'Suspicious Device', severity: 'low' }
  ];
  res.json({ success: true, alertTypes });
});

// GET /api/admin/fraud/severity-levels - Get severity options
router.get('/severity-levels', authenticateToken, requireAdmin, async (req, res) => {
  const severityLevels = [
    { value: 'low', label: 'Low', color: 'gray' },
    { value: 'medium', label: 'Medium', color: 'yellow' },
    { value: 'high', label: 'High', color: 'orange' },
    { value: 'critical', label: 'Critical', color: 'red' }
  ];
  res.json({ success: true, severityLevels });
});

// ============ ADVANCED FRAUD DETECTION ============

// GET /api/admin/fraud/stats/advanced - Get advanced fraud statistics
router.get('/stats/advanced', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await getAdvancedFraudStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Get advanced fraud stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch advanced stats' });
  }
});

// GET /api/admin/fraud/trends - Get fraud trends over time
router.get('/trends', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const trends = await getFraudTrends(parseInt(days));
    res.json({ success: true, trends, days: parseInt(days) });
  } catch (error) {
    console.error('Get fraud trends error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch fraud trends' });
  }
});

// GET /api/admin/fraud/high-risk-users - Get high-risk users
router.get('/high-risk-users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    const users = await getHighRiskUsers(parseInt(limit));
    res.json({ success: true, users });
  } catch (error) {
    console.error('Get high-risk users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch high-risk users' });
  }
});

// POST /api/admin/fraud/scan - Trigger manual fraud scan
router.post('/scan', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { runFraudScan, updateRiskScores } = await import('../../services/fraudDetectionScheduler.js');
    const scanResults = await runFraudScan();
    await updateRiskScores();
    res.json({ success: true, scanResults });
  } catch (error) {
    console.error('Manual fraud scan error:', error);
    res.status(500).json({ success: false, message: 'Failed to run fraud scan' });
  }
});

// POST /api/admin/fraud/scan/vpn - Detect VPN/proxy usage
router.post('/scan/vpn', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { isLikelyVPN } = await import('../../services/fraudDetectionScheduler.js');
    
    // Get recent users and check their IPs
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentSessions = await prisma.session.findMany({
      where: { createdAt: { gte: oneDayAgo } },
      distinct: ['userId'],
      include: { user: true }
    });
    
    const vpnUsers = [];
    for (const session of recentSessions) {
      if (session.ipAddress && isLikelyVPN(session.ipAddress)) {
        vpnUsers.push(session.userId);
        await createFraudAlert(
          session.userId,
          'vpn_detected',
          'medium',
          60,
          { ipAddress: session.ipAddress, userAgent: session.userAgent }
        );
      }
    }
    
    res.json({ success: true, vpnUsersDetected: vpnUsers.length });
  } catch (error) {
    console.error('VPN scan error:', error);
    res.status(500).json({ success: false, message: 'Failed to run VPN scan' });
  }
});

// POST /api/admin/fraud/risk-score/:userId - Update single user risk score
router.post('/risk-score/:userId', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { userId } = req.params;
    const { updateRiskScores } = await import('../../services/fraudDetectionScheduler.js');
    await updateRiskScores();
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, fraudRiskScore: true }
    });
    
    res.json({ success: true, user });
  } catch (error) {
    console.error('Update risk score error:', error);
    res.status(500).json({ success: false, message: 'Failed to update risk score' });
  }
});

export default router;
