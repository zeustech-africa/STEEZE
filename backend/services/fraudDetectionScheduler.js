import { PrismaClient } from '@prisma/client';
import {
  createFraudAlert,
  getFraudDashboardStats
} from './fraudDetectionService.js';

const prisma = new PrismaClient();

// Known VPN/Proxy IP ranges (simplified - can be expanded)
const VPN_IP_PATTERNS = [
  '103.152.', '104.16.', '104.22.', '104.244.', '107.154.',
  '108.162.', '131.0.', '141.101.', '162.158.', '172.64.',
  '172.65.', '172.66.', '172.67.', '173.245.', '188.114.',
  '188.172.', '191.96.', '192.0.', '192.64.', '192.68.',
  '192.99.', '193.47.', '194.50.', '195.181.', '195.211.',
  '196.52.', '197.234.', '198.41.', '199.27.', '205.251.'
];

// Detect if IP is likely a VPN/proxy
export function isLikelyVPN(ipAddress) {
  if (!ipAddress) return false;
  for (const pattern of VPN_IP_PATTERNS) {
    if (ipAddress.startsWith(pattern)) {
      return true;
    }
  }
  return false;
}

// Detect bot-like behavior
export async function detectBotBehavior(userId) {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  
  // Check rapid actions (posts, comments, likes in short time)
  const recentPosts = await prisma.post.count({
    where: {
      userId,
      createdAt: { gte: oneHourAgo }
    }
  });
  
  const recentComments = await prisma.comment.count({
    where: {
      userId,
      createdAt: { gte: oneHourAgo }
    }
  });
  
  const recentLikes = await prisma.like.count({
    where: {
      userId,
      createdAt: { gte: oneHourAgo }
    }
  });
  
  const totalActions = recentPosts + recentComments + recentLikes;
  
  // Bot detection: > 50 actions per hour is suspicious
  if (totalActions > 50) {
    await createFraudAlert(
      userId,
      'bot_activity',
      'high',
      85,
      { actionsPerHour: totalActions, posts: recentPosts, comments: recentComments, likes: recentLikes }
    );
    return true;
  }
  
  return false;
}

// Detect fake creator accounts
export async function detectFakeCreator(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      posts: {
        orderBy: { createdAt: 'desc' },
        take: 5
      }
    }
  });
  
  if (!user || (user.userType !== 'zls_artist' && user.userType !== 'independent_creator')) {
    return false;
  }
  
  let riskScore = 0;
  const reasons = [];
  
  // No profile picture
  if (!user.profilePicUrl) {
    riskScore += 25;
    reasons.push('No profile picture');
  }
  
  // No bio or artist name
  if (!user.bio || user.bio.length < 10) {
    riskScore += 20;
    reasons.push('Incomplete bio');
  }
  
  // No posts
  if (user.posts.length === 0) {
    riskScore += 30;
    reasons.push('No content uploaded');
  }
  
  // Suspicious username pattern (random characters)
  const suspiciousPattern = /^[a-z0-9]{8,}$/i;
  if (user.username && suspiciousPattern.test(user.username)) {
    riskScore += 15;
    reasons.push('Suspicious username pattern');
  }
  
  if (riskScore >= 50) {
    await createFraudAlert(
      userId,
      'fake_creator',
      riskScore >= 70 ? 'high' : 'medium',
      riskScore,
      { riskScore, reasons, userType: user.userType }
    );
    return true;
  }
  
  return false;
}

// Detect account farm (coordinated account creation)
export async function detectAccountFarm() {
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
  
  // Find IP addresses with multiple account creations in the last hour
  const accountsByIP = await prisma.user.groupBy({
    by: ['userAgent'],
    where: {
      createdAt: { gte: oneHourAgo }
    },
    _count: true
  });
  
  for (const entry of accountsByIP) {
    if (entry._count >= 5) {
      // Multiple accounts from same IP - possible account farm
      const users = await prisma.user.findMany({
        where: {
          userAgent: entry.userAgent,
          createdAt: { gte: oneHourAgo }
        },
        select: { id: true, email: true, username: true }
      });
      
      // Create alert for the most recent user
      if (users.length > 0) {
        await createFraudAlert(
          users[0].id,
          'account_farm',
          'high',
          90,
          { 
            ipAddress: entry.userAgent,
            accountCount: entry._count,
            accounts: users.map(u => ({ id: u.id, email: u.email }))
          }
        );
      }
    }
  }
}

// Run all fraud detection scans
export async function runFraudScan() {
  console.log('🔍 Starting fraud detection scan...');
  const results = {
    botDetections: 0,
    fakeCreators: 0,
    vpnDetections: 0,
    accountFarms: 0
  };
  
  try {
    // Get all active users
    const users = await prisma.user.findMany({
      where: { isBanned: false },
      select: { id: true, userType: true }
    });
    
    // Detect bot behavior
    for (const user of users) {
      const isBot = await detectBotBehavior(user.id);
      if (isBot) results.botDetections++;
      
      const isFake = await detectFakeCreator(user.id);
      if (isFake) results.fakeCreators++;
    }
    
    // Detect account farms
    await detectAccountFarm();
    
    console.log(`✅ Fraud scan complete:`, results);
    return results;
  } catch (error) {
    console.error('Fraud scan error:', error);
    return null;
  }
}

// Update risk scores for all users
export async function updateRiskScores() {
  console.log('📊 Updating risk scores...');
  
  const users = await prisma.user.findMany({
    select: { id: true }
  });
  
  for (const user of users) {
    // Get all fraud alerts for this user
    const alerts = await prisma.fraudAlert.findMany({
      where: {
        userId: user.id,
        status: { not: 'false_positive' }
      }
    });
    
    let totalScore = 0;
    for (const alert of alerts) {
      if (alert.status === 'resolved') {
        totalScore += Math.floor(alert.score * 0.5); // Half score for resolved
      } else if (alert.status === 'pending') {
        totalScore += alert.score;
      }
    }
    
    // Cap at 100
    totalScore = Math.min(totalScore, 100);
    
    await prisma.user.update({
      where: { id: user.id },
      data: { fraudRiskScore: totalScore }
    });
    
    // Flag high-risk users
    if (totalScore >= 70) {
      await createFraudAlert(
        user.id,
        'high_risk_user',
        'high',
        totalScore,
        { riskScore: totalScore, alertCount: alerts.length }
      );
    }
  }
  
  console.log('✅ Risk scores updated');
  return { usersProcessed: users.length };
}

// Scheduled scan (can be called via cron or manually)
export async function scheduledFraudScan() {
  console.log('🕐 Running scheduled fraud detection...');
  const scanResults = await runFraudScan();
  await updateRiskScores();
  return scanResults;
}