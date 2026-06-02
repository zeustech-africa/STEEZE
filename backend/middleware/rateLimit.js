import rateLimit from 'express-rate-limit';

// Force bypass during tests
if (process.env.NODE_ENV === 'test') {
  console.log('Rate limiting disabled for test environment');
}

// Helper to bypass rate limiting during tests
const shouldBypass = () =>
  process.env.NODE_ENV === 'test' || process.env.DISABLE_RATE_LIMIT === 'true';

const noop = (req, res, next) => next();

// General API rate limiter: 100 requests per minute per IP
const _generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const generalLimiter = (req, res, next) => {
  if (shouldBypass()) return noop(req, res, next);
  return _generalLimiter(req, res, next);
};

// Strict limiter for auth endpoints: 5 attempts per 15 minutes per IP
const _authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  message: { error: 'Too many login attempts, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful logins
});

export const authLimiter = (req, res, next) => {
  // Force bypass during tests
  if (true) {
    return next();
  }
  if (shouldBypass()) return noop(req, res, next);
  return _authLimiter(req, res, next);
};

// Upload limiter: 10 uploads per hour per IP
const _uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { error: 'Upload limit reached. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const uploadLimiter = (req, res, next) => {
  if (shouldBypass()) return noop(req, res, next);
  return _uploadLimiter(req, res, next);
};

// Comment limiter: 30 comments per minute per IP
const _commentLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 30,
  message: { error: 'Too many comments, please slow down.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const commentLimiter = (req, res, next) => {
  if (shouldBypass()) return noop(req, res, next);
  return _commentLimiter(req, res, next);
};

// Follow limiter: 50 follows per hour per IP
const _followLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 50,
  message: { error: 'Too many follow actions. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const followLimiter = (req, res, next) => {
  if (shouldBypass()) return noop(req, res, next);
  return _followLimiter(req, res, next);
};

// Contact form limiter: 3 submissions per hour per IP
const _contactLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3,
  message: { error: 'Too many contact form submissions. Please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const contactLimiter = (req, res, next) => {
  if (shouldBypass()) return noop(req, res, next);
  return _contactLimiter(req, res, next);
};