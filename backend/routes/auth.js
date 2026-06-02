import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { sendNotificationEmail } from '../services/email.js';
import { authLimiter } from '../middleware/rateLimit.js';
import { requireCaptcha } from '../middleware/captcha.js';
import { trackFailedLogin, resetFailedAttempts } from '../services/failedLoginTracker.js';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'steeze-secret-key-2025';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

// ============================================================
// TOKEN GENERATION HELPERS
// ============================================================

const generateAccessToken = (userId, email, userType) => {
  return jwt.sign(
    { id: userId, email, userType },
    JWT_SECRET,
    { expiresIn: '15m' }
  );
};

const generateRefreshToken = async (userId) => {
  const token = uuidv4();
  await prisma.refreshToken.create({
    data: {
      userId,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    }
  });
  return token;
};

// ============================================================
// COOKIE HELPERS
// ============================================================

const setAuthCookies = (res, accessToken, refreshToken) => {
  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 15 * 60 * 1000 // 15 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

const clearAuthCookies = (res) => {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken');
};

// ============================================================
// LOGIN - HttpOnly cookie-based authentication
// ============================================================
router.post('/login', requireCaptcha(), async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email }
    });

    if (!user) {
      // Track failed login for attempt against non-existent email
      await trackFailedLogin(email, req.ip, req.headers['user-agent']).catch(() => {});
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      // Track failed login when password is invalid
      await trackFailedLogin(email, req.ip, req.headers['user-agent']).catch(() => {});
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Reset failed attempts counter on successful login
    await resetFailedAttempts(email).catch(() => {});

    // Check if user is banned or suspended
    if (user.isBanned || user.isSuspended) {
      return res.status(403).json({ error: 'Account is suspended or banned' });
    }

   // Create session record
    const sessionToken = uuidv4();
    const sessionId = uuidv4();
    await prisma.session.create({
      data: {
        id: sessionId,
        sid: sessionToken,
        data: JSON.stringify({ userAgent: req.headers['user-agent'] || 'unknown', ipAddress: req.ip || 
req.headers['x-forwarded-for'] || 'unknown' }),
        userId: user.id,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    });

    // Generate tokens
    const accessToken = generateAccessToken(user.id, user.email, user.userType);
    const refreshToken = await generateRefreshToken(user.id);

    // Set HttpOnly cookies
    setAuthCookies(res, accessToken, refreshToken);

    res.json({
      success: true,
      user: {
        id: user.id,
        fullName: user.artistName || user.email,
        email: user.email,
        userType: user.userType,
        username: user.artistName,
        artistName: user.artistName,
        profilePicUrl: user.profilePicUrl
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// ============================================================
// LOGOUT - Clear cookies and invalidate tokens
// ============================================================
router.post('/logout', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      // Revoke the refresh token
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken, revokedAt: null },
        data: { revokedAt: new Date() }
      });
    }

    clearAuthCookies(res);
    res.json({ success: true, message: 'Logged out' });
  } catch (error) {
    console.error('Logout error:', error);
    // Clear cookies even on error
    clearAuthCookies(res);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// ============================================================
// TOKEN REFRESH - Rotate access + refresh tokens
// ============================================================
router.post('/refresh', async (req, res) => {
  try {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      return res.status(401).json({ error: 'No refresh token' });
    }

    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        token: refreshToken,
        expiresAt: { gt: new Date() },
        revokedAt: null
      },
      include: { user: true }
    });

    if (!storedToken) {
      clearAuthCookies(res);
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Rotate: revoke old token, issue new one
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() }
    });

    const newAccessToken = generateAccessToken(
      storedToken.user.id,
      storedToken.user.email,
      storedToken.user.userType
    );
    const newRefreshToken = await generateRefreshToken(storedToken.user.id);

    setAuthCookies(res, newAccessToken, newRefreshToken);

    res.json({ success: true });
  } catch (error) {
    console.error('Refresh error:', error);
    clearAuthCookies(res);
    res.status(500).json({ error: 'Refresh failed' });
  }
});

// ============================================================
// LOGOUT ALL DEVICES - Invalidate all sessions + refresh tokens
// ============================================================
router.post('/logout-all', async (req, res) => {
  try {
    // Extract user from the access token cookie
    const accessToken = req.cookies?.accessToken;
    let userId = null;

    if (accessToken) {
      try {
        const decoded = jwt.verify(accessToken, JWT_SECRET);
        userId = decoded.id;
      } catch (e) {
        // Token expired or invalid - still clear cookies
      }
    }

    if (userId) {
      // Delete all sessions for this user
      await prisma.session.deleteMany({ where: { userId } });

      // Revoke all refresh tokens for this user
      await prisma.refreshToken.updateMany({
        where: { userId, revokedAt: null },
        data: { revokedAt: new Date() }
      });
    }

    clearAuthCookies(res);
    res.json({ success: true, message: 'Logged out from all devices' });
  } catch (error) {
    console.error('Logout all error:', error);
    clearAuthCookies(res);
    res.status(500).json({ error: 'Logout all failed' });
  }
});

