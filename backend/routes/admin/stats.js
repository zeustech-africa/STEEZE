import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';
import nodemailer from 'nodemailer';

const router = express.Router();
const prisma = new PrismaClient();

// Helper: Get or create stats for a specific date
async function getOrCreateStats(date) {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  
  let stats = await prisma.dailyStats.findUnique({
    where: { date: startOfDay }
  });
  
  if (!stats) {
    stats = await prisma.dailyStats.create({
      data: { date: startOfDay }
    });
  }
  
  return stats;
}

// Helper: Update today's stats with real-time data
async function updateTodayStats() {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  // Get today's registrations from both tables
  const [todayRegular, todayApproved] = await Promise.all([
    prisma.user.count({ where: { createdAt: { gte: today, lt: tomorrow } } }),
    prisma.approvedUser.count({ where: { approvedAt: { gte: today, lt: tomorrow } } })
  ]);
  const todayRegistrations = todayRegular + todayApproved;
  
  // Get today's uploads
  const todayUploads = await prisma.post.count({
    where: {
      createdAt: { gte: today, lt: tomorrow }
    }
  });
  
  // Get today's revenue
  const todayPayments = await prisma.payment.aggregate({
    where: {
      createdAt: { gte: today, lt: tomorrow },
      status: 'completed'
    },
    _sum: { amount: true }
  });
  
  // Get total registrations from both tables
  const [regularUsers, approvedUsers] = await Promise.all([
    prisma.user.count(),
    prisma.approvedUser.count()
  ]);
  const totalRegistrations = regularUsers + approvedUsers;
  
  // Get total uploads
  const totalUploads = await prisma.post.count();
  
  // Get total revenue
  const totalPayments = await prisma.payment.aggregate({
    where: { status: 'completed' },
    _sum: { amount: true }
  });
  
  // Get active violations (users with active strikes or bans)
  const activeViolations = await prisma.userStrike.count({
    where: { status: 'active' }
  });
  
  await prisma.dailyStats.upsert({
    where: { date: today },
    update: {
      newRegistrations: todayRegistrations,
      totalRegistrations,
      newUploads: todayUploads,
      totalUploads,
      newRevenue: todayPayments._sum.amount || 0,
      totalRevenue: totalPayments._sum.amount || 0,
      activeViolations,
      updatedAt: new Date()
    },
    create: {
      date: today,
      newRegistrations: todayRegistrations,
      totalRegistrations,
      newUploads: todayUploads,
      totalUploads,
      newRevenue: todayPayments._sum.amount || 0,
      totalRevenue: totalPayments._sum.amount || 0,
      activeViolations
    }
  });
}

// Helper: Check email service health
async function checkEmailHealth() {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_SECURE === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      },
      connectionTimeout: 5000,
      greetingTimeout: 5000
    });
    
    await transporter.verify();
    return 'healthy';
  } catch (error) {
    console.error('Email health check failed:', error.message);
    return error.message.includes('ECONNREFUSED') ? 'down' : 'degraded';
  }
}

// Helper: Check notification service health
async function checkNotificationHealth() {
  try {
    // Check if notification service endpoints are responsive
    // For now, check if we can create a test notification
    const testNotification = await prisma.notification.create({
      data: {
        userId: 'test',
        type: 'health_check',
        title: 'Health Check',
        message: 'System health check',
        isRead: true
      }
    });
    
    // Clean up test notification
    await prisma.notification.delete({ where: { id: testNotification.id } });
    
    return 'healthy';
  } catch (error) {
    console.error('Notification health check failed:', error.message);
    return 'degraded';
  }
}

