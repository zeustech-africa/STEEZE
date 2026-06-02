import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// Get wallet balance and summary
router.get('/earnings/wallet', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    let wallet = await prisma.wallet.findUnique({
      where: { userId },
      include: { bankAccount: true }
    });
    
    if (!wallet) {
      wallet = await prisma.wallet.create({
        data: { userId, balance: 0, totalEarned: 0, totalWithdrawn: 0 },
        include: { bankAccount: true }
      });
    }
    
    const posts = await prisma.post.findMany({
      where: { creatorId: userId },
      select: { earnings: true }
    });
    
    const totalEarned = posts.reduce((sum, p) => sum + (p.earnings || 0), 0);
    const availableBalance = totalEarned - wallet.totalWithdrawn;
    
    res.json({
      success: true,
      wallet: {
        balance: availableBalance,
        totalEarned,
        totalWithdrawn: wallet.totalWithdrawn,
        pendingPayout: wallet.pendingPayout,
        lastPayoutAt: wallet.lastPayoutAt,
        hasBankAccount: !!wallet.bankAccount,
        bankVerified: wallet.bankAccount?.isVerified || false
      }
    });
  } catch (error) {
    console.error('Get wallet error:', error);
    res.status(500).json({ error: 'Failed to get wallet' });
  }
});

// Get transaction history
router.get('/earnings/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;
    
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });
    
    if (!wallet) {
      return res.json({ success: true, transactions: [], total: 0 });
    }
    
    const transactions = await prisma.walletTransaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit),
      skip: parseInt(offset)
    });
    
    const total = await prisma.walletTransaction.count({
      where: { walletId: wallet.id }
    });
    
    res.json({ success: true, transactions, total });
  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// Get earnings breakdown by content
router.get('/earnings/by-content', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const posts = await prisma.post.findMany({
      where: { creatorId: userId, earnings: { gt: 0 } },
      select: {
        id: true,
        title: true,
        type: true,
        earnings: true,
        viewsCount: true,
        likeCount: true,
        createdAt: true
      },
      orderBy: { earnings: 'desc' }
    });
    
    res.json({ success: true, content: posts });
  } catch (error) {
    console.error('Get earnings by content error:', error);
    res.status(500).json({ error: 'Failed to get earnings by content' });
  }
});

// Get earnings over time
router.get('/earnings/timeline', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    
    const wallet = await prisma.wallet.findUnique({
      where: { userId }
    });
    
    if (!wallet) {
      return res.json({ success: true, timeline: [] });
    }
    
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 12);
    
    const transactions = await prisma.walletTransaction.findMany({
      where: {
        walletId: wallet.id,
        type: 'credit',
        createdAt: { gte: startDate }
      },
      orderBy: { createdAt: 'asc' }
    });
    
    // Group by month
    const timeline = [];
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    
    for (let i = 0; i < 12; i++) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthName = months[date.getMonth()];
      const year = date.getFullYear();
      
      const monthlyTotal = transactions
        .filter(t => t.createdAt.getMonth() === date.getMonth() && t.createdAt.getFullYear() === year)
        .reduce((sum, t) => sum + t.amount, 0);
      
      timeline.unshift({
        month: `${monthName} ${year}`,
        amount: monthlyTotal
      });
    }
    
    res.json({ success: true, timeline });
  } catch (error) {
    console.error('Get earnings timeline error:', error);
    res.status(500).json({ error: 'Failed to get earnings timeline' });
  }
});

export default router;