// ============================================================
// GET CURRENT USER - Read from cookie (backward compat)
// ============================================================
router.get('/me', async (req, res) => {
  // Try cookie first, fall back to Authorization header
  let token = req.cookies?.accessToken;

  if (!token) {
    token = req.headers.authorization?.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await prisma.user.findUnique({
      where: { id: decoded.id }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      fullName: user.artistName || user.email,
      email: user.email,
      userType: user.userType,
      username: user.artistName,
      artistName: user.artistName,
      profilePicUrl: user.profilePicUrl,
      role: user.role,
      verificationStatus: user.verificationStatus,
      isBanned: user.isBanned,
      isSuspended: user.isSuspended
    });
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Token expired' });
    }
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ============================================================
// REGISTER - Keep existing registration flow
// ============================================================
router.post('/register', requireCaptcha(), async (req, res) => {
  const { email, password, username, fullName } = req.body;

  try {
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        artistName: username,
        role: 'vibe',
        verificationStatus: 'pending',
      }
    });

    // Issue tokens immediately
    const accessToken = generateAccessToken(user.id, user.email, user.userType);
    const refreshToken = await generateRefreshToken(user.id);

    setAuthCookies(res, accessToken, refreshToken);

    res.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        userType: user.userType,
        username: user.artistName
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================================
// FORGOT PASSWORD
// ============================================================
router.post('/forgot-password', authLimiter, requireCaptcha(), async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.json({ success: true, message: 'If an account exists, a reset link has been sent' });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpires: resetExpires,
      },
    });

    const resetLink = `${APP_URL}/reset-password?token=${resetToken}`;

    await sendNotificationEmail(email, 'Reset Your STEEZE Password', `
      <h2 style="color:#FFFFFF; font-size:22px; margin:0 0 12px;">Password Reset Request</h2>
      <p style="color:#AAAAAA; font-size:14px; margin:0 0 24px; line-height:1.5;">
        We received a request to reset your password. Click the button below to set a new password.
      </p>
      <div style="text-align:center; margin-bottom:8px;">
        <a href="${resetLink}" style="display:inline-block; padding:14px 40px; background-color:#FFD700; color:#000000; text-decoration:none; border-radius:30px; font-weight:bold; font-size:16px;">Reset Password</a>
      </div>
      <p style="color:#666666; font-size:12px; margin:20px 0 0;">
        Or copy and paste this link:<br>
        <span style="color:#FFD700;">${resetLink}</span>
      </p>
      <p style="color:#555555; font-size:11px; margin:16px 0 0;">
        This link expires in 24 hours. If you did not request this, you can safely ignore this email.
      </p>
    `, user.id);

    return res.json({ success: true, message: 'If an account exists, a reset link has been sent' });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================================
// RESET PASSWORD
// ============================================================
router.post('/reset-password', async (req, res) => {
  const { token, password, passwordConfirm } = req.body;

  if (!token || !password) {
    return res.status(400).json({ success: false, message: 'Token and new password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
  }

  if (password !== passwordConfirm) {
    return res.status(400).json({ success: false, message: 'Passwords do not match' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash: hashedPassword,
        resetToken: null,
        resetTokenExpires: null,
      },
    });

    return res.json({ success: true, message: 'Password has been reset successfully' });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================================
// VERIFY RESET TOKEN
// ============================================================
router.get('/verify-reset-token', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Token is required' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired reset token' });
    }

    return res.json({ success: true, message: 'Token is valid' });
  } catch (error) {
    console.error('Verify reset token error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================================
// RESEND VERIFICATION
// ============================================================
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.json({ success: true, message: 'If an account exists, a verification email has been sent' });
    }

    if (user.isVerified) {
      return res.json({ success: true, message: 'Email is already verified' });
    }

    const verifyToken = crypto.randomBytes(32).toString('hex');
    const verifyExpires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifyToken: verifyToken,
        emailVerifyExpires: verifyExpires,
      },
    });

    const verifyLink = `${APP_URL}/verify-email?token=${verifyToken}`;

    await sendNotificationEmail(email, 'Verify Your STEEZE Email', `
      <h2 style="color:#FFFFFF; font-size:22px; margin:0 0 12px;">Verify Your Email Address</h2>
      <p style="color:#AAAAAA; font-size:14px; margin:0 0 24px; line-height:1.5;">
        Welcome to STEEZE! Please verify your email address by clicking the button below.
      </p>
      <div style="text-align:center; margin-bottom:8px;">
        <a href="${verifyLink}" style="display:inline-block; padding:14px 40px; background-color:#FFD700; color:#000000; text-decoration:none; border-radius:30px; font-weight:bold; font-size:16px;">Verify Email</a>
      </div>
      <p style="color:#666666; font-size:12px; margin:20px 0 0;">
        Or copy and paste this link:<br>
        <span style="color:#FFD700;">${verifyLink}</span>
      </p>
      <p style="color:#555555; font-size:11px; margin:16px 0 0;">
        This link expires in 24 hours. If you did not create this account, you can safely ignore this email.
      </p>
    `, user.id);

    return res.json({ success: true, message: 'Verification email sent' });
  } catch (error) {
    console.error('Resend verification error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

// ============================================================
// VERIFY EMAIL
// ============================================================
router.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ success: false, message: 'Token is required' });
  }

  try {
    const user = await prisma.user.findFirst({
      where: {
        emailVerifyToken: token,
        emailVerifyExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired verification token' });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        emailVerifyToken: null,
        emailVerifyExpires: null,
      },
    });

    return res.json({ success: true, message: 'Email verified successfully' });
  } catch (error) {
    console.error('Verify email error:', error);
    return res.status(500).json({ success: false, message: 'Server error' });
  }
});

export default router;
