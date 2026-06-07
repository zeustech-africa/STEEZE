import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Default settings
const DEFAULT_SETTINGS = {
  spamEnabled: 'auto',
  adultEnabled: 'flag',
  violenceEnabled: 'flag',
  hateSpeechEnabled: 'flag',
  spamThreshold: 70,
  adultThreshold: 80,
  violenceThreshold: 85,
  hateSpeechThreshold: 85,
  humanReviewThreshold: 50,
  requireHumanReview: true
};

// Spam keywords
const DEFAULT_SPAM_KEYWORDS = [
  'viagra', 'casino', 'lottery', 'winner', 'prize', 'bitcoin', 'crypto',
  'earn money', 'work from home', 'free money', 'click here', 'limited time',
  'buy followers', 'buy views', 'cheap followers'
];

// Hate speech patterns
const HATE_SPEECH_PATTERNS = [
  'hate', 'racist', 'sexist', 'homophobic', 'transphobic', 'supremacist'
];

// Adult content patterns
const ADULT_PATTERNS = [
  'porn', 'xxx', 'adult content', 'nude', 'explicit'
];

// Violence patterns
const VIOLENCE_PATTERNS = [
  'kill', 'murder', 'attack', 'violence', 'weapon', 'shoot', 'bomb'
];

// Get AI moderation settings
export async function getAISettings() {
  let settings = await prisma.aIModerationSettings.findFirst();
  
  if (!settings) {
    settings = await prisma.aIModerationSettings.create({
      data: DEFAULT_SETTINGS
    });
  }
  
  return settings;
}

// Update AI moderation settings
export async function updateAISettings(updates, updatedBy) {
  const settings = await getAISettings();
  
  const updated = await prisma.aIModerationSettings.update({
    where: { id: settings.id },
    data: {
      ...updates,
      updatedBy,
      updatedAt: new Date()
    }
  });
  
  return updated;
}

// Detect content type
export function detectContentType(content) {
  const lowerContent = content.toLowerCase();
  const detections = [];
  
  // Spam detection
  for (const keyword of DEFAULT_SPAM_KEYWORDS) {
    if (lowerContent.includes(keyword)) {
      detections.push({ type: 'spam', confidence: 85 });
      break;
    }
  }
  
  // Hate speech detection
  for (const pattern of HATE_SPEECH_PATTERNS) {
    if (lowerContent.includes(pattern)) {
      detections.push({ type: 'hate_speech', confidence: 80 });
      break;
    }
  }
  
  // Adult content detection
  for (const pattern of ADULT_PATTERNS) {
    if (lowerContent.includes(pattern)) {
      detections.push({ type: 'adult', confidence: 75 });
      break;
    }
  }
  
  // Violence detection
  for (const pattern of VIOLENCE_PATTERNS) {
    if (lowerContent.includes(pattern)) {
      detections.push({ type: 'violence', confidence: 70 });
      break;
    }
  }
  
  if (detections.length === 0) {
    detections.push({ type: 'safe', confidence: 10 });
  }
  
  return detections;
}

// Get action based on settings and detection
export function getAction(detection, settings) {
  const { type, confidence } = detection;
  
  // Determine which setting to use
  let enabled, threshold;
  switch (type) {
    case 'spam':
      enabled = settings.spamEnabled;
      threshold = settings.spamThreshold;
      break;
    case 'adult':
      enabled = settings.adultEnabled;
      threshold = settings.adultThreshold;
      break;
    case 'violence':
      enabled = settings.violenceEnabled;
      threshold = settings.violenceThreshold;
      break;
    case 'hate_speech':
      enabled = settings.hateSpeechEnabled;
      threshold = settings.hateSpeechThreshold;
      break;
    default:
      return { action: 'allowed', actionTaken: 'none' };
  }
  
  // If detection is disabled
  if (enabled === 'off') {
    return { action: 'allowed', actionTaken: 'none' };
  }
  
  // Check confidence against threshold
  if (confidence < threshold) {
    // Below threshold: flag for review if confidence > humanReviewThreshold
    if (confidence >= settings.humanReviewThreshold) {
      return { action: 'flagged', actionTaken: 'flag' };
    }
    return { action: 'allowed', actionTaken: 'none' };
  }
  
  // Above threshold: take action based on setting
  if (enabled === 'auto') {
    switch (type) {
      case 'spam':
        return { action: 'blocked', actionTaken: 'auto' };
      case 'adult':
        return { action: 'hidden', actionTaken: 'auto' };
      case 'violence':
      case 'hate_speech':
        return { action: 'blocked', actionTaken: 'auto' };
      default:
        return { action: 'flagged', actionTaken: 'flag' };
    }
  }
  
  // Flag only mode
  return { action: 'flagged', actionTaken: 'flag' };
}

