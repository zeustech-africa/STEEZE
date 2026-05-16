import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Track request patterns for suspicious behavior
const requestTracker = new Map();

export async function detectBot(req, res, next) {
  const ip = req.ip || req.connection.remoteAddress;
  const userAgent = req.headers['user-agent'];
  const now = Date.now();
  
  // Initialize or update tracker for this IP
  if (!requestTracker.has(ip)) {
    requestTracker.set(ip, {
      requests: [],
      firstSeen: now,
      lastSeen: now,
      suspiciousFlags: [],
    });
  }
  
  const tracker = requestTracker.get(ip);
  tracker.lastSeen = now;
  tracker.requests.push(now);
  
  // Clean old requests (older than 1 minute)
  tracker.requests = tracker.requests.filter(t => now - t < 60000);
  
  // Check for bot patterns
  const requestRate = tracker.requests.length;
  
  // Flag 1: Too many requests per minute (>60)
  if (requestRate > 60) {
    tracker.suspiciousFlags.push('HIGH_REQUEST_RATE');
  }
  
  // Flag 2: Missing user agent
  if (!userAgent || userAgent === '' || userAgent === 'node-fetch' || userAgent.includes('bot')) {
    tracker.suspiciousFlags.push('MISSING_OR_BOT_UA');
  }
  
  // Flag 3: No referer for POST requests (suspicious)
  if (req.method === 'POST' && !req.headers.referer) {
    tracker.suspiciousFlags.push('MISSING_REFERER');
  }
  
  // Flag 4: Rapid sequential requests to same endpoint
  const sameEndpoint = tracker.requests.filter(t => req.url === t.url).length;
  if (sameEndpoint > 10) {
    tracker.suspiciousFlags.push('RAPID_SAME_ENDPOINT');
  }
  
  // If suspicious, log and optionally block
  if (tracker.suspiciousFlags.length >= 2) {
    await prisma.securityEvent.create({
      data: {
        type: 'bot_detection',
        ip,
        userAgent: userAgent || 'unknown',
        details: { flags: tracker.suspiciousFlags, requestRate },
        severity: 'warning',
      },
    });
    
    // If high severity (>3 flags or >100 requests), block temporarily
    if (tracker.suspiciousFlags.length >= 3 || requestRate > 100) {
      return res.status(429).json({
        success: false,
        message: 'Suspicious activity detected. Please try again later.',
      });
    }
  }
  
  next();
}

// Clean up old entries every hour
setInterval(() => {
  const oneHourAgo = Date.now() - 3600000;
  for (const [ip, tracker] of requestTracker.entries()) {
    if (tracker.lastSeen < oneHourAgo) {
      requestTracker.delete(ip);
    }
  }
}, 3600000);
