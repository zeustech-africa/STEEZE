import express from 'express';
import { authenticateToken, requireAdmin, requireSuperAdmin } from '../../middleware/auth.js';
import {
  getRetentionTrends,
  getConversionTrends,
  getAnalyticsDashboard,
  updateDailyAnalytics,
  calculateConversionMetrics,
  calculateCohortRetention
} from '../../services/analyticsService.js';

const router = express.Router();

// ============ RETENTION ANALYTICS ============

// GET /api/admin/analytics/retention/trends - Get retention trends
router.get('/retention/trends', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const trends = await getRetentionTrends(parseInt(months));
    res.json({ success: true, trends, months: parseInt(months) });
  } catch (error) {
    console.error('Get retention trends error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch retention trends' });
  }
});

// GET /api/admin/analytics/retention/cohort - Calculate cohort retention
router.get('/retention/cohort', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    const retention = await calculateCohortRetention(start, end);
    res.json({ success: true, retention });
  } catch (error) {
    console.error('Calculate cohort retention error:', error);
    res.status(500).json({ success: false, message: 'Failed to calculate cohort retention' });
  }
});

// ============ CONVERSION ANALYTICS ============

// GET /api/admin/analytics/conversion/current - Get current conversion metrics
router.get('/conversion/current', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const conversion = await calculateConversionMetrics();
    res.json({ success: true, conversion });
  } catch (error) {
    console.error('Get conversion metrics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch conversion metrics' });
  }
});

// GET /api/admin/analytics/conversion/trends - Get conversion trends
router.get('/conversion/trends', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { months = 6 } = req.query;
    const trends = await getConversionTrends(parseInt(months));
    res.json({ success: true, trends, months: parseInt(months) });
  } catch (error) {
    console.error('Get conversion trends error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch conversion trends' });
  }
});

// ============ DASHBOARD ============

// GET /api/admin/analytics/dashboard - Complete analytics dashboard
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const dashboard = await getAnalyticsDashboard();
    res.json({ success: true, dashboard });
  } catch (error) {
    console.error('Get analytics dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch analytics dashboard' });
  }
});

// ============ MAINTENANCE ============

// POST /api/admin/analytics/refresh - Refresh analytics data (super admin only)
router.post('/refresh', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const result = await updateDailyAnalytics();
    res.json({ success: true, result });
  } catch (error) {
    console.error('Refresh analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to refresh analytics' });
  }
});

export default router;