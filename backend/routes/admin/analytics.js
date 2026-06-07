import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// ============ TOP CONTENT ============

// GET /api/admin/analytics/top/songs - Top songs by views/shares
router.get('/top/songs', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 10, period = 'all', sortBy = 'viewsCount' } = req.query;
    const parsedLimit = Math.min(parseInt(limit) || 10, 50);
    
    let dateFilter = {};
    if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { createdAt: { gte: weekAgo } };
    } else if (period === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { createdAt: { gte: monthAgo } };
    }
    
    // Map sortBy to actual Post field names
    const sortField = sortBy === 'sharesCount' ? 'sharesCount' : 'viewsCount';
    
    const songs = await prisma.post.findMany({
      where: {
        type: 'song',
        ...dateFilter,
        status: 'published'
      },
      include: {
        creator: {
          select: {
            id: true,
            artistName: true,
            username: true,
            profilePicUrl: true
          }
        }
      },
      orderBy: {
        [sortField]: 'desc'
      },
      take: parsedLimit
    });
    
    res.json({
      success: true,
      data: songs.map(song => ({
        id: song.id,
        title: song.title,
        artist: song.creator?.artistName || song.creator?.username,
        views: song.viewsCount || 0,
        downloads: song.downloadsCount || 0,
        shares: song.sharesCount || 0,
        createdAt: song.createdAt
      })),
      period,
      sortBy
    });
  } catch (error) {
    console.error('Get top songs error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch top songs' });
  }
});

// GET /api/admin/analytics/top/videos - Top videos by views/shares
router.get('/top/videos', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { limit = 10, period = 'all', sortBy = 'viewsCount' } = req.query;
    const parsedLimit = Math.min(parseInt(limit) || 10, 50);
    
    let dateFilter = {};
    if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { createdAt: { gte: weekAgo } };
    } else if (period === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { createdAt: { gte: monthAgo } };
    }
    
    const sortField = sortBy === 'sharesCount' ? 'sharesCount' : 'viewsCount';
    
    const videos = await prisma.post.findMany({
      where: {
        type: 'video',
        ...dateFilter,
        status: 'published'
      },
      include: {
        creator: {
          select: {
            id: true,
            artistName: true,
            username: true,
            profilePicUrl: true
          }
        }
      },
      orderBy: {
        [sortField]: 'desc'
      },
      take: parsedLimit
    });
    
    res.json({
      success: true,
      data: videos.map(video => ({
        id: video.id,
        title: video.title,
        artist: video.creator?.artistName || video.creator?.username,
        views: video.viewsCount || 0,
        downloads: video.downloadsCount || 0,
        shares: video.sharesCount || 0,
        createdAt: video.createdAt
      })),
      period,
      sortBy
    });
  } catch (error) {
    console.error('Get top videos error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch top videos' });
  }
});

// GET /api/admin/analytics/top/categories - Top content categories
router.get('/top/categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { period = 'all' } = req.query;
    
    let dateFilter = {};
    if (period === 'week') {
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { createdAt: { gte: weekAgo } };
    } else if (period === 'month') {
      const monthAgo = new Date();
      monthAgo.setMonth(monthAgo.getMonth() - 1);
      dateFilter = { createdAt: { gte: monthAgo } };
    }
    
    // Aggregate by category
    const categories = ['music', 'comedy', 'dance', 'drama', 'educational', 'entertainment'];
    const categoryStats = await Promise.all(categories.map(async (category) => {
      const count = await prisma.post.count({
        where: {
          category,
          status: 'published',
          ...dateFilter
        }
      });
      
      const views = await prisma.post.aggregate({
        where: {
          category,
          status: 'published',
          ...dateFilter
        },
        _sum: { viewsCount: true }
      });
      
      return {
        name: category,
        count,
        totalViews: views._sum.viewsCount || 0
      };
    }));
    
    // Sort by count descending
    categoryStats.sort((a, b) => b.count - a.count);
    
    res.json({
      success: true,
      data: categoryStats,
      period
    });
  } catch (error) {
    console.error('Get top categories error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch top categories' });
  }
});

// ============ REVENUE TRENDS ============

// GET /api/admin/analytics/revenue/trends - Revenue trends over time
router.get('/revenue/trends', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { period = 'daily', days = 30 } = req.query;
    const parsedDays = parseInt(days) || 30;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parsedDays);
    startDate.setHours(0, 0, 0, 0);
    
    // Get daily stats from DailyStats table
    const dailyStats = await prisma.dailyStats.findMany({
      where: {
        date: { gte: startDate }
      },
      orderBy: { date: 'asc' }
    });
    
    // Get payment data for more detailed revenue info
    const payments = await prisma.payment.groupBy({
      by: ['status'],
      where: {
        createdAt: { gte: startDate },
        status: 'completed'
      },
      _sum: { amount: true },
      _count: true
    });
    
    // Get subscription revenue (Subscription uses startDate not createdAt)
    const subscriptions = await prisma.subscription.groupBy({
      by: ['status'],
      where: {
        startDate: { gte: startDate },
        status: 'active'
      },
      _sum: { price: true },
      _count: true
    });
    
    // Calculate totals
    const totalRevenue = payments.reduce((sum, p) => sum + (p._sum.amount || 0), 0);
    const totalSubscriptions = subscriptions.reduce((sum, s) => sum + (s._sum.price || 0), 0);
    const averageDailyRevenue = dailyStats.length > 0 
      ? dailyStats.reduce((sum, s) => sum + (s.newRevenue || 0), 0) / dailyStats.length 
      : 0;
    
    res.json({
      success: true,
      data: {
        dailyStats: dailyStats.map(s => ({
          date: s.date,
          newRevenue: s.newRevenue,
          totalRevenue: s.totalRevenue
        })),
        summary: {
          totalRevenue,
          totalSubscriptions,
          averageDailyRevenue,
          totalPayments: payments.reduce((sum, p) => sum + p._count, 0),
          totalSubscriptionsCount: subscriptions.reduce((sum, s) => sum + s._count, 0),
          period: `${parsedDays} days`
        }
      }
    });
  } catch (error) {
    console.error('Get revenue trends error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch revenue trends' });
  }
});

