import express from 'express';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';
import { body, validationResult } from 'express-validator';
import { loginJustVibes, getRemainingTime, validateSession, checkCooldown } from '../services/justVibes.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// AUDIT: Rate limiting map for signup attempts
const signupAttempts = new Map();

// AUDIT: Rate limit middleware (5 per hour per IP)
function signupRateLimiter(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const key = `signup_${ip}`;
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxAttempts = 5;
  
  const record = signupAttempts.get(key);
  
  if (record) {
    const windowStart = now - windowMs;
    const attemptsInWindow = record.filter(timestamp => timestamp > windowStart);
    
    if (attemptsInWindow.length >= maxAttempts) {
      return res.status(429).json({
        success: false,
        error: 'Too many signup attempts. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    attemptsInWindow.push(now);
    signupAttempts.set(key, attemptsInWindow);
  } else {
    signupAttempts.set(key, [now]);
  }
  
  // Clean up old entries periodically
  if (Math.random() < 0.01) {
    for (const [k, timestamps] of signupAttempts.entries()) {
      const validTimestamps = timestamps.filter(t => t > now - windowMs);
      if (validTimestamps.length === 0) {
        signupAttempts.delete(k);
      } else {
        signupAttempts.set(k, validTimestamps);
      }
    }
  }
  
  next();
}

// AUDIT: POST /api/just-vibes/signup - Register new Just VIBES user
router.post('/just-vibes/signup', signupRateLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(e => e.msg)
    });
  }
  
  const { email, password } = req.body;
  
  try {
    // Check if email already exists in JustVibesUser
    const existingJustVibes = await prisma.justVibesUser.findUnique({
      where: { email }
    });
    
    if (existingJustVibes) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered. Please use a different email or login.'
      });
    }
    
    // Check if email already exists in regular User (VIBER)
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });
    
    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'Email already registered as a VIBER. Please login to your account.'
      });
    }
    
    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    // Create Just VIBES user
    const justVibesUser = await prisma.justVibesUser.create({
      data: {
        email,
        password: hashedPassword,
        status: 'pending'
      }
    });
    
    // TODO: Send notification to admins (will be implemented in PART V.4)
    // For now, just log
    console.log(`[JUST VIBES] New signup pending approval: ${email} (ID: ${justVibesUser.id})`);
    
    res.status(201).json({
      success: true,
      message: 'Registration successful. Your account is pending admin approval. You will receive an email when approved.',
      data: {
        id: justVibesUser.id,
        email: justVibesUser.email,
        status: justVibesUser.status
      }
    });
  } catch (error) {
    console.error('Just VIBES signup error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create account. Please try again.'
    });
  }
});

// AUDIT: POST /api/just-vibes/check-email - Check if email is available
router.post('/just-vibes/check-email', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(e => e.msg)
    });
  }
  
  const { email } = req.body;
  
  try {
    const justVibesUser = await prisma.justVibesUser.findUnique({
      where: { email },
      select: { email: true, status: true }
    });
    
    const regularUser = await prisma.user.findUnique({
      where: { email },
      select: { email: true }
    });
    
    let available = true;
    let message = 'Email is available';
    
    if (justVibesUser) {
      available = false;
      if (justVibesUser.status === 'pending') {
        message = 'Email already registered and pending admin approval';
      } else if (justVibesUser.status === 'approved') {
        message = 'Email already registered as Just VIBES user';
      } else if (justVibesUser.status === 'rejected') {
        message = 'Email was previously rejected. Please contact support.';
      }
    } else if (regularUser) {
      available = false;
      message = 'Email already registered as a VIBER. Please login.';
    }
    
    res.json({
      success: true,
      available,
      message
    });
  } catch (error) {
    console.error('Check email error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check email availability'
    });
  }
});

// AUDIT: Login rate limiting map
const loginAttempts = new Map();

