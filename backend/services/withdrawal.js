import { PrismaClient } from '@prisma/client';
import { getWalletByUserId, updateBalance } from './wallet.js';
import { getUserBankAccounts, getBankAccountById } from './bankAccount.js';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// AUDIT: Minimum withdrawal amount in cents (R200 = 20000 cents)
const MINIMUM_WITHDRAWAL_CENTS = 20000;

// AUDIT: Cooldown period in milliseconds (7 days)
const COOLDOWN_DAYS = 7;
const COOLDOWN_MS = COOLDOWN_DAYS * 24 * 60 * 60 * 1000;

// AUDIT: Convert cents to Rands for display
function centsToRands(cents) {
  return (cents / 100).toFixed(2);
}

// AUDIT: Validate withdrawal amount meets minimum requirement
export function validateWithdrawalAmount(amountCents) {
  if (typeof amountCents !== 'number' || amountCents <= 0) {
    throw new Error('Invalid withdrawal amount');
  }
  
  if (amountCents < MINIMUM_WITHDRAWAL_CENTS) {
    throw new Error(`Minimum withdrawal amount is R${MINIMUM_WITHDRAWAL_CENTS / 100}`);
  }
  
  return true;
}

// AUDIT: Check if user has completed cooldown period since last withdrawal
export async function checkCooldownPeriod(userId) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }
  
  // Get most recent completed withdrawal
  const lastWithdrawal = await prisma.withdrawalRequest.findFirst({
    where: {
      userId,
      status: 'completed'
    },
    orderBy: {
      processedAt: 'desc'
    }
  });
  
  if (!lastWithdrawal || !lastWithdrawal.processedAt) {
    // No previous withdrawals, cooldown not applicable
    return { eligible: true, remainingDays: 0 };
  }
  
  const now = new Date();
  const lastWithdrawalDate = new Date(lastWithdrawal.processedAt);
  const daysSinceLastWithdrawal = (now - lastWithdrawalDate) / (1000 * 60 * 60 * 24);
  
  if (daysSinceLastWithdrawal < COOLDOWN_DAYS) {
    const remainingDays = Math.ceil(COOLDOWN_DAYS - daysSinceLastWithdrawal);
    return {
      eligible: false,
      remainingDays,
      lastWithdrawalDate: lastWithdrawalDate.toISOString(),
      message: `Please wait ${remainingDays} more day(s) before requesting another withdrawal`
    };
  }
  
  return { eligible: true, remainingDays: 0 };
}

// AUDIT: Calculate available balance for withdrawal
export async function calculateAvailableBalance(userId) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }
  
  const wallet = await getWalletByUserId(userId);
  if (!wallet) {
    return {
      balanceCents: 0,
      balanceRands: '0.00',
      minimumRequiredCents: MINIMUM_WITHDRAWAL_CENTS,
      minimumRequiredRands: centsToRands(MINIMUM_WITHDRAWAL_CENTS),
      canWithdraw: false,
      reason: 'No wallet found'
    };
  }
  
  const balanceCents = wallet.balance;
  const canWithdraw = balanceCents >= MINIMUM_WITHDRAWAL_CENTS;
  
  // Also check cooldown
  const cooldownCheck = await checkCooldownPeriod(userId);
  
  return {
    balanceCents,
    balanceRands: centsToRands(balanceCents),
    minimumRequiredCents: MINIMUM_WITHDRAWAL_CENTS,
    minimumRequiredRands: centsToRands(MINIMUM_WITHDRAWAL_CENTS),
    canWithdraw: canWithdraw && cooldownCheck.eligible,
    meetsMinimum: canWithdraw,
    cooldownEligible: cooldownCheck.eligible,
    remainingCooldownDays: cooldownCheck.remainingDays,
    reason: !canWithdraw ? 'Insufficient balance' : (!cooldownCheck.eligible ? cooldownCheck.message : null)
  };
}