// Moderate content with AI
export async function moderateContent(contentId, contentType, userId, content) {
  const settings = await getAISettings();
  const detections = detectContentType(content);
  
  const results = [];
  
  for (const detection of detections) {
    const { action, actionTaken } = getAction(detection, settings);
    
    // Create log entry
    const log = await prisma.aIModerationLog.create({
      data: {
        contentId,
        contentType,
        userId,
        detectedType: detection.type,
        confidence: detection.confidence,
        action,
        actionTaken,
        reviewedByHuman: false
      }
    });
    
    results.push({ detection, action, actionTaken, logId: log.id });
    
    // If action is block or hide, update the content
    if (action === 'blocked') {
      await prisma.post.updateMany({
        where: { id: contentId },
        data: { 
          status: 'blocked',
          isActive: false,
          moderationReason: `AI detected: ${detection.type}`
        }
      });
    } else if (action === 'hidden') {
      await prisma.post.updateMany({
        where: { id: contentId },
        data: { 
          isHidden: true,
          moderationReason: `AI flagged: ${detection.type}`
        }
      });
    }
  }
  
  return results;
}

// Get moderation statistics
export async function getModerationStats(days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const [total, byType, byAction, pendingReview] = await Promise.all([
    prisma.aIModerationLog.count({
      where: { createdAt: { gte: startDate } }
    }),
    prisma.aIModerationLog.groupBy({
      by: ['detectedType'],
      where: { createdAt: { gte: startDate } },
      _count: true
    }),
    prisma.aIModerationLog.groupBy({
      by: ['action'],
      where: { createdAt: { gte: startDate } },
      _count: true
    }),
    prisma.aIModerationLog.count({
      where: {
        action: 'flagged',
        reviewedByHuman: false,
        createdAt: { gte: startDate }
      }
    })
  ]);
  
  const settings = await getAISettings();
  
  return {
    total,
    byType,
    byAction,
    pendingReview,
    settings: {
      spamEnabled: settings.spamEnabled,
      adultEnabled: settings.adultEnabled,
      violenceEnabled: settings.violenceEnabled,
      hateSpeechEnabled: settings.hateSpeechEnabled,
      spamThreshold: settings.spamThreshold,
      adultThreshold: settings.adultThreshold,
      violenceThreshold: settings.violenceThreshold,
      hateSpeechThreshold: settings.hateSpeechThreshold
    },
    period: `${days} days`
  };
}

// ============ AI MODERATION LOGS & ANALYTICS (FUTURE 7B) ============

// Get paginated logs with advanced filters
export async function getModerationLogs(filters = {}, page = 1, limit = 50) {
  const where = {};
  
  if (filters.detectedType) where.detectedType = filters.detectedType;
  if (filters.action) where.action = filters.action;
  if (filters.reviewedByHuman !== undefined) where.reviewedByHuman = filters.reviewedByHuman === 'true';
  if (filters.userId) where.userId = filters.userId;
  if (filters.contentId) where.contentId = filters.contentId;
  if (filters.source) where.source = filters.source;
  
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
    if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
  }
  
  const skip = (page - 1) * limit;
  
  const [logs, total] = await Promise.all([
    prisma.aIModerationLog.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, email: true, username: true, artistName: true } }
      }
    }),
    prisma.aIModerationLog.count({ where })
  ]);
  
  return { logs, total, page, limit };
}

// Get single log with full details
export async function getModerationLogById(id) {
  const log = await prisma.aIModerationLog.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, username: true, artistName: true } }
    }
  });
  return log;
}

