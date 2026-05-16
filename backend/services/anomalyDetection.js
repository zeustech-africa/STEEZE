import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Calculate anomaly score for a user (0-100)
export async function calculateUserAnomalyScore(userId) {
  const [flags, reports, spamScore, botScore] = await Promise.all([
    prisma.violation.count({
      where: { userId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
    }),
    prisma.report.count({
      where: { reportedId: userId, createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) } }
    }),
    getUserSpamScore(userId),
    getBotBehaviorScore(userId),
  ]);

  let score = 0;
  score += Math.min(flags * 10, 30);
  score += Math.min(reports * 5, 25);
  score += spamScore;
  score += botScore;

  score = Math.min(score, 100);

  const reasons = [];
  if (flags > 0) reasons.push(`${flags} violations in last 7 days`);
  if (reports > 0) reasons.push(`${reports} reports received`);
  if (spamScore > 20) reasons.push('High spam score');
  if (botScore > 20) reasons.push('Bot-like behavior detected');

  await prisma.anomalyScore.create({
    data: {
      targetType: 'user',
      targetId: userId,
      score,
      reasons,
    },
  });

  // Auto-flag if score > 70
  if (score > 70) {
    await createAutoModerationAction(userId, 'user', 'high_anomaly_score', score);
  }

  return score;
}

// Detect heated arguments in comments
export async function detectConflict(postId) {
  const comments = await prisma.comment.findMany({
    where: { postId },
    include: {
      replies: true,
      likes: true,
    },
  });

  const heatedKeywords = [
    'stupid', 'dumb', 'idiot', 'ignorant', 'trash',
    'terrible', 'worst', 'hate', 'awful', 'pathetic',
  ];

  const conflictScore = comments.reduce((score, comment) => {
    const text = (comment.text || '').toLowerCase();
    let commentScore = 0;
    for (const keyword of heatedKeywords) {
      if (text.includes(keyword)) commentScore += 10;
    }
    if (comment.replies && comment.replies.length > 10) commentScore += 20;
    if (comment.replies && comment.replies.some(r => {
      const replyText = (r.text || '').toLowerCase();
      return heatedKeywords.some(k => replyText.includes(k));
    })) commentScore += 15;
    return score + commentScore;
  }, 0);

  if (conflictScore > 50) {
    await prisma.moderationNote.create({
      data: {
        targetType: 'post',
        targetId: postId,
        note: `Potential conflict detected. Heated argument score: ${conflictScore}`,
        createdBy: 'system',
      },
    });
  }

  return conflictScore;
}

// Predictive ban recommendation
export async function getPredictiveBanRecommendations() {
  const highRiskUsers = await prisma.user.findMany({
    where: {
      userType: { in: ['zls_artist', 'independent_creator'] },
      violations: { some: { createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } }
    },
    include: {
      violations: { orderBy: { createdAt: 'desc' }, take: 5 },
    },
  });

  const recommendations = [];
  for (const user of highRiskUsers) {
    const recentViolations = user.violations.filter(
      v => v.createdAt > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );
    if (recentViolations.length >= 3) {
      recommendations.push({
        userId: user.id,
        username: user.username || user.artistName,
        reason: `${recentViolations.length} violations in last 7 days`,
        riskScore: Math.min(recentViolations.length * 20, 100),
      });
    }
  }

  return recommendations;
}

// Auto-flagging rules engine
export async function applyAutoModerationRules() {
  const rules = await prisma.moderationRule.findMany({ where: { isActive: true } });

  for (const rule of rules) {
    const { field, operator, value, timeWindow } = rule.condition;

    if (field === 'flags') {
      const windowHours = timeWindow || 24;
      const users = await prisma.user.findMany({
        where: {
          violations: {
            some: { createdAt: { gte: new Date(Date.now() - windowHours * 60 * 60 * 1000) } }
          }
        },
        include: {
          violations: {
            where: { createdAt: { gte: new Date(Date.now() - windowHours * 60 * 60 * 1000) } }
          }
        }
      });

      for (const user of users) {
        const flagCount = user.violations.length;
        let shouldApply = false;
        if (operator === '>' && flagCount > value) shouldApply = true;
        if (operator === '>=' && flagCount >= value) shouldApply = true;
        if (operator === '==' && flagCount === value) shouldApply = true;

        if (shouldApply) {
          await createAutoModerationAction(user.id, 'user', rule.action, flagCount, rule.duration);
        }
      }
    }
  }
}

async function createAutoModerationAction(userId, targetType, action, value, duration = 24) {
  const expiresAt = duration ? new Date(Date.now() + duration * 60 * 60 * 1000) : null;

  if (action === 'temp_mute') {
    await prisma.violation.create({
      data: {
        userId,
        type: 'auto_moderation',
        severity: 'medium',
        action: 'temp_mute',
        actionTakenBy: 'system',
        actionExpiresAt: expiresAt,
        note: `Auto-muted for ${duration} hours due to: ${value} flags`,
      },
    });
  } else if (action === 'shadow_ban') {
    await prisma.shadowBan.upsert({
      where: { userId },
      update: { reason: `Auto-shadow banned: ${value} flags`, expiresAt },
      create: {
        userId,
        reason: `Auto-shadow banned: ${value} flags`,
        expiresAt,
        createdBy: 'system',
      },
    });
  } else if (action === 'flag_for_review') {
    await prisma.moderationNote.create({
      data: {
        targetType,
        targetId: userId,
        note: `Auto-flagged for review: ${value} flags detected in time window`,
        createdBy: 'system',
      },
    });
  } else if (action === 'block') {
    await prisma.violation.create({
      data: {
        userId,
        type: 'auto_moderation',
        severity: 'high',
        action: 'ban',
        actionTakenBy: 'system',
        actionExpiresAt: expiresAt,
        note: `Auto-banned for ${duration} hours due to: ${value} flags`,
      },
    });
    await prisma.user.update({
      where: { id: userId },
      data: { isBanned: true },
    });
  }
}

async function getUserSpamScore(userId) {
  const recentComments = await prisma.comment.count({
    where: { userId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
  });

  const recentPosts = await prisma.post.count({
    where: { creatorId: userId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
  });

  let score = 0;
  if (recentComments > 50) score += 25;
  else if (recentComments > 30) score += 15;
  else if (recentComments > 20) score += 10;

  if (recentPosts > 20) score += 25;
  else if (recentPosts > 10) score += 15;
  else if (recentPosts > 5) score += 10;

  return Math.min(score, 35);
}

async function getBotBehaviorScore(userId) {
  const interactions = await prisma.postInteraction.count({
    where: { userId, createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } }
  });

  const [recentReports, mutedCount] = await Promise.all([
    prisma.report.count({ where: { reportedId: userId } }),
    prisma.mutedUser.count({ where: { mutedUserId: userId } }),
  ]);

  let score = 0;
  if (interactions > 200) score += 20;
  else if (interactions > 100) score += 10;

  if (recentReports > 3) score += 15;
  if (mutedCount > 5) score += 10;

  return Math.min(score, 35);
}

export default {
  calculateUserAnomalyScore,
  detectConflict,
  getPredictiveBanRecommendations,
  applyAutoModerationRules,
};