// AUDIT: Request a withdrawal
export async function requestWithdrawal(userId, bankAccountId, amountCents, ipAddress = null, userAgent = null) {
  // Input validation
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }
  if (!bankAccountId || typeof bankAccountId !== 'string') {
    throw new Error('Invalid bankAccountId');
  }
  
  // Validate amount
  validateWithdrawalAmount(amountCents);
  
  // Check cooldown period
  const cooldownCheck = await checkCooldownPeriod(userId);
  if (!cooldownCheck.eligible) {
    throw new Error(cooldownCheck.message);
  }
  
  // Get user's bank account
  const bankAccount = await getBankAccountById(bankAccountId, userId);
  if (!bankAccount) {
    throw new Error('Bank account not found');
  }
  
  // Verify bank account is verified
  if (!bankAccount.isVerified) {
    throw new Error('Bank account must be verified before requesting withdrawal');
  }
  
  // Calculate available balance
  const availableBalance = await calculateAvailableBalance(userId);
  if (availableBalance.balanceCents < amountCents) {
    throw new Error(`Insufficient balance. Available: R${availableBalance.balanceRands}`);
  }
  
  // Create withdrawal request
  const withdrawal = await prisma.$transaction(async (tx) => {
    // Create the withdrawal request
    const request = await tx.withdrawalRequest.create({
      data: {
        userId,
        bankAccountId,
        amount: amountCents,
        status: 'pending'
      }
    });
    
    // Create a pending transaction record
    await tx.transaction.create({
      data: {
        walletId: (await tx.creatorWallet.findUnique({ where: { userId } })).id,
        amount: -amountCents,
        type: 'withdrawal',
        status: 'pending',
        description: `Withdrawal request: R${centsToRands(amountCents)}`,
        referenceId: request.id,
        metadata: {
          ipAddress,
          userAgent,
          bankAccountId
        }
      }
    });
    
    return request;
  });
  
  return {
    ...withdrawal,
    amountRands: centsToRands(withdrawal.amount)
  };
}

// AUDIT: Get user's withdrawal history with pagination
export async function getUserWithdrawals(userId, limit = 50, offset = 0) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }
  
  const parsedLimit = Math.min(100, parseInt(limit) || 50);
  const parsedOffset = parseInt(offset) || 0;
  
  const [withdrawals, total] = await Promise.all([
    prisma.withdrawalRequest.findMany({
      where: { userId },
      include: {
        bankAccount: {
          select: {
            id: true,
            bankName: true,
            accountHolder: true,
            accountNumber: true,
            branchCode: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: parsedLimit,
      skip: parsedOffset
    }),
    prisma.withdrawalRequest.count({ where: { userId } })
  ]);
  
  return {
    withdrawals: withdrawals.map(w => ({
      ...w,
      amountRands: centsToRands(w.amount),
      bankAccount: w.bankAccount ? {
        ...w.bankAccount,
        accountNumber: w.bankAccount.accountNumber // Already masked from bankAccount service
      } : null
    })),
    total,
    hasMore: parsedOffset + parsedLimit < total
  };
}

// AUDIT: Get single withdrawal by ID (with ownership check)
export async function getWithdrawalById(withdrawalId, userId = null) {
  if (!withdrawalId || typeof withdrawalId !== 'string') {
    throw new Error('Invalid withdrawalId');
  }
  
  const where = { id: withdrawalId };
  if (userId) {
    where.userId = userId;
  }
  
  const withdrawal = await prisma.withdrawalRequest.findFirst({
    where,
    include: {
      bankAccount: {
        select: {
          id: true,
          bankName: true,
          accountHolder: true,
          accountNumber: true,
          branchCode: true
        }
      }
    }
  });
  
  if (!withdrawal) {
    return null;
  }
  
  return {
    ...withdrawal,
    amountRands: centsToRands(withdrawal.amount),
    bankAccount: withdrawal.bankAccount ? {
      ...withdrawal.bankAccount,
      accountNumber: withdrawal.bankAccount.accountNumber // Already masked
    } : null
  };
}

// AUDIT: Cancel a pending withdrawal request
export async function cancelWithdrawalRequest(userId, withdrawalId) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }
  if (!withdrawalId || typeof withdrawalId !== 'string') {
    throw new Error('Invalid withdrawalId');
  }
  
  const withdrawal = await prisma.withdrawalRequest.findFirst({
    where: {
      id: withdrawalId,
      userId
    }
  });
  
  if (!withdrawal) {
    throw new Error('Withdrawal request not found');
  }
  
  if (withdrawal.status !== 'pending') {
    throw new Error(`Cannot cancel withdrawal with status: ${withdrawal.status}`);
  }
  
  // Cancel the withdrawal request
  const cancelled = await prisma.$transaction(async (tx) => {
    const updated = await tx.withdrawalRequest.update({
      where: { id: withdrawalId },
      data: { status: 'cancelled' }
    });
    
    // Update the associated transaction to cancelled
    await tx.transaction.updateMany({
      where: {
        referenceId: withdrawalId,
        type: 'withdrawal'
      },
      data: { status: 'cancelled' }
    });
    
    return updated;
  });
  
  return {
    ...cancelled,
    amountRands: centsToRands(cancelled.amount),
    message: 'Withdrawal request cancelled successfully'
  };
}

export default {
  MINIMUM_WITHDRAWAL_CENTS,
  COOLDOWN_DAYS,
  validateWithdrawalAmount,
  checkCooldownPeriod,
  requestWithdrawal,
  getUserWithdrawals,
  getWithdrawalById,
  calculateAvailableBalance,
  cancelWithdrawalRequest
};