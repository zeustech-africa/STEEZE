import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, requireAdmin } from '../../middleware/auth.js';
import { updateBalance } from '../../services/wallet.js';

const router = express.Router();
const prisma = new PrismaClient();

// AUDIT: Convert cents to Rands for display
function centsToRands(cents) {
  return (cents / 100).toFixed(2);
}

// AUDIT: Get all withdrawals with filtering and pagination
router.get('/admin/withdrawals', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { 
      status, 
      limit = 50, 
      offset = 0,
      startDate,
      endDate,
      userId
    } = req.query;
    
    const parsedLimit = Math.min(100, parseInt(limit) || 50);
    const parsedOffset = parseInt(offset) || 0;
    
    // Build where clause
    const where = {};
    
    if (status && ['pending', 'approved', 'processing', 'completed', 'rejected', 'cancelled'].includes(status)) {
      where.status = status;
    }
    
    if (userId) {
      where.userId = userId;
    }
    
    if (startDate) {
      where.createdAt = { ...where.createdAt, gte: new Date(startDate) };
    }
    
    if (endDate) {
      where.createdAt = { ...where.createdAt, lte: new Date(endDate) };
    }
    
    const [withdrawals, total] = await Promise.all([
      prisma.withdrawalRequest.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              artistName: true,
              fullName: true
            }
          },
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
      prisma.withdrawalRequest.count({ where })
    ]);
    
    // Calculate summary statistics
    const summary = await prisma.withdrawalRequest.aggregate({
      where,
      _sum: {
        amount: true
      },
      _count: true
    });
    
    const statusCounts = await prisma.withdrawalRequest.groupBy({
      by: ['status'],
      where,
      _count: true
    });
    
    res.json({
      success: true,
      withdrawals: withdrawals.map(w => ({
        ...w,
        amountRands: centsToRands(w.amount)
      })),
      pagination: {
        total,
        limit: parsedLimit,
        offset: parsedOffset,
        hasMore: parsedOffset + parsedLimit < total
      },
      summary: {
        totalAmountCents: summary._sum.amount || 0,
        totalAmountRands: centsToRands(summary._sum.amount || 0),
        totalRequests: summary._count
      },
      statusCounts: statusCounts.map(sc => ({
        status: sc.status,
        count: sc._count
      }))
    });
  } catch (error) {
    console.error('Get withdrawals error:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawals' });
  }
});

// AUDIT: Approve a withdrawal request
router.post('/admin/withdrawals/:id/approve', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const adminUserId = req.user.id;
    const { adminNotes } = req.body;
    
    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            artistName: true
          }
        }
      }
    });
    
    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal request not found' });
    }
    
    if (withdrawal.status !== 'pending') {
      return res.status(400).json({ 
        error: `Cannot approve withdrawal with status: ${withdrawal.status}` 
      });
    }
    
    // Update withdrawal status
    const updated = await prisma.$transaction(async (tx) => {
      const updatedWithdrawal = await tx.withdrawalRequest.update({
        where: { id },
        data: {
          status: 'approved',
          adminNotes: adminNotes || null,
          processedBy: adminUserId,
          processedAt: new Date()
        }
      });
      
      // Update associated transaction to processing
      await tx.transaction.updateMany({
        where: {
          referenceId: id,
          type: 'withdrawal'
        },
        data: { status: 'pending' } // Keep pending until completed
      });
      
      return updatedWithdrawal;
    });
    
    res.json({
      success: true,
      withdrawal: {
        ...updated,
        amountRands: centsToRands(updated.amount)
      },
      message: 'Withdrawal request approved'
    });
  } catch (error) {
    console.error('Approve withdrawal error:', error);
    res.status(500).json({ error: 'Failed to approve withdrawal' });
  }
});

// AUDIT: Reject a withdrawal request
router.post('/admin/withdrawals/:id/reject', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const adminUserId = req.user.id;
    const { rejectionReason, adminNotes } = req.body;
    
    if (!rejectionReason || typeof rejectionReason !== 'string') {
      return res.status(400).json({ error: 'Rejection reason is required' });
    }
    
    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id },
      include: {
        user: true
      }
    });
    
    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal request not found' });
    }
    
    if (withdrawal.status !== 'pending' && withdrawal.status !== 'approved') {
      return res.status(400).json({ 
        error: `Cannot reject withdrawal with status: ${withdrawal.status}` 
      });
    }
    
    // Update withdrawal status and refund balance
    const updated = await prisma.$transaction(async (tx) => {
      // Update withdrawal request
      const updatedWithdrawal = await tx.withdrawalRequest.update({
        where: { id },
        data: {
          status: 'rejected',
          rejectionReason,
          adminNotes: adminNotes || null,
          processedBy: adminUserId,
          processedAt: new Date()
        }
      });
      
      // Update associated transaction to failed
      await tx.transaction.updateMany({
        where: {
          referenceId: id,
          type: 'withdrawal'
        },
        data: { status: 'failed' }
      });
      
      return updatedWithdrawal;
    });
    
    res.json({
      success: true,
      withdrawal: {
        ...updated,
        amountRands: centsToRands(updated.amount)
      },
      message: 'Withdrawal request rejected'
    });
  } catch (error) {
    console.error('Reject withdrawal error:', error);
    res.status(500).json({ error: 'Failed to reject withdrawal' });
  }
});

