import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get creator analytics (enhanced)
router.get("/analytics/creator", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = '30d' } = req.query;
    
    // Calculate date range
    const days = period === '7d' ? 7 : period === '90d' ? 90 : 30;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    
    // Get all posts by creator
    const posts = await prisma.post.findMany({
      where: { creatorId: userId },
      select: {
        id: true,
        title: true,
        type: true,
        viewsCount: true,
        likeCount: true,
        commentCount: true,
        sharesCount: true,
        watchTime: true,
        streamCount: true,
        earnings: true,
        price: true,
        isFree: true,
        createdAt: true,
      },
      orderBy: { viewsCount: 'desc' }
    });
    
    // Map field names for frontend compatibility
    const mappedPosts = posts.map(p => ({
      id: p.id,
      title: p.title,
      type: p.type,
      views: p.viewsCount || 0,
      likes: p.likeCount || 0,
      comments: p.commentCount || 0,
      shares: p.sharesCount || 0,
      watchTime: p.watchTime || 0,
      streamCount: p.streamCount || 0,
      earnings: p.earnings || 0,
      price: p.price || 0,
      isPaid: !p.isFree,
      createdAt: p.createdAt,
    }));
    
    // Calculate totals
    const totalViews = mappedPosts.reduce((sum, p) => sum + (p.views || 0), 0);
    const totalLikes = mappedPosts.reduce((sum, p) => sum + (p.likes || 0), 0);
    const totalComments = mappedPosts.reduce((sum, p) => sum + (p.comments || 0), 0);
    const totalShares = mappedPosts.reduce((sum, p) => sum + (p.shares || 0), 0);
    const totalWatchTime = mappedPosts.reduce((sum, p) => sum + (p.watchTime || 0), 0);
    const totalStreams = mappedPosts.reduce((sum, p) => sum + (p.streamCount || 0), 0);
    const totalEarnings = mappedPosts.reduce((sum, p) => sum + (p.earnings || 0), 0);
    
    // Engagement rate = (likes + comments + shares) / views
    const totalEngagement = totalLikes + totalComments + totalShares;
    const engagementRate = totalViews > 0 ? (totalEngagement / totalViews) * 100 : 0;
    
    // Top performing content
    const topContent = mappedPosts.slice(0, 5).map(p => ({
      ...p,
      engagementRate: p.views > 0 ? ((p.likes + p.comments + p.shares) / p.views) * 100 : 0
    }));
    
    // Best performing by revenue
    const topRevenue = [...mappedPosts].sort((a, b) => (b.earnings || 0) - (a.earnings || 0)).slice(0, 5);
    
    // Monthly earnings breakdown
    const monthlyEarnings = await prisma.payout.findMany({
      where: { creatorId: userId, status: 'completed' },
      select: { amount: true, createdAt: true },
      orderBy: { createdAt: 'desc' }
    });
    
    // Group payouts by month
    const monthlyMap = new Map();
    for (const payout of monthlyEarnings) {
      const monthKey = payout.createdAt.toISOString().slice(0, 7);
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + (payout.amount || 0));
    }
    const monthlyBreakdown = Array.from(monthlyMap.entries()).map(([month, amount]) => ({
      month,
      amount
    }));
    
    // Audience insights (simplified - would need user data collection)
    const audienceInsights = {
      ageRanges: [
        { range: '18-24', percentage: 0 },
        { range: '25-34', percentage: 0 },
        { range: '35-44', percentage: 0 },
        { range: '45+', percentage: 0 },
      ],
      topCountries: [],
      gender: { male: 0, female: 0, other: 0 }
    };
    
    // Traffic sources (simplified)
    const trafficSources = {
      direct: 45,
      search: 25,
      social: 20,
      external: 10
    };
    
    // Retention metrics
    const retention = {
      day1: 0,
      day7: 0,
      day30: 0
    };
    
    res.json({
      success: true,
      analytics: {
        summary: {
          totalViews,
          totalLikes,
          totalComments,
          totalShares,
          totalWatchTime: Math.floor(totalWatchTime / 60), // minutes
          totalStreams,
          totalEarnings,
          engagementRate: engagementRate.toFixed(1),
          totalPosts: mappedPosts.length
        },
        topContent,
        topRevenue,
        monthlyEarnings: monthlyBreakdown,
        audienceInsights,
        trafficSources,
        retention
      }
    });
  } catch (error) {
    console.error("Analytics error:", error);
    res.status(500).json({ error: "Failed to get analytics" });
  }
});

// Track watch time
router.post("/analytics/watch-time/:postId", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.params;
    const { seconds } = req.body;
    
    if (!seconds || seconds < 0) {
      return res.status(400).json({ error: "Invalid watch time" });
    }
    
    // Update post watch time
    await prisma.post.update({
      where: { id: postId },
      data: { watchTime: { increment: seconds } }
    });
    
    // Update stream count if applicable
    await prisma.post.update({
      where: { id: postId },
      data: { streamCount: { increment: 1 } }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error("Track watch time error:", error);
    res.status(500).json({ error: "Failed to track watch time" });
  }
});

// Track share
router.post("/analytics/share/:postId", authenticateToken, async (req, res) => {
  try {
    const { postId } = req.params;
    
    await prisma.post.update({
      where: { id: postId },
      data: { sharesCount: { increment: 1 } }
    });
    
    res.json({ success: true });
  } catch (error) {
    console.error("Track share error:", error);
    res.status(500).json({ error: "Failed to track share" });
  }
});

// Get earnings summary
router.get("/analytics/earnings", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Total earnings from posts
    const posts = await prisma.post.findMany({
      where: { creatorId: userId },
      select: { earnings: true }
    });
    
    const totalEarnings = posts.reduce((sum, p) => sum + (p.earnings || 0), 0);
    
    // Completed payouts
    const payouts = await prisma.payout.findMany({
      where: { creatorId: userId, status: 'completed' },
      select: { amount: true, processedAt: true }
    });
    
    const totalWithdrawn = payouts.reduce((sum, p) => sum + p.amount, 0);
    const availableBalance = totalEarnings - totalWithdrawn;
    
    res.json({
      success: true,
      earnings: {
        total: totalEarnings,
        withdrawn: totalWithdrawn,
        available: availableBalance,
        pending: 0
      }
    });
  } catch (error) {
    console.error("Earnings error:", error);
    res.status(500).json({ error: "Failed to get earnings" });
  }
});

// Export analytics as CSV
router.get("/analytics/export", authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const posts = await prisma.post.findMany({
      where: { creatorId: userId },
      select: {
        title: true,
        type: true,
        viewsCount: true,
        likeCount: true,
        commentCount: true,
        sharesCount: true,
        watchTime: true,
        streamCount: true,
        earnings: true,
        createdAt: true
      }
    });
    
    // Create CSV
    const headers = ['Title', 'Type', 'Views', 'Likes', 'Comments', 'Shares', 'Watch Time (min)', 'Streams', 'Earnings (R)', 'Created At'];
    const rows = posts.map(p => [
      p.title,
      p.type,
      p.viewsCount || 0,
      p.likeCount || 0,
      p.commentCount || 0,
      p.sharesCount || 0,
      Math.floor((p.watchTime || 0) / 60),
      p.streamCount || 0,
      p.earnings || 0,
      p.createdAt.toISOString()
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=analytics.csv');
    res.send(csvContent);
  } catch (error) {
    console.error("Export analytics error:", error);
    res.status(500).json({ error: "Failed to export analytics" });
  }
});

export default router;