// Review flagged content and override AI decision
export async function reviewModerationLog(logId, decision, note, reviewerId) {
  const startTime = Date.now();
  
  const log = await prisma.aIModerationLog.findUnique({
    where: { id: logId }
  });
  
  if (!log) {
    throw new Error('Log not found');
  }
  
  const reviewTime = Math.round((Date.now() - startTime) / 1000);
  
  const updatedLog = await prisma.aIModerationLog.update({
    where: { id: logId },
    data: {
      reviewedByHuman: true,
      humanReviewerId: reviewerId,
      humanDecision: decision,
      humanNote: note,
      reviewTime,
      action: decision === 'allow' ? 'allowed' : decision === 'block' ? 'blocked' : 'hidden'
    }
  });
  
  // Update the actual content based on decision
  if (log.contentType === 'post' && log.contentId) {
    if (decision === 'allow') {
      await prisma.post.update({
        where: { id: log.contentId },
        data: { 
          status: 'published', 
          isActive: true, 
          isHidden: false, 
          moderationReason: null,
          moderatedBy: reviewerId,
          moderatedAt: new Date()
        }
      });
    } else if (decision === 'block') {
      await prisma.post.update({
        where: { id: log.contentId },
        data: { 
          status: 'blocked', 
          isActive: false, 
          moderationReason: note || 'Blocked by admin review',
          moderatedBy: reviewerId,
          moderatedAt: new Date()
        }
      });
    } else if (decision === 'hide') {
      await prisma.post.update({
        where: { id: log.contentId },
        data: { 
          isHidden: true, 
          moderationReason: note || 'Hidden by admin review',
          moderatedBy: reviewerId,
          moderatedAt: new Date()
        }
      });
    }
  }
  
  return updatedLog;
}

// Get detailed analytics for AI moderation
export async function getDetailedModerationStats(days = 30) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  startDate.setHours(0, 0, 0, 0);
  
  // Daily trend data
  const dailyTrends = await prisma.$queryRaw`
    SELECT 
      DATE("createdAt") as date,
      COUNT(*) as total,
      SUM(CASE WHEN "action" = 'blocked' THEN 1 ELSE 0 END) as blocked,
      SUM(CASE WHEN "action" = 'flagged' THEN 1 ELSE 0 END) as flagged,
      SUM(CASE WHEN "action" = 'allowed' THEN 1 ELSE 0 END) as allowed
    FROM "AIModerationLog"
    WHERE "createdAt" >= ${startDate}
    GROUP BY DATE("createdAt")
    ORDER BY date ASC
  `;
  
  // Performance metrics
  const performance = await prisma.aIModerationLog.aggregate({
    where: { createdAt: { gte: startDate } },
    _avg: { confidence: true, reviewTime: true },
    _count: true
  });
  
  // Human review stats
  const humanReview = await prisma.aIModerationLog.aggregate({
    where: {
      createdAt: { gte: startDate },
      reviewedByHuman: true
    },
    _count: true
  });
  
  // Accuracy (where human decision matched AI action)
  const accurateDecisions = await prisma.aIModerationLog.count({
    where: {
      createdAt: { gte: startDate },
      reviewedByHuman: true,
      OR: [
        { action: 'blocked', humanDecision: 'block' },
        { action: 'flagged', humanDecision: 'block' },
        { action: 'allowed', humanDecision: 'allow' }
      ]
    }
  });
  
  const totalReviewed = humanReview._count || 1;
  const accuracy = Math.round((accurateDecisions / totalReviewed) * 100);
  
  // Response time stats
  const avgReviewTime = performance._avg.reviewTime || 0;
  const avgConfidence = performance._avg.confidence || 0;
  
  return {
    period: `${days} days`,
    totalModerations: performance._count,
    averageConfidence: Math.round(avgConfidence),
    accuracy: `${accuracy}%`,
    averageReviewTimeSeconds: Math.round(avgReviewTime),
    pendingReview: await prisma.aIModerationLog.count({
      where: { action: 'flagged', reviewedByHuman: false }
    }),
    humanReviewRate: `${Math.round((humanReview._count / (performance._count || 1)) * 100)}%`,
    dailyTrends,
    breakdown: {
      byType: await prisma.aIModerationLog.groupBy({
        by: ['detectedType'],
        where: { createdAt: { gte: startDate } },
        _count: true
      }),
      byAction: await prisma.aIModerationLog.groupBy({
        by: ['action'],
        where: { createdAt: { gte: startDate } },
        _count: true
      })
    }
  };
}

// Export logs to CSV format
export async function exportModerationLogs(filters = {}) {
  const { logs } = await getModerationLogs(filters, 1, 10000);
  
  const csvRows = [
    ['ID', 'Date', 'User ID', 'Content Type', 'Content ID', 'Detected Type', 'Confidence', 'Action', 'Reviewed', 'Human Decision', 'Review Time (s)']
  ];
  
  for (const log of logs) {
    csvRows.push([
      log.id,
      log.createdAt.toISOString(),
      log.userId,
      log.contentType,
      log.contentId,
      log.detectedType,
      log.confidence.toString(),
      log.action,
      log.reviewedByHuman ? 'Yes' : 'No',
      log.humanDecision || '',
      log.reviewTime?.toString() || ''
    ]);
  }
  
  return csvRows.map(row => row.join(',')).join('\n');
}
