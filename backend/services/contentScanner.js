import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Load prohibited words from database
let prohibitedWordsCache = [];
let lastCacheUpdate = 0;
const CACHE_TTL = 60000; // 1 minute

async function loadProhibitedWords() {
  if (Date.now() - lastCacheUpdate < CACHE_TTL && prohibitedWordsCache.length > 0) {
    return prohibitedWordsCache;
  }

  const rules = await prisma.contentScanRule.findMany({
    where: { type: 'word_blacklist', severity: 'reject' },
  });
  prohibitedWordsCache = rules.map((r) => r.value.toLowerCase());
  lastCacheUpdate = Date.now();
  return prohibitedWordsCache;
}

// Common spam patterns
const spamPatterns = [
  /(http|https):\/\/[^\s]+/g, // URLs without proper context
  /click here/i,
  /subscribe to my channel/i,
  /free money/i,
  /bitcoin|ethereum|crypto/i,
  /onlyfans|fanvue/i,
  /telegram|discord invite/i,
];

export async function scanContent(title, description, content, category) {
  const prohibitedWords = await loadProhibitedWords();
  const textToScan = `${title || ''} ${description || ''} ${content || ''}`.toLowerCase();

  // Check prohibited words
  for (const word of prohibitedWords) {
    if (textToScan.includes(word)) {
      return {
        passed: false,
        reason: `Content contains prohibited word/phrase: "${word}"`,
        score: 0,
      };
    }
  }

  // Check spam patterns
  let spamScore = 0;
  const spamReasons = [];
  for (const pattern of spamPatterns) {
    if (pattern.test(textToScan)) {
      spamScore += 25;
      spamReasons.push(pattern.toString());
    }
  }

  // Check politics (unless category is politics - which we don't have)
  const politicsKeywords = ['politic', 'election', 'vote', 'president', 'government', 'minister'];
  for (const keyword of politicsKeywords) {
    if (textToScan.includes(keyword)) {
      return {
        passed: false,
        reason: `Political content is not allowed on STEEZE. Only entertainment.`,
        score: 100,
      };
    }
  }

  // Check violence
  const violenceKeywords = ['kill', 'murder', 'death', 'blood', 'gore', 'violence', 'attack'];
  for (const keyword of violenceKeywords) {
    if (textToScan.includes(keyword)) {
      return {
        passed: false,
        reason: `Violent content is not allowed on STEEZE. Only entertainment.`,
        score: 100,
      };
    }
  }

  // Determine if content passes
  const passed = spamScore < 50;

  return {
    passed,
    reason: passed ? null : `Suspected spam: ${spamReasons.join(', ')}`,
    score: spamScore,
  };
}

export async function scanPostBeforeAdmin(postId, title, description, content, category) {
  const scanResult = await scanContent(title, description, content, category);

  await prisma.post.update({
    where: { id: postId },
    data: {
      autoScanStatus: scanResult.passed ? 'passed' : 'failed',
      autoScanReason: scanResult.reason,
      autoScanScore: scanResult.score,
    },
  });

  // If scan failed, notify creator
  if (!scanResult.passed) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { creator: true },
    });

    await prisma.verificationMessage.create({
      data: {
        creatorId: post.creatorId,
        message: `Your post "${title}" was automatically rejected because: ${scanResult.reason}. Please review our Content Guidelines and try again. This is a safe entertainment-only platform.`,
        isFromAdmin: true,
      },
    });
  }

  return scanResult;
}