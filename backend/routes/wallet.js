import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import { getWalletByUserId, getWalletWithTransactions } from '../services/wallet.js';
import { getTransactionHistory, getEarningsSummary } from '../services/transaction.js';

const router = express.Router();
const prisma = new PrismaClient();

// AUDIT: Convert cents to Rands for display
function centsToRands(cents) {
  return (cents / 100).toFixed(2);
}

// AUDIT: GET /api/wallet/balance - Get current balance and totals
router.get('/wallet/balance', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;

    // Get or create wallet
    let wallet = await prisma.creatorWallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      // Create wallet for new user
      wallet = await prisma.creatorWallet.create({
        data: {
          userId,
          balance: 0,
          totalEarned: 0,
          totalWithdrawn: 0
        }
      });
    }

    res.json({
      success: true,
      balance: wallet.balance,
      balanceRands: centsToRands(wallet.balance),
      totalEarned: wallet.totalEarned,
      totalEarnedRands: centsToRands(wallet.totalEarned),
      totalWithdrawn: wallet.totalWithdrawn,
      totalWithdrawnRands: centsToRands(wallet.totalWithdrawn),
      updatedAt: wallet.updatedAt
    });
  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({ error: 'Failed to fetch wallet balance' });
  }
});

// AUDIT: GET /api/wallet/transactions - Get paginated transaction history
router.get('/wallet/transactions', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 20, offset = 0, type, startDate, endDate } = req.query;

    const parsedLimit = Math.min(100, parseInt(limit) || 20);
    const parsedOffset = parseInt(offset) || 0;

    // Get user's wallet
    const wallet = await prisma.creatorWallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      return res.json({
        success: true,
        transactions: [],
        total: 0,
        hasMore: false,
        limit: parsedLimit,
        offset: parsedOffset
      });
    }

    // Build where clause
    const where = { walletId: wallet.id };

    if (type && ['earning', 'withdrawal', 'refund', 'adjustment'].includes(type)) {
      where.type = type;
    }

    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }

    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: parsedLimit,
        skip: parsedOffset
      }),
      prisma.transaction.count({ where })
    ]);

    res.json({
      success: true,
      transactions: transactions.map(t => ({
        id: t.id,
        amount: t.amount,
        amountRands: centsToRands(t.amount),
        type: t.type,
        status: t.status,
        description: t.description,
        referenceId: t.referenceId,
        createdAt: t.createdAt
      })),
      total,
      hasMore: parsedOffset + parsedLimit < total,
      limit: parsedLimit,
      offset: parsedOffset
    });
  } catch (error) {
    console.error('Get wallet transactions error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// AUDIT: GET /api/wallet/summary - Get earnings summary
router.get('/wallet/summary', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { period = 'monthly' } = req.query;

    // Get wallet
    const wallet = await prisma.creatorWallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      return res.json({
        success: true,
        balance: 0,
        balanceRands: '0.00',
        totalEarned: 0,
        totalEarnedRands: '0.00',
        totalWithdrawn: 0,
        totalWithdrawnRands: '0.00',
        periodBreakdown: []
      });
    }

    // Calculate period breakdown
    let dateRange;
    const now = new Date();

    switch (period) {
      case 'daily':
        dateRange = new Date(now.setDate(now.getDate() - 30));
        break;
      case 'weekly':
        dateRange = new Date(now.setDate(now.getDate() - 90));
        break;
      case 'monthly':
      default:
        dateRange = new Date(now.setMonth(now.getMonth() - 12));
        break;
    }

    // Get earnings by period using raw query for PostgreSQL
    const breakdown = await prisma.$queryRaw`
      SELECT
        DATE_TRUNC('day', "createdAt") as period,
        SUM(amount) as total
      FROM "Transaction"
      WHERE "walletId" = ${wallet.id}
        AND type = 'earning'
        AND status = 'completed'
        AND "createdAt" >= ${dateRange}
      GROUP BY DATE_TRUNC('day', "createdAt")
      ORDER BY period DESC
      LIMIT 30
    `;

    res.json({
      success: true,
      balance: wallet.balance,
      balanceRands: centsToRands(wallet.balance),
      totalEarned: wallet.totalEarned,
      totalEarnedRands: centsToRands(wallet.totalEarned),
      totalWithdrawn: wallet.totalWithdrawn,
      totalWithdrawnRands: centsToRands(wallet.totalWithdrawn),
      periodBreakdown: breakdown.map(b => ({
        period: b.period,
        amount: Number(b.total),
        amountRands: centsToRands(Number(b.total))
      }))
    });
  } catch (error) {
    console.error('Get wallet summary error:', error);
    res.status(500).json({ error: 'Failed to fetch wallet summary' });
  }
});

export default router;