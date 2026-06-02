import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

const MIN_WITHDRAWAL = 500;
const WITHDRAWAL_COOLDOWN_DAYS = 7;

// Request payout
router.post('/payout/request', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { amount } = req.body;
    
    if (!amount || amount < MIN_WITHDRAWAL) {
      return res.status(400).json({ error: `Minimum withdrawal is R${MIN_WITHDRAWAL}` });
    }
    
    const wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: { bankAccount: true }
    });
    
    if (!wallet) {
      return res.status(400).json({ error: 'No wallet found' });
    }
    
    if (!wallet.bankAccount) {
      return res.status(400).json({ error: 'Please add a bank account first' });
    }
    
    if (!wallet.bankAccount.isVerified) {
      return res.status(400).json({ error: 'Bank account not verified yet' });
    }
    
    if (wallet.lastPayoutAt) {
      const daysSinceLastPayout = (Date.now() - new Date(wallet.lastPayoutAt).getTime()) / (1000 * 60 * 60 * 24);
      if (daysSinceLastPayout < WITHDRAWAL_COOLDOWN_DAYS) {
        const daysLeft = Math.ceil(WITHDRAWAL_COOLDOWN_DAYS - daysSinceLastPayout);
        return res.status(400).json({ error: `You can request another payout in ${daysLeft} days` });
      }
    }
    
    const posts = await prisma.post.findMany({
      where: { creatorId: userId },
      select: { earnings: true }
    });
    const totalEarned = posts.reduce((sum, p) => sum + (p.earnings || 0), 0);
    const availableBalance = totalEarned - wallet.totalWithdrawn;
    
    if (amount > availableBalance) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    
    const payout = await prisma.payout.create({
      data: {
        userId,
        amount,
        bankAccountId: wallet.bankAccount.id,
        status: 'pending'
      }
    });
    
    await prisma.wallet.update({
      where: { userId },
      data: {
        pendingPayout: wallet.pendingPayout + amount,
        lastPayoutAt: new Date()
      }
    });
    
    await prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        amount: -amount,
        type: 'debit',
        source: 'payout',
        sourceId: payout.id,
        description: `Payout request for R${amount}`
      }
    });
    
    res.json({ success: true, payout });
  } catch (error) {
    console.error('Request payout error:', error);
    res.status(500).json({ error: 'Failed to request payout' });
  }
});

// Get payout history
router.get('/payout/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const payouts = await prisma.payout.findMany({
      where: { userId },
      orderBy: { requestedAt: 'desc' },
      include: { bankAccount: true }
    });
    
    const sanitized = payouts.map(p => ({
      id: p.id,
      amount: p.amount,
      status: p.status,
      reference: p.reference,
      requestedAt: p.requestedAt,
      processedAt: p.processedAt,
      completedAt: p.completedAt,
      failedReason: p.failedReason,
      bankName: p.bankAccount?.bankName,
      accountNumber: p.bankAccount ? '****' + p.bankAccount.accountNumber.slice(-4) : null
    }));
    
    res.json({ success: true, payouts: sanitized });
  } catch (error) {
    console.error('Get payout history error:', error);
    res.status(500).json({ error: 'Failed to get payout history' });
  }
});

// Admin: Update payout status
router.put('/admin/payout/:payoutId', authenticateToken, async (req, res) => {
  try {
    const { payoutId } = req.params;
    const { status, reference, failedReason } = req.body;
    const adminId = req.user.id;
    
    const payout = await prisma.payout.findUnique({
      where: { id: payoutId },
      include: { user: true, bankAccount: true }
    });
    
    if (!payout) {
      return res.status(404).json({ error: 'Payout not found' });
    }
    
    const updateData = { status };
    if (reference) updateData.reference = reference;
    if (status === 'processing') updateData.processedAt = new Date();
    if (status === 'completed') updateData.completedAt = new Date();
    if (status === 'failed' && failedReason) updateData.failedReason = failedReason;
    
    const updatedPayout = await prisma.payout.update({
      where: { id: payoutId },
      data: updateData
    });
    
    if (status === 'completed') {
      await prisma.wallet.update({
        where: { userId: payout.userId },
        data: {
          totalWithdrawn: { increment: payout.amount },
          pendingPayout: { decrement: payout.amount }
        }
      });
    } else if (status === 'failed') {
      await prisma.wallet.update({
        where: { userId: payout.userId },
        data: {
          pendingPayout: { decrement: payout.amount }
        }
      });
      
      const wallet = await prisma.wallet.findUnique({
        where: { userId: payout.userId }
      });
      if (wallet) {
        await prisma.walletTransaction.create({
          data: {
            walletId: wallet.id,
            amount: payout.amount,
            type: 'credit',
            source: 'adjustment',
            sourceId: payout.id,
            description: `Payout failed - funds returned: ${failedReason}`
          }
        });
      }
    }
    
    await prisma.adminAuditLog.create({
      data: {
        adminId,
        adminEmail: req.user.email,
        action: 'PAYOUT_STATUS_UPDATE',
        targetType: 'payout',
        targetId: payoutId,
        details: { oldStatus: payout.status, newStatus: status }
      }
    });
    
    res.json({ success: true, payout: updatedPayout });
  } catch (error) {
    console.error('Update payout error:', error);
    res.status(500).json({ error: 'Failed to update payout' });
  }
});

export default router;