// AUDIT: Login rate limiter (5 per hour per IP)
function loginRateLimiter(req, res, next) {
  const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
  const key = `justvibes_login_${ip}`;
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxAttempts = 5;
  
  const record = loginAttempts.get(key);
  
  if (record) {
    const windowStart = now - windowMs;
    const attemptsInWindow = record.filter(timestamp => timestamp > windowStart);
    
    if (attemptsInWindow.length >= maxAttempts) {
      return res.status(429).json({
        success: false,
        error: 'Too many login attempts. Please try again later.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    attemptsInWindow.push(now);
    loginAttempts.set(key, attemptsInWindow);
  } else {
    loginAttempts.set(key, [now]);
  }
  
  // Clean up old entries periodically
  if (Math.random() < 0.01) {
    for (const [k, timestamps] of loginAttempts.entries()) {
      const validTimestamps = timestamps.filter(t => t > now - windowMs);
      if (validTimestamps.length === 0) {
        loginAttempts.delete(k);
      } else {
        loginAttempts.set(k, validTimestamps);
      }
    }
  }
  
  next();
}

// AUDIT: POST /api/just-vibes/login - Login Just VIBES user
router.post('/just-vibes/login', loginRateLimiter, [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(e => e.msg)
    });
  }
  
  const { email, password } = req.body;
  const ipAddress = req.ip || req.headers['x-forwarded-for'];
  const userAgent = req.headers['user-agent'];
  
  try {
    const result = await loginJustVibes(email, password, ipAddress, userAgent);
    
    res.json({
      success: true,
      message: 'Login successful',
      data: result
    });
  } catch (error) {
    console.error('Just VIBES login error:', error);
    res.status(401).json({
      success: false,
      error: error.message || 'Login failed'
    });
  }
});

// AUDIT: POST /api/just-vibes/resend-verification - Resend admin notification (placeholder)
router.post('/just-vibes/resend-verification', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(e => e.msg)
    });
  }
  
  const { email } = req.body;
  
  try {
    const justVibesUser = await prisma.justVibesUser.findUnique({
      where: { email }
    });
    
    if (!justVibesUser) {
      return res.status(404).json({
        success: false,
        error: 'No account found with this email'
      });
    }
    
    if (justVibesUser.status !== 'pending') {
      return res.status(400).json({
        success: false,
        error: `Account is already ${justVibesUser.status}. Please check your status.`
      });
    }
    
    // TODO: Send actual email notification to admins
    console.log(`[JUST VIBES] Resent admin notification for: ${email}`);
    
    res.json({
      success: true,
      message: 'Admin has been notified. Please check back later.'
    });
  } catch (error) {
    console.error('Resend verification error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to resend verification'
    });
  }
});

// GET /api/just-vibes/session/status - Check current session status
router.get('/just-vibes/session/status', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Check if user has an active session
    const validation = await validateSession(userId);
    
    if (validation.valid) {
      return res.json({
        valid: true,
        remainingMinutes: validation.remainingMinutes,
        remainingMs: validation.remainingMs,
        inCooldown: false
      });
    }
    
    // Check cooldown
    const cooldown = await checkCooldown(userId);
    if (cooldown.inCooldown) {
      return res.json({
        valid: false,
        remainingMinutes: 0,
        inCooldown: true,
        cooldownMinutes: cooldown.remainingMinutes,
        cooldownEndsAt: cooldown.cooldownEndsAt
      });
    }
    
    res.json({
      valid: false,
      remainingMinutes: 0,
      inCooldown: false,
      reason: validation.reason
    });
  } catch (error) {
    console.error('Session status error:', error);
    res.status(500).json({ error: 'Failed to check session status' });
  }
});

// POST /api/just-vibes/check-cooldown - Check cooldown status by email
router.post('/just-vibes/check-cooldown', [
  body('email').isEmail().normalizeEmail().withMessage('Valid email is required')
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      errors: errors.array().map(e => e.msg)
    });
  }

  const { email } = req.body;

  try {
    const user = await prisma.justVibesUser.findUnique({
      where: { email: email.toLowerCase() }
    });

    if (!user) {
      return res.json({
        inCooldown: false,
        message: 'User not found'
      });
    }

    const cooldown = await checkCooldown(user.id);
    
    res.json({
      inCooldown: cooldown.inCooldown,
      remainingMinutes: cooldown.remainingMinutes,
      cooldownEndsAt: cooldown.cooldownEndsAt
    });
  } catch (error) {
    console.error('Check cooldown error:', error);
    res.status(500).json({ error: 'Failed to check cooldown status' });
  }
});

export default router;
