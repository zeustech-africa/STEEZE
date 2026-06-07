import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Spam keywords list (configurable via database)
const DEFAULT_SPAM_KEYWORDS = [
  'viagra', 'casino', 'lottery', 'winner', 'prize', 'bitcoin', 'crypto',
  'earn money', 'work from home', 'free money', 'click here', 'limited time'
];

const OFFENSIVE_WORDS = [
  'hate', 'stupid', 'idiot', 'moron', 'racist', 'sexist', 'fuck', 'shit'
];

// Run automation checks on new content
export async function checkNewContent(content, contentType, contentId, userId) {
  const results = [];
  
  // Get active automation rules
  const rules = await prisma.automationRule.findMany({
    where: { isActive: true },
    orderBy: { priority: 'desc' }
  });
  
  for (const rule of rules) {
    let shouldTrigger = false;
    let detectionDetails = {};
    
    switch (rule.triggerType) {
      case 'spam_detected':
        shouldTrigger = await detectSpam(content);
        detectionDetails = { spamScore: shouldTrigger ? 0.8 : 0.1 };
        break;
        
      case 'offensive_content':
        shouldTrigger = await detectOffensiveContent(content);
        detectionDetails = { offensiveScore: shouldTrigger ? 0.7 : 0.05 };
        break;
        
      case 'duplicate_upload':
        shouldTrigger = await detectDuplicateUpload(contentId, contentType, userId);
        detectionDetails = { duplicate: shouldTrigger };
        break;
        
      case 'high_risk_score':
        shouldTrigger = await checkHighRiskUser(userId);
        detectionDetails = { riskScore: shouldTrigger ? 85 : 20 };
        break;
        
      case 'repeat_offender':
        shouldTrigger = await checkRepeatOffender(userId);
        detectionDetails = { violationCount: shouldTrigger };
        break;
    }
    
    if (shouldTrigger) {
      const result = await executeAutomationAction(rule, contentId, contentType, userId, detectionDetails);
      results.push(result);
      
      // Create flagged content record
      await prisma.flaggedContent.create({
        data: {
          contentId,
          contentType,
          flagType: rule.triggerType,
          confidence: detectionDetails.spamScore || detectionDetails.offensiveScore || 0.7,
          createdAt: new Date()
        }
      });
    }
  }
  
  return results;
}

// Detect spam content
async function detectSpam(content) {
  const lowerContent = content.toLowerCase();
  for (const keyword of DEFAULT_SPAM_KEYWORDS) {
    if (lowerContent.includes(keyword)) {
      return true;
    }
  }
  return false;
}

// Detect offensive content
async function detectOffensiveContent(content) {
  const lowerContent = content.toLowerCase();
  for (const word of OFFENSIVE_WORDS) {
    if (lowerContent.includes(word)) {
      return true;
    }
  }
  return false;
}

// Detect duplicate uploads
async function detectDuplicateUpload(contentId, contentType, userId) {
  // Check if similar content exists from same user in last 24 hours
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);
  
  const existingContent = await prisma.post.findFirst({
    where: {
      userId,
      createdAt: { gte: oneDayAgo },
      id: { not: contentId }
    }
  });
  
  return !!existingContent;
}

// Check high-risk user based on anomaly score
async function checkHighRiskUser(userId) {
  const anomalyScore = await prisma.anomalyScore.findFirst({
    where: { userId },
    orderBy: { createdAt: 'desc' }
  });
  
  return anomalyScore && anomalyScore.score > 70;
}

// Check repeat offender
async function checkRepeatOffender(userId) {
  const violationCount = await prisma.userStrike.count({
    where: {
      userId,
      status: 'active'
    }
  });
  
  return violationCount >= 3;
}

// Execute automation action based on rule
async function executeAutomationAction(rule, contentId, contentType, userId, details) {
  const log = {
    ruleId: rule.id,
    ruleName: rule.name,
    triggerType: rule.triggerType,
    action: rule.action,
    targetType: contentType,
    targetId: contentId,
    details,
    status: 'success'
  };
  
  try {
    switch (rule.action) {
      case 'remove_post':
        await prisma.post.update({
          where: { id: contentId },
          data: { status: 'removed', isActive: false, removalReason: `Auto-removed by rule: ${rule.name}` }
        });
        break;
        
      case 'hide_comment':
        await prisma.comment.update({
          where: { id: contentId },
          data: { isHidden: true, hiddenReason: `Auto-hidden by rule: ${rule.name}` }
        });
        break;
        
      case 'flag_content':
        // Already handled by flaggedContent creation
        break;
        
      case 'suspend_account':
        if (userId) {
          await prisma.user.update({
            where: { id: userId },
            data: { isSuspended: true, suspendedUntil: new Date(Date.now() + 24 * 60 * 60 * 1000) }
          });
        }
        break;
        
      case 'escalate':
        // Create escalation record
        await prisma.auditLog.create({
          data: {
            adminId: 'automation',
            action: 'auto_escalate',
            targetType: contentType,
            targetId: contentId,
            details
          }
        });
        break;
        
      case 'send_notification':
        if (userId) {
          await prisma.notification.create({
            data: {
              userId,
              type: 'automation',
              title: 'Content Flagged by Automation',
              message: `Your content was flagged by our automated moderation system.`,
              isRead: false
            }
          });
        }
        break;
    }
    
    await prisma.automationLog.create({ data: log });
  } catch (error) {
    log.status = 'failed';
    log.errorMessage = error.message;
    await prisma.automationLog.create({ data: log });
  }
  
  return log;
}

// Get automation statistics
export async function getAutomationStats(days = 7) {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  const [logs, flagged, rules] = await Promise.all([
    prisma.automationLog.count({
      where: { createdAt: { gte: startDate } }
    }),
    prisma.flaggedContent.count({
      where: { createdAt: { gte: startDate }, resolved: false }
    }),
    prisma.automationRule.count({ where: { isActive: true } })
  ]);
  
  const actionsByType = await prisma.automationLog.groupBy({
    by: ['action'],
    where: { createdAt: { gte: startDate } },
    _count: true
  });
  
  return {
    totalActions: logs,
    pendingFlags: flagged,
    activeRules: rules,
    actionsByType: actionsByType.map(a => ({ action: a.action, count: a._count }))
  };
}