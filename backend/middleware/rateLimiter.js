import rateLimit from 'express-rate-limit';
import slowDown from 'express-slow-down';

// General API rate limiter: 100 requests per minute
export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limiter for auth endpoints: 5 attempts per 15 minutes
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  skipSuccessfulRequests: true,
  message: { success: false, message: 'Too many login attempts. Please try again after 15 minutes.' },
});

// Slow down for suspicious activity
export const slowDownLimiter = slowDown({
  windowMs: 60 * 1000,
  delayAfter: 30,
  delayMs: (hits) => hits * 100,
});

// Password reset limiter: 3 requests per hour
export const passwordResetLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 3,
  message: { success: false, message: 'Too many password reset attempts. Please try again later.' },
});