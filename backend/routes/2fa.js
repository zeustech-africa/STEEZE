import express from 'express';
import { PrismaClient } from '@prisma/client';
import { generate2FASecret, generateQRCode, verify2FAToken } from '../services/2fa.js';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';

const router = express.Router();
const prisma = new PrismaClient();

// Enable 2FA
router.post('/enable', async (req, res) => {
  try {
    const secret = generate2FASecret(req.user.email);
    const qrCode = await generateQRCode(secret);

    // Generate backup codes (10 codes)
    const plainCodes = [];
    const hashedCodes = [];
    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(6).toString('hex').toUpperCase().slice(0, 10);
      plainCodes.push(code);
      hashedCodes.push(await bcrypt.hash(code, 10));
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: {
        twoFactorSecret: secret.base32,
        backupCodes: JSON.stringify(hashedCodes),
      },
    });

    res.json({
      success: true,
      qrCode,
      secret: secret.base32,
      backupCodes: plainCodes,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to enable 2FA' });
  }
});

// Verify and confirm 2FA
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user.twoFactorSecret) {
      return res.status(400).json({ success: false, message: '2FA not set up' });
    }

    const isValid = verify2FAToken({ base32: user.twoFactorSecret }, token);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid token' });
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: { twoFactorEnabled: true },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to verify 2FA token' });
  }
});

// Disable 2FA
router.post('/disable', async (req, res) => {
  try {
    const { token } = req.body;
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });

    if (!user.twoFactorEnabled || !user.twoFactorSecret) {
      return res.status(400).json({ success: false, message: '2FA is not enabled' });
    }

    const isValid = verify2FAToken({ base32: user.twoFactorSecret }, token);
    if (!isValid) {
      return res.status(400).json({ success: false, message: 'Invalid token' });
    }

    await prisma.user.update({
      where: { id: req.user.id },
      data: { twoFactorEnabled: false, twoFactorSecret: null, backupCodes: null },
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Failed to disable 2FA' });
  }
});

export default router;