// GET /api/admin/stats/summary - Quick summary for dashboard widgets
router.get('/summary', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await updateTodayStats();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayStats = await prisma.dailyStats.findUnique({
      where: { date: today }
    });
    
    // Get pending counts
    // Get pending counts - from both user tables
    const [pendingVerificationsRegular, pendingApprovedVerifications] = await Promise.all([
      prisma.user.count({ where: { verificationStatus: 'pending' } }),
      prisma.approvedUser.count() // All approved users have been verified
    ]);
    const pendingVerifications = pendingVerificationsRegular;
    
    const pendingPosts = await prisma.post.count({
      where: { adminStatus: 'pending' }
    });
    
    const pendingReports = await prisma.report.count({
      where: { status: 'pending' }
    });
    
    // Get active sessions (approximate)
    const activeSessions = await prisma.session.count({
      where: {
        expiresAt: { gt: new Date() }
      }
    });
    
    // Get total users from both tables
    const [regularUsersTotal, approvedUsersTotal] = await Promise.all([
      prisma.user.count(),
      prisma.approvedUser.count()
    ]);
    const totalUsers = regularUsersTotal + approvedUsersTotal;
    
    // Get today's registrations from both tables
    const [todayRegularCount, todayApprovedCount] = await Promise.all([
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.approvedUser.count({ where: { approvedAt: { gte: today } } })
    ]);
    const totalRegistrationsToday = todayRegularCount + todayApprovedCount;
    
    // Get creator/vibe counts from both tables
    const [regularCreators, approvedCreators] = await Promise.all([
      prisma.user.count({ where: { userType: { in: ['zls_artist', 'independent_creator'] } } }),
      prisma.approvedUser.count({ where: { userType: { in: ['zls_artist', 'independent_creator'] } } })
    ]);
    const totalCreators = regularCreators + approvedCreators;
    
    const [regularVibes, approvedVibes] = await Promise.all([
      prisma.user.count({ where: { userType: 'vibe' } }),
      prisma.approvedUser.count({ where: { userType: 'vibe' } })
    ]);
    const totalVibes = regularVibes + approvedVibes;
    
    res.json({
      success: true,
      summary: {
        totalUsers,
        totalCreators,
        totalVibes,
        dailyRegistrations: totalRegistrationsToday,
        dailyUploads: todayStats?.newUploads || 0,
        dailyRevenue: todayStats?.newRevenue || 0,
        pendingVerifications,
        pendingPosts,
        pendingReports,
        activeViolations: todayStats?.activeViolations || 0,
        activeSessions
      }
    });
  } catch (error) {
    console.error('Get summary error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch summary' });
  }
});

// GET /api/admin/stats/daily - Get daily stats for date range
router.get('/daily', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { days = 30, from, to } = req.query;
    let startDate, endDate;
    
    if (from && to) {
      startDate = new Date(from);
      endDate = new Date(to);
    } else {
      endDate = new Date();
      startDate = new Date();
      startDate.setDate(startDate.getDate() - parseInt(days));
    }
    
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    const stats = await prisma.dailyStats.findMany({
      where: {
        date: { gte: startDate, lte: endDate }
      },
      orderBy: { date: 'asc' }
    });
    
    res.json({ success: true, stats, startDate, endDate });
  } catch (error) {
    console.error('Get daily stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch daily stats' });
  }
});

// GET /api/admin/stats/health - Get current service health status
router.get('/health', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const [emailHealth, notificationHealth] = await Promise.all([
      checkEmailHealth(),
      checkNotificationHealth()
    ]);
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    await prisma.dailyStats.upsert({
      where: { date: today },
      update: {
        emailHealth,
        notificationHealth,
        lastEmailCheck: new Date(),
        lastNotificationCheck: new Date()
      },
      create: {
        date: today,
        emailHealth,
        notificationHealth,
        lastEmailCheck: new Date(),
        lastNotificationCheck: new Date()
      }
    });
    
    res.json({
      success: true,
      health: {
        email: emailHealth,
        notification: notificationHealth,
        database: await prisma.$queryRaw`SELECT 1 as connected` ? 'healthy' : 'down',
        api: 'healthy',
        checkedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Get health error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch health status' });
  }
});

// POST /api/admin/stats/refresh - Force refresh today's stats
router.post('/refresh', authenticateToken, requireAdmin, async (req, res) => {
  try {
    await updateTodayStats();
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const stats = await prisma.dailyStats.findUnique({
      where: { date: today }
    });
    
    res.json({ success: true, stats });
  } catch (error) {
    console.error('Refresh stats error:', error);
    res.status(500).json({ success: false, message: 'Failed to refresh stats' });
  }
});

export default router;