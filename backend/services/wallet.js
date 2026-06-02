import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// Helper to create transaction record
async function createTransaction(userId, amount, type, status, reference, description, metadata = {}) {
  try {
    return await prisma.transaction.create({
      data: {
        userId,
        amount,
        type,
        status: status || 'pending',
        reference,
        description,
        metadata
      }
    });
  } catch (error) {
    console.error('Failed to create transaction record:', error);
    // Don't throw - transaction recording should not break wallet operations
    return null;
  }
}

// AUDIT: Convert cents to Rands for display
export function centsToRands(cents) {
  return (cents / 100).toFixed(2);
}

// AUDIT: Convert Rands to cents for storage
export function randsToCents(rands) {
  return Math.round(parseFloat(rands) * 100);
}

// AUDIT: Credit wallet with transaction recording
export async function creditWallet(userId, amount, reference, description) {
  const wallet = await getOrCreateWallet(userId);
  
  // Update wallet balance
  const newBalance = wallet.balance + amount;
  await prisma.creatorWallet.update({
    where: { id: wallet.id },
    data: {
      balance: newBalance,
      totalEarned: wallet.totalEarned + amount
    }
  });
  
  // After updating wallet balance, create transaction record
  await createTransaction(
    userId,
    amount,
    'credit',
    'completed',
    reference,
    description,
    { source: 'payment', paymentId: reference }
  );
  
  return { balance: newBalance };
}

// AUDIT: Debit wallet with transaction recording
export async function debitWallet(userId, amount, reference, description) {
  const wallet = await getOrCreateWallet(userId);
  
  if (wallet.balance < amount) {
    throw new Error('Insufficient balance');
  }
  
  // Update wallet balance
  const newBalance = wallet.balance - amount;
  await prisma.creatorWallet.update({
    where: { id: wallet.id },
    data: {
      balance: newBalance,
      totalWithdrawn: wallet.totalWithdrawn + amount
    }
  });
  
  // After updating wallet balance, create transaction record
  await createTransaction(
    userId,
    amount,
    'debit',
    'completed',
    reference,
    description,
    { source: 'withdrawal', withdrawalId: reference }
  );
  
  return { balance: newBalance };
}

// AUDIT: Create withdrawal with pending transaction
export async function createWithdrawal(userId, amount, withdrawalId, bankAccountId) {
  const wallet = await getOrCreateWallet(userId);
  
  if (wallet.balance < amount) {
    throw new Error('Insufficient balance');
  }
  
  // When a withdrawal is requested, create a pending transaction
  await createTransaction(
    userId,
    amount,
    'payout',
    'pending',
    withdrawalId,
    `Withdrawal request to bank`,
    { bankAccount: bankAccountId }
  );
  
  return { withdrawalId, amount, status: 'pending' };
}

// AUDIT: Complete withdrawal and update transaction status
export async function completeWithdrawal(withdrawalId) {
  // When withdrawal is completed, update transaction status
  await prisma.transaction.updateMany({
    where: { reference: withdrawalId, type: 'payout' },
    data: { status: 'completed' }
  });
  
  return { withdrawalId, status: 'completed' };
}

// AUDIT: Fail withdrawal and update transaction status
export async function failWithdrawal(withdrawalId) {
  // When withdrawal fails, update transaction status
  await prisma.transaction.updateMany({
    where: { reference: withdrawalId, type: 'payout' },
    data: { status: 'failed' }
  });
  
  return { withdrawalId, status: 'failed' };
}

// AUDIT: Get or create wallet for a user
export async function getOrCreateWallet(userId) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }

  let wallet = await prisma.creatorWallet.findUnique({
    where: { userId }
  });

  if (!wallet) {
    wallet = await prisma.creatorWallet.create({
      data: {
        userId,
        balance: 0,
        totalEarned: 0,
        totalWithdrawn: 0
      }
    });
  }

  return wallet;
}

