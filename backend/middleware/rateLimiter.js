import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

// Force bypass during tests
if (process.env.NODE_ENV === 'test') {
  console.log('Rate limiting disabled for test environment');
}

// Helper to bypass rate limiting during tests
const shouldBypass = () =>
  process.env.NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMIT === 'true';

const noop = (req, res, next) => next();

// General API rate limiter: 100 requests per minute
const _apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const apiLimiter = (req, res, next) => {
  if (shouldBypass()) return noop(req, res, next);
  return _apiLimiter(req, res, next);
};

// Stricter limiter for auth endpoints: 5 attempts per 15 minutes
const _authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
});

export const authLimiter = (req, res, next) => {
  if (shouldBypass()) return noop(req, res, next);
  return _authLimiter(req, res, next);
};

// Slow down for suspicious activity
const _slowDownLimiter = slowDown({
  windowMs: 60 * 1000,
  delayAfter: 30,
  delayMs: (hits) => hits * 100,
});

export const slowDownLimiter = (req, res, next) => {
  if (shouldBypass()) return noop(req, res, next);
  return _slowDownLimiter(req, res, next);
};

// Password reset limiter: 3 requests per hour
const _passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Too many password reset attempts. Please try again later.' },
});

export const passwordResetLimiter = (req, res, next) => {
  if (shouldBypass()) return noop(req, res, next);
  return _passwordResetLimiter(req, res, next);
};

// AUDIT: Prevents abuse of recommendation endpoints
const rateLimitMap = new Map();

const _interactionRateLimiter = (req, res, next) => {
  const userId = req.user?.id || req.ip;
  const key = `interaction_${userId}`;
  const now = Date.now();
  const windowMs = 60000; // 1 minute
  const maxRequests = 30; // 30 interactions per minute
  
  const record = rateLimitMap.get(key);
  
  if (record) {
    const windowStart = now - windowMs;
    const requestsInWindow = record.filter(timestamp => timestamp > windowStart);
    
    if (requestsInWindow.length >= maxRequests) {
      console.warn(`Rate limit exceeded for user: ${userId}`);
      return res.status(429).json({ 
        error: 'Too many interactions. Please slow down.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    requestsInWindow.push(now);
    rateLimitMap.set(key, requestsInWindow);
  } else {
    rateLimitMap.set(key, [now]);
  }
  
  // Clean up old entries every 100 requests
  if (Math.random() < 0.01) {
    for (const [k, timestamps] of rateLimitMap.entries()) {
      const validTimestamps = timestamps.filter(t => t > now - windowMs);
      if (validTimestamps.length === 0) {
        rateLimitMap.delete(k);
      } else {
        rateLimitMap.set(k, validTimestamps);
      }
    }
  }
  
  next();
};

export const interactionRateLimiter = (req, res, next) => {
  if (shouldBypass()) return noop(req, res, next);
  return _interactionRateLimiter(req, res, next);
};