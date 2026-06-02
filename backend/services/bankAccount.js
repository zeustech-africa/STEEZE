import { PrismaClient } from '@prisma/client';
import crypto from 'crypto';

const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

// AUDIT: Encryption key from environment (must be 32 bytes)
const ENCRYPTION_KEY = process.env.BANK_ENCRYPTION_KEY || crypto.randomBytes(32).toString('hex');
const IV_LENGTH = 16;

// AUDIT: Ensure key is proper length for production
if (!process.env.BANK_ENCRYPTION_KEY && process.env.NODE_ENV === 'production') {
  console.warn('WARNING: BANK_ENCRYPTION_KEY not set in production. Using generated key - this will break after restart!');
}

// AUDIT: Encrypt sensitive data (account number)
export function encryptAccountNumber(accountNumber) {
  if (!accountNumber || typeof accountNumber !== 'string') {
    throw new Error('Invalid account number');
  }
  
  const iv = crypto.randomBytes(IV_LENGTH);
  const key = Buffer.from(ENCRYPTION_KEY, 'hex');
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  
  let encrypted = cipher.update(accountNumber, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  
  return `${iv.toString('hex')}:${encrypted}`;
}

// AUDIT: Decrypt and mask account number (only show last 4 digits)
export function decryptAndMaskAccountNumber(encryptedData) {
  if (!encryptedData || typeof encryptedData !== 'string') {
    return null;
  }
  
  try {
    const [ivHex, encrypted] = encryptedData.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const key = Buffer.from(ENCRYPTION_KEY, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    // Return masked: only last 4 digits visible
    if (decrypted.length <= 4) {
      return '****';
    }
    return `****${decrypted.slice(-4)}`;
  } catch (error) {
    console.error('Decryption error:', error);
    return null;
  }
}

// AUDIT: Add a new bank account for a user
export async function addBankAccount(userId, accountData) {
  // Input validation
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }
  if (!accountData.accountHolder || typeof accountData.accountHolder !== 'string') {
    throw new Error('Account holder name required');
  }
  if (!accountData.bankName || typeof accountData.bankName !== 'string') {
    throw new Error('Bank name required');
  }
  if (!accountData.accountNumber || typeof accountData.accountNumber !== 'string') {
    throw new Error('Account number required');
  }
  if (!accountData.branchCode || typeof accountData.branchCode !== 'string') {
    throw new Error('Branch code required');
  }
  if (!accountData.accountType || !['savings', 'checking', 'business'].includes(accountData.accountType)) {
    throw new Error('Invalid account type (savings, checking, business)');
  }

  // Encrypt account number
  const encryptedAccountNumber = encryptAccountNumber(accountData.accountNumber);

  // Check if this would be the first account (make it default)
  const existingCount = await prisma.bankAccount.count({
    where: { userId }
  });
  
  const isFirstAccount = existingCount === 0;

  // Create bank account
  const bankAccount = await prisma.bankAccount.create({
    data: {
      userId,
      accountHolder: accountData.accountHolder,
      bankName: accountData.bankName,
      accountNumber: encryptedAccountNumber,
      branchCode: accountData.branchCode,
      accountType: accountData.accountType,
      isVerified: false,
      isDefault: isFirstAccount  // First account becomes default
    }
  });

  // Return masked account number
  return {
    ...bankAccount,
    accountNumber: decryptAndMaskAccountNumber(bankAccount.accountNumber),
    accountNumberOriginal: undefined
  };
}

// AUDIT: Get all bank accounts for a user (with masked numbers)
export async function getUserBankAccounts(userId) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }

  const accounts = await prisma.bankAccount.findMany({
    where: { userId },
    orderBy: [
      { isDefault: 'desc' },
      { createdAt: 'desc' }
    ]
  });

  return accounts.map(account => ({
    ...account,
    accountNumber: decryptAndMaskAccountNumber(account.accountNumber)
  }));
}

// AUDIT: Get single bank account by ID (with ownership check)
export async function getBankAccountById(accountId, userId = null) {
  if (!accountId || typeof accountId !== 'string') {
    throw new Error('Invalid accountId');
  }

  const where = { id: accountId };
  if (userId) {
    where.userId = userId;
  }

  const account = await prisma.bankAccount.findFirst({ where });

  if (!account) {
    return null;
  }

  return {
    ...account,
    accountNumber: decryptAndMaskAccountNumber(account.accountNumber)
  };
}

// AUDIT: Set a bank account as default
export async function setDefaultBankAccount(userId, accountId) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }
  if (!accountId || typeof accountId !== 'string') {
    throw new Error('Invalid accountId');
  }

  // Verify account belongs to user
  const account = await prisma.bankAccount.findFirst({
    where: { id: accountId, userId }
  });

  if (!account) {
    throw new Error('Bank account not found');
  }

  // Remove default from all user's accounts
  await prisma.bankAccount.updateMany({
    where: { userId },
    data: { isDefault: false }
  });

  // Set new default
  const updated = await prisma.bankAccount.update({
    where: { id: accountId },
    data: { isDefault: true }
  });

  return {
    ...updated,
    accountNumber: decryptAndMaskAccountNumber(updated.accountNumber)
  };
}

// AUDIT: Delete bank account (check for pending withdrawals first)
export async function deleteBankAccount(userId, accountId) {
  if (!userId || typeof userId !== 'string') {
    throw new Error('Invalid userId');
  }
  if (!accountId || typeof accountId !== 'string') {
    throw new Error('Invalid accountId');
  }

  // Verify account belongs to user
  const account = await prisma.bankAccount.findFirst({
    where: { id: accountId, userId },
    include: {
      withdrawalRequests: {
        where: { status: { in: ['pending', 'approved', 'processing'] } }
      }
    }
  });

  if (!account) {
    throw new Error('Bank account not found');
  }

  if (account.withdrawalRequests.length > 0) {
    throw new Error('Cannot delete account with pending or active withdrawals');
  }

  // Delete the account
  await prisma.bankAccount.delete({
    where: { id: accountId }
  });

  // If deleted account was default, set another as default
  if (account.isDefault) {
    const anotherAccount = await prisma.bankAccount.findFirst({
      where: { userId },
      orderBy: { createdAt: 'asc' }
    });

    if (anotherAccount) {
      await prisma.bankAccount.update({
        where: { id: anotherAccount.id },
        data: { isDefault: true }
      });
    }
  }

  return { success: true, message: 'Bank account deleted successfully' };
}

// AUDIT: Verify a bank account (admin only)
export async function verifyBankAccount(accountId, adminUserId = null) {
  if (!accountId || typeof accountId !== 'string') {
    throw new Error('Invalid accountId');
  }

  const account = await prisma.bankAccount.findUnique({
    where: { id: accountId }
  });

  if (!account) {
    throw new Error('Bank account not found');
  }

  const updated = await prisma.bankAccount.update({
    where: { id: accountId },
    data: {
      isVerified: true,
      verifiedAt: new Date()
    }
  });

  return {
    ...updated,
    accountNumber: decryptAndMaskAccountNumber(updated.accountNumber)
  };
}

export default {
  encryptAccountNumber,
  decryptAndMaskAccountNumber,
  addBankAccount,
  getUserBankAccounts,
  getBankAccountById,
  setDefaultBankAccount,
  deleteBankAccount,
  verifyBankAccount
};