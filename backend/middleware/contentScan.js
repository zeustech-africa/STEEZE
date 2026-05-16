const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Load prohibited words from database
async function loadProhibitedWords() {
  const rules = await prisma.contentScanRule.findMany({
    where: { type: 'word_blacklist', severity: 'reject' },
  });
  return rules.map(r => r.value.toLowerCase());
}

async function scanPostContent(title, description, mediaType) {
  const prohibitedWords = await loadProhibitedWords();
  const textToScan = `${title} ${description || ''}`.toLowerCase();
  
  for (const word of prohibitedWords) {
    if (textToScan.includes(word)) {
      return {
        passed: false,
        reason: `Content contains prohibited word/phrase: "${word}"`,
      };
    }
  }
  
  // Additional checks for violence/gore patterns
  const violencePatterns = ['kill', 'murder', 'death', 'blood', 'gore'];
  for (const pattern of violencePatterns) {
    if (textToScan.includes(pattern)) {
      return {
        passed: false,
        reason: `Content contains violence-related term: "${pattern}". STEEZE is for entertainment only.`,
      };
    }
  }
  
  // Politics check
  const politicsPatterns = ['politic', 'election', 'vote', 'president', 'government'];
  for (const pattern of politicsPatterns) {
    if (textToScan.includes(pattern)) {
      return {
        passed: false,
        reason: `Content contains political term: "${pattern}". STEEZE is for entertainment only.`,
      };
    }
  }
  
  return { passed: true, reason: null };
}

async function scanPostBeforeAdmin(postId, title, description, mediaType) {
  const scanResult = await scanPostContent(title, description, mediaType);
  
  await prisma.post.update({
    where: { id: postId },
    data: {
      autoScanStatus: scanResult.passed ? 'passed' : 'failed',
      autoScanReason: scanResult.reason,
    },
  });
  
  // If scan failed, create a message for the creator
  if (!scanResult.passed) {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      include: { creator: true },
    });
    
    await prisma.verificationMessage.create({
      data: {
        creatorId: post.creatorId,
        message: `Your post "${title}" was automatically rejected because: ${scanResult.reason}. Please review our Content Guidelines and try again.`,
        isFromAdmin: true,
      },
    });
  }
  
  return scanResult;
}

module.exports = { scanPostBeforeAdmin, scanPostContent };