// ============ CREATOR GROWTH ============

// GET /api/admin/analytics/creators/growth - Creator registration trends
router.get('/creators/growth', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { period = 'daily', days = 30 } = req.query;
    const parsedDays = parseInt(days) || 30;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parsedDays);
    startDate.setHours(0, 0, 0, 0);
    
    // Get daily creator registrations from DailyStats table
    const dailyStats = await prisma.dailyStats.findMany({
      where: {
        date: { gte: startDate }
      },
      orderBy: { date: 'asc' }
    });
    
    // Get total creators count
    const totalCreators = await prisma.user.count({
      where: {
        userType: { in: ['zls_artist', 'independent_creator'] }
      }
    });
    
    // Get creator growth by month
    const monthlyGrowth = await prisma.$queryRaw`
      SELECT 
        DATE_TRUNC('month', "createdAt") as month,
        COUNT(*) as count
      FROM "User"
      WHERE "userType" IN ('zls_artist', 'independent_creator')
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY month DESC
      LIMIT 12
    `;
    
    // Get pending creator verifications
    const pendingVerifications = await prisma.user.count({
      where: {
        userType: { in: ['zls_artist', 'independent_creator'] },
        verificationStatus: 'pending'
      }
    });
    
    // Get approved vs rejected ratio
    const approvedCreators = await prisma.user.count({
      where: {
        userType: { in: ['zls_artist', 'independent_creator'] },
        verificationStatus: 'approved'
      }
    });
    
    const rejectedCreators = await prisma.user.count({
      where: {
        userType: { in: ['zls_artist', 'independent_creator'] },
        verificationStatus: 'rejected'
      }
    });
    
    res.json({
      success: true,
      data: {
        dailyStats: dailyStats.map(s => ({
          date: s.date,
          newRegistrations: s.newRegistrations,
          totalRegistrations: s.totalRegistrations
        })),
        summary: {
          totalCreators,
          pendingVerifications,
          approvedCreators,
          rejectedCreators,
          approvalRate: totalCreators > 0 ? (approvedCreators / totalCreators * 100).toFixed(1) : 0
        },
        monthlyGrowth
      }
    });
  } catch (error) {
    console.error('Get creator growth error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch creator growth' });
  }
});

// ============ DASHBOARD SUMMARY ============

// GET /api/admin/analytics/dashboard - Complete dashboard analytics
router.get('/dashboard', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const parsedDays = parseInt(days) || 7;
    
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parsedDays);
    startDate.setHours(0, 0, 0, 0);
    
    // Get all data in parallel
    const [
      dailyStats,
      topSongs,
      topVideos,
      revenueTrends,
      creatorGrowth,
      topCategories
    ] = await Promise.all([
      prisma.dailyStats.findMany({
        where: { date: { gte: startDate } },
        orderBy: { date: 'asc' }
      }),
      prisma.post.findMany({
        where: { type: 'song', status: 'published' },
        include: { creator: { select: { artistName: true, username: true } } },
        orderBy: { viewsCount: 'desc' },
        take: 5
      }),
      prisma.post.findMany({
        where: { type: 'video', status: 'published' },
        include: { creator: { select: { artistName: true, username: true } } },
        orderBy: { viewsCount: 'desc' },
        take: 5
      }),
      prisma.payment.groupBy({
        by: ['status'],
        where: { createdAt: { gte: startDate } },
        _sum: { amount: true }
      }),
      prisma.user.count({
        where: {
          userType: { in: ['zls_artist', 'independent_creator'] }
        }
      }),
      prisma.post.groupBy({
        by: ['category'],
        where: { status: 'published' },
        _count: true
      })
    ]);
    
    res.json({
      success: true,
      data: {
        dailyStats,
        topSongs: topSongs.map(s => ({
          id: s.id,
          title: s.title,
          artist: s.creator?.artistName || s.creator?.username,
          views: s.viewsCount || 0
        })),
        topVideos: topVideos.map(v => ({
          id: v.id,
          title: v.title,
          artist: v.creator?.artistName || v.creator?.username,
          views: v.viewsCount || 0
        })),
        revenue: {
          total: revenueTrends.reduce((sum, r) => sum + (r._sum.amount || 0), 0),
          byStatus: revenueTrends
        },
        totalCreators: creatorGrowth,
        categories: topCategories
      }
    });
  } catch (error) {
    console.error('Get dashboard analytics error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch dashboard analytics' });
  }
});

export default router;