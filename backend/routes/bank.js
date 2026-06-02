import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get bank account info
router.get('/bank/account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const bankAccount = await prisma.bankAccount.findUnique({
      where: { userId }
    });
    
    const sanitized = bankAccount ? {
      id: bankAccount.id,
      accountHolder: bankAccount.accountHolder,
      bankName: bankAccount.bankName,
      accountNumber: '****' + bankAccount.accountNumber.slice(-4),
      branchCode: bankAccount.branchCode,
      accountType: bankAccount.accountType,
      isVerified: bankAccount.isVerified,
      verifiedAt: bankAccount.verifiedAt
    } : null;
    
    res.json({ success: true, bankAccount: sanitized });
  } catch (error) {
    console.error('Get bank account error:', error);
    res.status(500).json({ error: 'Failed to get bank account' });
  }
});

// Add/update bank account
router.post('/bank/account', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { accountHolder, bankName, accountNumber, branchCode, accountType } = req.body;
    
    if (!accountHolder || !bankName || !accountNumber) {
      return res.status(400).json({ error: 'Required fields missing' });
    }
    
    const bankAccount = await prisma.bankAccount.upsert({
      where: { userId },
      update: {
        accountHolder,
        bankName,
        accountNumber,
        branchCode: branchCode || null,
        accountType: accountType || 'checking',
        isVerified: false,
        verifiedAt: null
      },
      create: {
        userId,
        accountHolder,
        bankName,
        accountNumber,
        branchCode: branchCode || null,
        accountType: accountType || 'checking',
        isVerified: false
      }
    });
    
    await prisma.wallet.upsert({
      where: { userId },
      update: {},
      create: { userId, balance: 0, totalEarned: 0, totalWithdrawn: 0 }
    });
    
    res.json({ success: true, message: 'Bank account saved. Awaiting verification.' });
  } catch (error) {
    console.error('Save bank account error:', error);
    res.status(500).json({ error: 'Failed to save bank account' });
  }
});

// Request bank verification (simulated - admin action)
router.post('/bank/verify/:accountId', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { accountId } = req.params;
    
    const bankAccount = await prisma.bankAccount.findFirst({
      where: { id: accountId, userId }
    });
    
    if (!bankAccount) {
      return res.status(404).json({ error: 'Bank account not found' });
    }
    
    await prisma.bankAccount.update({
      where: { id: accountId },
      data: { isVerified: true, verifiedAt: new Date() }
    });
    
    res.json({ success: true, message: 'Bank account verified' });
  } catch (error) {
    console.error('Verify bank account error:', error);
    res.status(500).json({ error: 'Failed to verify bank account' });
  }
});

export default router;