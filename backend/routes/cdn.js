import express from 'express';
import { getCDNStatus, forceFailover, resetToPrimary } from '../services/cdn.js';
import { authenticateAny as authenticateToken } from '../middleware/auth.js';

const router = express.Router();

/**
 * GET /api/cdn/status
 * Public: Returns current CDN health and active endpoint.
 */
router.get('/status', async (req, res) => {
  try {
    const status = await getCDNStatus();
    res.json({ success: true, status });
  } catch (error) {
    console.error('[CDN Routes] Error fetching CDN status:', error.message);
    res.status(500).json({ success: false, error: 'Failed to get CDN status' });
  }
});

/**
 * POST /api/cdn/failover/test
 * Admin only: Force a CDN failover to a specified tier for testing.
 * Body: { targetCDN: 'secondary' | 'tertiary' }
 */
router.post('/failover/test', authenticateToken, async (req, res) => {
  try {
    // Only admins can force failover
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const { targetCDN } = req.body;

    if (!targetCDN || !['secondary', 'tertiary'].includes(targetCDN)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid targetCDN. Must be "secondary" or "tertiary".',
      });
    }

    const result = await forceFailover(targetCDN);

    res.json({
      success: true,
      message: `CDN failover initiated: switched from ${result.previous} to ${result.current}`,
      previous: result.previous,
      current: result.current,
    });
  } catch (error) {
    console.error('[CDN Routes] Failover test error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/cdn/failover/reset
 * Admin only: Reset CDN back to primary.
 */
router.post('/failover/reset', authenticateToken, async (req, res) => {
  try {
    if (req.user?.role !== 'admin' && req.user?.role !== 'super_admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }

    const result = await resetToPrimary();

    res.json({
      success: true,
      message: `CDN reset: switched from ${result.previous} to ${result.current}`,
      previous: result.previous,
      current: result.current,
    });
  } catch (error) {
    console.error('[CDN Routes] Reset error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;