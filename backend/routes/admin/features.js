import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin, requireSuperAdmin } from '../../middleware/auth.js';
import {
  getAllFeatureFlags,
  getFeatureFlag,
  createFeatureFlag,
  updateFeatureFlag,
  enableFeature,
  disableFeature,
  deleteFeatureFlag,
  getFeatureFlagStats,
  updateFeatureTargeting,
  grantUserFeatureAccess,
  revokeUserFeatureAccess,
  getFeatureUsers,
  userHasFeatureAccess,
  useBetaAccessCode
} from '../../services/featureFlagService.js';

const router = express.Router();
const prisma = new PrismaClient();

// ============ FEATURE FLAG MANAGEMENT ============

// GET /api/admin/features - List all feature flags
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { onlyActive } = req.query;
    const flags = await getAllFeatureFlags(onlyActive === 'true');
    res.json({ success: true, flags });
  } catch (error) {
    console.error('Get feature flags error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch feature flags' });
  }
});

// GET /api/admin/features/stats - Get feature flag statistics
router.get('/stats', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const stats = await getFeatureFlagStats();
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Get feature flag stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch stats' });
  }
});

// GET /api/admin/features/:key - Get single feature flag
router.get('/:key', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const flag = await getFeatureFlag(key);
    
    if (!flag) {
      return res.status(404).json({ success: false, message: 'Feature flag not found' });
    }
    
    res.json({ success: true, flag });
  } catch (error) {
    console.error('Get feature flag error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch feature flag' });
  }
});

// POST /api/admin/features - Create new feature flag (super admin only)
router.post('/', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { key, name, description, enabled = false } = req.body;
    const adminId = req.user.id;
    
    if (!key || !name) {
      return res.status(400).json({ success: false, message: 'Key and name are required' });
    }
    
    // Validate key format (alphanumeric, underscores, dots)
    if (!/^[a-zA-Z0-9_.-]+$/.test(key)) {
      return res.status(400).json({ success: false, message: 'Invalid key format. Use letters, numbers, underscores, dots, or hyphens.' });
    }
    
    const flag = await createFeatureFlag(key, name, description, adminId, enabled);
    
    res.json({ success: true, flag });
  } catch (error) {
    console.error('Create feature flag error:', error);
    res.status(500).json({ success: false, message: error.message || 'Failed to create feature flag' });
  }
});

// PUT /api/admin/features/:key - Update feature flag
router.put('/:key', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { name, description, enabled, isActive } = req.body;
    
    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (enabled !== undefined) updates.enabled = enabled;
    if (isActive !== undefined) updates.isActive = isActive;
    
    const flag = await updateFeatureFlag(key, updates);
    
    res.json({ success: true, flag });
  } catch (error) {
    console.error('Update feature flag error:', error);
    res.status(500).json({ success: false, message: 'Failed to update feature flag' });
  }
});

// POST /api/admin/features/:key/enable - Enable feature flag
router.post('/:key/enable', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const flag = await enableFeature(key);
    res.json({ success: true, flag });
  } catch (error) {
    console.error('Enable feature error:', error);
    res.status(500).json({ success: false, message: 'Failed to enable feature' });
  }
});

// POST /api/admin/features/:key/disable - Disable feature flag
router.post('/:key/disable', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const flag = await disableFeature(key);
    res.json({ success: true, flag });
  } catch (error) {
    console.error('Disable feature error:', error);
    res.status(500).json({ success: false, message: 'Failed to disable feature' });
  }
});

// DELETE /api/admin/features/:key - Delete feature flag (super admin only)
router.delete('/:key', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    await deleteFeatureFlag(key);
    res.json({ success: true, message: 'Feature flag deleted' });
  } catch (error) {
    console.error('Delete feature flag error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete feature flag' });
  }
});

// ============ ADVANCED FEATURE FLAG TARGETING ============

// PUT /api/admin/features/:key/targeting - Update feature targeting
router.put('/:key/targeting', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { targetUsers, targetRoles, targetPercentage, betaAccessCode, betaAccessEnabled } = req.body;
    
    const updates = {};
    if (targetUsers !== undefined) updates.targetUsers = targetUsers;
    if (targetRoles !== undefined) updates.targetRoles = targetRoles;
    if (targetPercentage !== undefined) updates.targetPercentage = targetPercentage;
    if (betaAccessCode !== undefined) updates.betaAccessCode = betaAccessCode;
    if (betaAccessEnabled !== undefined) updates.betaAccessEnabled = betaAccessEnabled;
    
    const flag = await updateFeatureTargeting(key, updates);
    res.json({ success: true, flag });
  } catch (error) {
    console.error('Update feature targeting error:', error);
    res.status(500).json({ success: false, message: 'Failed to update targeting' });
  }
});

// POST /api/admin/features/:key/users/:userId/grant - Grant feature access to user
router.post('/:key/users/:userId/grant', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { key, userId } = req.params;
    const { expiresAt } = req.body;
    const adminId = req.user.id;
    
    const access = await grantUserFeatureAccess(userId, key, adminId, expiresAt ? new Date(expiresAt) : null);
    res.json({ success: true, access });
  } catch (error) {
    console.error('Grant feature access error:', error);
    res.status(500).json({ success: false, message: 'Failed to grant access' });
  }
});

// DELETE /api/admin/features/:key/users/:userId/revoke - Revoke feature access from user
router.delete('/:key/users/:userId/revoke', authenticateToken, requireSuperAdmin, async (req, res) => {
  try {
    const { key, userId } = req.params;
    const adminId = req.user.id;
    
    const access = await revokeUserFeatureAccess(userId, key, adminId);
    res.json({ success: true, access });
  } catch (error) {
    console.error('Revoke feature access error:', error);
    res.status(500).json({ success: false, message: 'Failed to revoke access' });
  }
});

// GET /api/admin/features/:key/users - Get users with feature access
router.get('/:key/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { key } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const result = await getFeatureUsers(key, parseInt(page), parseInt(limit));
    res.json({ success: true, ...result });
  } catch (error) {
    console.error('Get feature users error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
});

// POST /api/admin/features/:key/beta/validate - Validate beta access code
router.post('/:key/beta/validate', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    const { accessCode } = req.body;
    const userId = req.user.id;
    
    const result = await useBetaAccessCode(userId, key, accessCode);
    res.json({ success: result.success, message: result.message, access: result.access });
  } catch (error) {
    console.error('Validate beta code error:', error);
    res.status(500).json({ success: false, message: 'Failed to validate access code' });
  }
});

// GET /api/features/:key/check - Public endpoint to check if current user has access
// This requires authentication (user must be logged in)
router.get('/check/:key', authenticateToken, async (req, res) => {
  try {
    const { key } = req.params;
    const userId = req.user.id;
    const hasAccess = await userHasFeatureAccess(userId, key);
    const flag = await getFeatureFlag(key);
    
    res.json({ 
      success: true, 
      key, 
      hasAccess,
      enabled: flag?.enabled || false,
      isActive: flag?.isActive || false
    });
  } catch (error) {
    console.error('Check user feature access error:', error);
    res.status(500).json({ success: false, message: 'Failed to check access' });
  }
});

// ============ PUBLIC ENDPOINT (for frontend to check features) ============

// GET /api/features/:key - Public endpoint to check if feature is enabled
// This is intentionally NOT protected by admin auth - it's for frontend usage
router.get('/public/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const enabled = await isFeatureEnabled(key);
    res.json({ success: true, key, enabled });
  } catch (error) {
    console.error('Check feature error:', error);
    res.status(500).json({ success: false, message: 'Failed to check feature' });
  }
});

export default router;