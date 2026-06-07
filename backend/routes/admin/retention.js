import express from 'express';
import { authenticateToken, requireSuperAdmin } from '../../middleware/auth.js';
import {
  getAllRetentionPolicies,
  getRetentionPolicy,
  updateRetentionPolicy,
  runRetentionCleanup,
  runAllRetentionCleanups,
  getRetentionDashboard,
  getDataTypes
} from '../../services/retentionService.js';

const router = express.Router();

// ============ RETENTION POLICIES ============

// GET /api/admin/retention/policies - Get all retention policies
router.get('/policies', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const policies = await getAllRetentionPolicies();
    res.json({ success: true, policies });
  } catch (error) {
    console.error('Get retention policies error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch retention policies' });
  }
});

// GET /api/admin/retention/policies/:dataType - Get policy by data type
router.get('/policies/:dataType', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { dataType } = req.params;
    const policy = await getRetentionPolicy(dataType);
    res.json({ success: true, policy });
  } catch (error) {
    console.error('Get retention policy error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch retention policy' });
  }
});

// PUT /api/admin/retention/policies/:dataType - Update retention policy
router.put('/policies/:dataType', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { dataType } = req.params;
    const { retentionDays, enabled, autoDelete } = req.body;
    
    const updates = {};
    if (retentionDays !== undefined) updates.retentionDays = retentionDays;
    if (enabled !== undefined) updates.enabled = enabled;
    if (autoDelete !== undefined) updates.autoDelete = autoDelete;
    
    const policy = await updateRetentionPolicy(dataType, updates);
    res.json({ success: true, policy });
  } catch (error) {
    console.error('Update retention policy error:', error);
    res.status(500).json({ success: false, message: 'Failed to update retention policy' });
  }
});

// ============ RETENTION JOBS ============

// POST /api/admin/retention/run/:dataType - Run cleanup for specific data type
router.post('/run/:dataType', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { dataType } = req.params;
    const result = await runRetentionCleanup(dataType);
    res.json({ success: true, result });
  } catch (error) {
    console.error('Run retention cleanup error:', error);
    res.status(500).json({ success: false, message: 'Failed to run retention cleanup' });
  }
});

// POST /api/admin/retention/run-all - Run all retention cleanups
router.post('/run-all', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const results = await runAllRetentionCleanups();
    res.json({ success: true, results });
  } catch (error) {
    console.error('Run all retention cleanups error:', error);
    res.status(500).json({ success: false, message: 'Failed to run retention cleanups' });
  }
});

// ============ RETENTION DASHBOARD ============

// GET /api/admin/retention/dashboard - Get retention dashboard
router.get('/dashboard', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const dashboard = await getRetentionDashboard();
    res.json({ success: true, dashboard });
  } catch (error) {
    console.error('Get retention dashboard error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch retention dashboard' });
  }
});

// GET /api/admin/retention/data-types - Get available data types
router.get('/data-types', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const dataTypes = getDataTypes();
    res.json({ success: true, dataTypes });
  } catch (error) {
    console.error('Get data types error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch data types' });
  }
});

export default router;