// AUDIT: Mark withdrawal as processing
router.post('/admin/withdrawals/:id/process', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const adminUserId = req.user.id;
    
    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id }
    });
    
    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal request not found' });
    }
    
    if (withdrawal.status !== 'approved') {
      return res.status(400).json({ 
        error: `Cannot mark as processing. Current status: ${withdrawal.status}` 
      });
    }
    
    const updated = await prisma.$transaction(async (tx) => {
      const updatedWithdrawal = await tx.withdrawalRequest.update({
        where: { id },
        data: {
          status: 'processing',
          processedBy: adminUserId
        }
      });
      
      // Update associated transaction
      await tx.transaction.updateMany({
        where: {
          referenceId: id,
          type: 'withdrawal'
        },
        data: { status: 'pending' }
      });
      
      return updatedWithdrawal;
    });
    
    res.json({
      success: true,
      withdrawal: {
        ...updated,
        amountRands: centsToRands(updated.amount)
      },
      message: 'Withdrawal marked as processing'
    });
  } catch (error) {
    console.error('Process withdrawal error:', error);
    res.status(500).json({ error: 'Failed to update withdrawal status' });
  }
});

// AUDIT: Mark withdrawal as completed
router.post('/admin/withdrawals/:id/complete', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    const adminUserId = req.user.id;
    const { transactionReference } = req.body;
    
    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id },
      include: {
        user: true
      }
    });
    
    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal request not found' });
    }
    
    if (withdrawal.status !== 'processing' && withdrawal.status !== 'approved') {
      return res.status(400).json({ 
        error: `Cannot complete withdrawal with status: ${withdrawal.status}` 
      });
    }
    
    // Complete the withdrawal
    const updated = await prisma.$transaction(async (tx) => {
      const updatedWithdrawal = await tx.withdrawalRequest.update({
        where: { id },
        data: {
          status: 'completed',
          processedBy: adminUserId,
          processedAt: new Date(),
          metadata: {
            ...(withdrawal.metadata || {}),
            transactionReference: transactionReference || null,
            completedBy: adminUserId,
            completedAt: new Date().toISOString()
          }
        }
      });
      
      // Update associated transaction to completed and deduct from wallet balance
      await tx.transaction.updateMany({
        where: {
          referenceId: id,
          type: 'withdrawal'
        },
        data: { 
          status: 'completed'
        }
      });
      
      // Deduct from wallet balance (if not already deducted)
      const wallet = await tx.creatorWallet.findUnique({
        where: { userId: withdrawal.userId }
      });
      
      if (wallet && wallet.balance >= withdrawal.amount) {
        await tx.creatorWallet.update({
          where: { userId: withdrawal.userId },
          data: {
            balance: wallet.balance - withdrawal.amount,
            totalWithdrawn: wallet.totalWithdrawn + withdrawal.amount
          }
        });
      }
      
      return updatedWithdrawal;
    });
    
    res.json({
      success: true,
      withdrawal: {
        ...updated,
        amountRands: centsToRands(updated.amount)
      },
      message: 'Withdrawal marked as completed'
    });
  } catch (error) {
    console.error('Complete withdrawal error:', error);
    res.status(500).json({ error: 'Failed to complete withdrawal' });
  }
});

// AUDIT: Get single withdrawal details (admin view)
router.get('/admin/withdrawals/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { id } = req.params;
    
    const withdrawal = await prisma.withdrawalRequest.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            artistName: true,
            fullName: true
          }
        },
        bankAccount: {
          select: {
            id: true,
            bankName: true,
            accountHolder: true,
            accountNumber: true,
            branchCode: true,
            accountType: true,
            isVerified: true
          }
        }
      }
    });
    
    if (!withdrawal) {
      return res.status(404).json({ error: 'Withdrawal request not found' });
    }
    
    res.json({
      success: true,
      withdrawal: {
        ...withdrawal,
        amountRands: centsToRands(withdrawal.amount)
      }
    });
  } catch (error) {
    console.error('Get withdrawal details error:', error);
    res.status(500).json({ error: 'Failed to fetch withdrawal details' });
  }
});

export default router;