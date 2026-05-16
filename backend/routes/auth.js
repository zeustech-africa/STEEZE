import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { sendNotificationEmail } from '../services/email.js';

const router = express.Router();
const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'steeze_super_secret_key';
const APP_URL = process.env.APP_URL || 'http://localhost:3000';

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  
  try {
    const user = await prisma.user.findUnique({
      where: { email }
    });
    
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
    
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

router.post('/register', async (req, res) => {
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
    
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    
    res.json({ success: true, token, user: { id: user.id, email: user.email, role: user.role } });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// POST /api/auth/forgot-password — send reset email
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    // Always return success to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'If an account exists, a reset link has been sent' });
    }

    // Generate reset token (24hr expiry)
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

// POST /api/auth/reset-password — verify token and set new password
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

// GET /api/auth/verify-reset-token — check if token is valid
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

// POST /api/auth/resend-verification — resend email verification link
router.post('/resend-verification', async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  try {
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      // Don't reveal whether user exists
      return res.json({ success: true, message: 'If an account exists, a verification email has been sent' });
    }

    if (user.isVerified) {
      return res.json({ success: true, message: 'Email is already verified' });
    }

    // Generate new verification token (24hr expiry)
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

// GET /api/auth/verify-email — verify email with token
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
