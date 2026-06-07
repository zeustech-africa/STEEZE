import express from 'express';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';
import {
  globalSearch,
  getRecentSearches,
  getSearchAnalytics,
  searchUsersOnly,
  searchContentOnly,
  searchReportsOnly,
  searchTicketsOnly,
  searchPaymentsOnly,
  searchVerificationsOnly,
  logSearch
} from '../../services/globalSearchService.js';

const router = express.Router();

// ============ GLOBAL SEARCH ============

// GET /api/admin/search - Global search across all entities
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { q, type = 'all', limit = 20 } = req.query;
    const userId = req.user.id;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }
    
    const results = await globalSearch(q.trim(), userId, type, parseInt(limit));
    res.json(results);
  } catch (error) {
    console.error("Global search error details:", error.message, error.stack);
    console.error('Global search error:', error);
    res.status(500).json({ success: false, message: 'Failed to perform search' });
  }
});

// ============ TYPE-SPECIFIC SEARCH ============

// GET /api/admin/search/users - Search users only
router.get('/users', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    const userId = req.user.id;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }
    
    const users = await searchUsersOnly(q.trim(), parseInt(limit));
    await logSearch(q.trim(), userId, users.length, 'users');
    
    res.json({ success: true, query: q, results: users, total: users.length });
  } catch (error) {
    console.error('Search users error:', error);
    res.status(500).json({ success: false, message: 'Failed to search users' });
  }
});

// GET /api/admin/search/content - Search content only
router.get('/content', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    const userId = req.user.id;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }
    
    const content = await searchContentOnly(q.trim(), parseInt(limit));
    await logSearch(q.trim(), userId, content.length, 'content');
    
    res.json({ success: true, query: q, results: content, total: content.length });
  } catch (error) {
    console.error('Search content error:', error);
    res.status(500).json({ success: false, message: 'Failed to search content' });
  }
});

// GET /api/admin/search/reports - Search reports only
router.get('/reports', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    const userId = req.user.id;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }
    
    const reports = await searchReportsOnly(q.trim(), parseInt(limit));
    await logSearch(q.trim(), userId, reports.length, 'reports');
    
    res.json({ success: true, query: q, results: reports, total: reports.length });
  } catch (error) {
    console.error('Search reports error:', error);
    res.status(500).json({ success: false, message: 'Failed to search reports' });
  }
});

// GET /api/admin/search/tickets - Search tickets only
router.get('/tickets', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    const userId = req.user.id;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }
    
    const tickets = await searchTicketsOnly(q.trim(), parseInt(limit));
    await logSearch(q.trim(), userId, tickets.length, 'tickets');
    
    res.json({ success: true, query: q, results: tickets, total: tickets.length });
  } catch (error) {
    console.error('Search tickets error:', error);
    res.status(500).json({ success: false, message: 'Failed to search tickets' });
  }
});

// GET /api/admin/search/payments - Search payments only
router.get('/payments', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    const userId = req.user.id;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }
    
    const payments = await searchPaymentsOnly(q.trim(), parseInt(limit));
    await logSearch(q.trim(), userId, payments.length, 'payments');
    
    res.json({ success: true, query: q, results: payments, total: payments.length });
  } catch (error) {
    console.error('Search payments error:', error);
    res.status(500).json({ success: false, message: 'Failed to search payments' });
  }
});

// GET /api/admin/search/verifications - Search verifications only
router.get('/verifications', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { q, limit = 20 } = req.query;
    const userId = req.user.id;
    
    if (!q || q.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Search query is required' });
    }
    
    const verifications = await searchVerificationsOnly(q.trim(), parseInt(limit));
    await logSearch(q.trim(), userId, verifications.length, 'verifications');
    
    res.json({ success: true, query: q, results: verifications, total: verifications.length });
  } catch (error) {
    console.error('Search verifications error:', error);
    res.status(500).json({ success: false, message: 'Failed to search verifications' });
  }
});

// ============ SEARCH ANALYTICS ============

// GET /api/admin/search/recent - Get recent searches for current admin
router.get('/recent', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const userId = req.user.id;
    const searches = await getRecentSearches(userId, parseInt(limit));
    res.json({ success: true, searches });
  } catch (error) {
    console.error('Get recent searches error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch recent searches' });
  }
});

// GET /api/admin/search/analytics - Get search analytics
router.get('/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { days = 30 } = req.query;
    const analytics = await getSearchAnalytics(parseInt(days));
    res.json({ success: true, analytics });
  } catch (error) {
    console.error('Get search analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch search analytics' });
  }
});

export default router;