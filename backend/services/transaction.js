import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// AUDIT: Convert cents to Rands
function centsToRands(cents) {
  return (cents / 100).toFixed(2);
}

// AUDIT: Create a new transaction
export async function createTransaction(walletId, amountCents, type, description, referenceId = null, metadata = null, status = 'completed') {
  // Input validation
  if (!walletId || typeof walletId !== 'string') {
    throw new Error('Invalid walletId');
  }
  if (typeof amountCents !== 'number' || amountCents === 0) {
    throw new Error('Invalid amount (must be non-zero number)');
  }
  if (!type || !['earning', 'withdrawal', 'refund', 'adjustment'].includes(type)) {
    throw new Error('Invalid transaction type');
  }
  if (!description || typeof description !== 'string') {
    throw new Error('Invalid description');
  }
  if (status && !['pending', 'completed', 'failed', 'cancelled'].includes(status)) {
    throw new Error('Invalid status');
  }

  const transaction = await prisma.transaction.create({
    data: {
      walletId,
      amount: amountCents,
      type,
      status: status || 'completed',
      description,
      referenceId,
      metadata: metadata || {}
    }
  });

  return {
    ...transaction,
    amountRands: centsToRands(transaction.amount)
  };
}

// AUDIT: Get transaction by ID
export async function getTransactionById(transactionId) {
  if (!transactionId || typeof transactionId !== 'string') {
    throw new Error('Invalid transactionId');
  }

  const transaction = await prisma.transaction.findUnique({
    where: { id: transactionId },
    include: {
      wallet: {
        include: {
          user: {
            select: {
              id: true,
              email: true,
              artistName: true,
              fullName: true
            }
          }
        }
      }
    }
  });

  if (!transaction) {
    return null;
  }

  return {
    ...transaction,
    amountRands: centsToRands(transaction.amount)
  };
}

// AUDIT: Get all transactions for a user with pagination
export async function getUserTransactions(userId, limit = 50, offset = 0) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }

  const parsedLimit = Math.min(100, parseInt(limit) || 50);
  const parsedOffset = parseInt(offset) || 0;

  // First get user's wallet
  const wallet = await prisma.creatorWallet.findUnique({
    where: { userId }
  });

  if (!wallet) {
    return {
      transactions: [],
      total: 0,
      hasMore: false
    };
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { walletId: wallet.id },
      orderBy: { createdAt: 'desc' },
      take: parsedLimit,
      skip: parsedOffset
    }),
    prisma.transaction.count({
      where: { walletId: wallet.id }
    })
  ]);

  return {
    transactions: transactions.map(t => ({
      ...t,
      amountRands: centsToRands(t.amount)
    })),
    total,
    hasMore: parsedOffset + parsedLimit < total
  };
}

// AUDIT: Get filtered transaction history by type and date range
export async function getTransactionHistory(userId, options = {}) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }

  const { type, startDate, endDate, limit = 50, offset = 0 } = options;

  // Get user's wallet
  const wallet = await prisma.creatorWallet.findUnique({
    where: { userId }
  });

  if (!wallet) {
    return {
      transactions: [],
      total: 0,
      summary: { totalEarnings: 0, totalWithdrawals: 0, netBalance: 0 }
    };
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

  const parsedLimit = Math.min(100, parseInt(limit) || 50);
  const parsedOffset = parseInt(offset) || 0;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: parsedLimit,
      skip: parsedOffset
    }),
    prisma.transaction.count({ where })
  ]);

  // Calculate summary
  const allTransactions = await prisma.transaction.findMany({
    where,
    select: { amount: true, type: true }
  });

  const summary = allTransactions.reduce((acc, t) => {
    if (t.type === 'earning') {
      acc.totalEarnings += t.amount;
    } else if (t.type === 'withdrawal') {
      acc.totalWithdrawals += Math.abs(t.amount);
    }
    return acc;
  }, { totalEarnings: 0, totalWithdrawals: 0 });

  summary.netBalance = summary.totalEarnings - summary.totalWithdrawals;

  return {
    transactions: transactions.map(t => ({
      ...t,
      amountRands: centsToRands(t.amount)
    })),
    total,
    hasMore: parsedOffset + parsedLimit < total,
    summary: {
      totalEarnings: centsToRands(summary.totalEarnings),
      totalWithdrawals: centsToRands(summary.totalWithdrawals),
      netBalance: centsToRands(summary.netBalance)
    }
  };
}

// AUDIT: Get earnings summary (daily/weekly/monthly/total)
export async function getEarningsSummary(userId, period = 'monthly') {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }

  const wallet = await prisma.creatorWallet.findUnique({
    where: { userId }
  });

  if (!wallet) {
    return {
      total: '0.00',
      breakdown: []
    };
  }

  let dateRange;

  const now = new Date();
  
  switch (period) {
    case 'daily':
      dateRange = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'weekly':
      dateRange = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'monthly':
    default:
      dateRange = new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
      break;
  }

  // Use Prisma's raw query for date grouping
  const breakdown = await prisma.$queryRaw`
    SELECT 
      DATE_TRUNC('day', "createdAt") as period,
      SUM(amount) as total
    FROM "Transaction"
    WHERE "walletId" = ${wallet.id}
      AND type = 'earning'
      AND "createdAt" >= ${dateRange}
    GROUP BY DATE_TRUNC('day', "createdAt")
    ORDER BY period DESC
    LIMIT 30
  `;

  // Get total earnings
  const totalResult = await prisma.transaction.aggregate({
    where: {
      walletId: wallet.id,
      type: 'earning'
    },
    _sum: {
      amount: true
    }
  });

  return {
    total: centsToRands(totalResult._sum.amount || 0),
    breakdown: breakdown.map(b => ({
      period: b.period,
      amount: centsToRands(Number(b.total))
    }))
  };
}

// AUDIT: Get most recent transactions
export async function getRecentTransactions(userId, limit = 10) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }

  const parsedLimit = Math.min(50, parseInt(limit) || 10);

  const wallet = await prisma.creatorWallet.findUnique({
    where: { userId }
  });

  if (!wallet) {
    return [];
  }

  const transactions = await prisma.transaction.findMany({
    where: { walletId: wallet.id },
    orderBy: { createdAt: 'desc' },
    take: parsedLimit
  });

  return transactions.map(t => ({
    ...t,
    amountRands: centsToRands(t.amount)
  }));
}

export default {
  createTransaction,
  getTransactionById,
  getUserTransactions,
  getTransactionHistory,
  getEarningsSummary,
  getRecentTransactions
};