// AUDIT: Get wallet by user ID with balance only
export async function getWalletByUserId(userId) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }

  const wallet = await prisma.creatorWallet.findUnique({
    where: { userId },
    select: {
      id: true,
      userId: true,
      balance: true,
      totalEarned: true,
      totalWithdrawn: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!wallet) {
    return null;
  }

  return {
    ...wallet,
    balanceRands: centsToRands(wallet.balance),
    totalEarnedRands: centsToRands(wallet.totalEarned),
    totalWithdrawnRands: centsToRands(wallet.totalWithdrawn)
  };
}

// AUDIT: Get wallet with transaction history
export async function getWalletWithTransactions(userId, limit = 50, offset = 0) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }

  const wallet = await prisma.creatorWallet.findUnique({
    where: { userId },
    include: {
      transactions: {
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset
      }
    }
  });

  if (!wallet) {
    return null;
  }

  return {
    ...wallet,
    balanceRands: centsToRands(wallet.balance),
    totalEarnedRands: centsToRands(wallet.totalEarned),
    totalWithdrawnRands: centsToRands(wallet.totalWithdrawn),
    transactions: wallet.transactions.map(t => ({
      ...t,
      amountRands: centsToRands(t.amount)
    }))
  };
}

// AUDIT: Update wallet balance with transaction record
export async function updateBalance(userId, amountCents, type, description, referenceId = null, metadata = null) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
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

  // AUDIT: Use transaction to ensure consistency
  const result = await prisma.$transaction(async (tx) => {
    // Get or create wallet
    let wallet = await tx.creatorWallet.findUnique({
      where: { userId }
    });

    if (!wallet) {
      wallet = await tx.creatorWallet.create({
        data: {
          userId,
          balance: 0,
          totalEarned: 0,
          totalWithdrawn: 0
        }
      });
    }

    // Calculate new balance
    const newBalance = wallet.balance + amountCents;
    
    // AUDIT: Prevent negative balance
    if (newBalance < 0) {
      throw new Error('Insufficient balance');
    }

    // Update wallet
    const updateData = {
      balance: newBalance
    };

    // Update lifetime totals
    if (amountCents > 0 && type === 'earning') {
      updateData.totalEarned = wallet.totalEarned + amountCents;
    } else if (amountCents < 0 && type === 'withdrawal') {
      updateData.totalWithdrawn = wallet.totalWithdrawn + Math.abs(amountCents);
    }

    const updatedWallet = await tx.creatorWallet.update({
      where: { id: wallet.id },
      data: updateData
    });

    // Create transaction record
    const transaction = await tx.transaction.create({
      data: {
        walletId: wallet.id,
        amount: amountCents,
        type,
        status: 'completed',
        description,
        referenceId,
        metadata: metadata || {}
      }
    });

    return { wallet: updatedWallet, transaction };
  });

  return result;
}

// AUDIT: Get current balance in Rands
export async function getBalance(userId) {
  const wallet = await getWalletByUserId(userId);
  if (!wallet) {
    return '0.00';
  }
  return wallet.balanceRands;
}

// AUDIT: Get total earned in Rands
export async function getTotalEarned(userId) {
  const wallet = await getWalletByUserId(userId);
  if (!wallet) {
    return '0.00';
  }
  return wallet.totalEarnedRands;
}

// AUDIT: Get total withdrawn in Rands
export async function getTotalWithdrawn(userId) {
  const wallet = await getWalletByUserId(userId);
  if (!wallet) {
    return '0.00';
  }
  return wallet.totalWithdrawnRands;
}

export default {
  centsToRands,
  randsToCents,
  createTransaction,
  creditWallet,
  debitWallet,
  createWithdrawal,
  completeWithdrawal,
  failWithdrawal,
  getOrCreateWallet,
  getWalletByUserId,
  getWalletWithTransactions,
  updateBalance,
  getBalance,
  getTotalEarned,
  getTotalWithdrawn
};
