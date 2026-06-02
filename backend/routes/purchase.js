import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../middleware/auth.js';
import crypto from 'crypto';

const router = express.Router();
const prisma = new PrismaClient();

// AUDIT: Helper to generate unique payment ID
function generatePaymentId() {
  return `STEEZE_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
}

// AUDIT: POST /api/purchase/initiate - Start purchase process
router.post('/purchase/initiate', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { postId } = req.body;

    if (!postId) {
      return res.status(400).json({ error: 'Post ID is required' });
    }

    // Get post details
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: {
        id: true,
        title: true,
        contentType: true,
        price: true,
        creatorId: true
      }
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.contentType !== 'direct_purchase') {
      return res.status(400).json({ error: 'This content is not available for direct purchase' });
    }

    if (!post.price || post.price < 500 || post.price > 50000) {
      return res.status(400).json({ error: 'Invalid price for this content' });
    }

    // Check if already purchased
    const existingPurchase = await prisma.directPurchase.findFirst({
      where: {
        userId,
        postId,
        status: 'completed'
      }
    });

    if (existingPurchase) {
      return res.status(400).json({
        error: 'You have already purchased this content',
        alreadyPurchased: true
      });
    }

    // Create pending purchase record
    const purchase = await prisma.directPurchase.create({
      data: {
        userId,
        postId,
        amount: post.price,
        status: 'pending'
      }
    });

    // Generate payment ID
    const paymentId = generatePaymentId();

    // Store payment ID mapping
    await prisma.directPurchase.update({
      where: { id: purchase.id },
      data: {
        transactionId: paymentId
      }
    });

    res.json({
      success: true,
      purchaseId: purchase.id,
      paymentId,
      amount: (post.price / 100).toFixed(2),
      post: {
        id: post.id,
        title: post.title
      }
    });
  } catch (error) {
    console.error('Initiate purchase error:', error);
    res.status(500).json({ error: 'Failed to initiate purchase' });
  }
});

// AUDIT: POST /api/purchase/verify - Verify purchase status
router.post('/purchase/verify', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { purchaseId, paymentStatus } = req.body;

    if (!purchaseId) {
      return res.status(400).json({ error: 'Purchase ID is required' });
    }

    const purchase = await prisma.directPurchase.findFirst({
      where: {
        id: purchaseId,
        userId
      },
      include: {
        post: true
      }
    });

    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    if (purchase.status === 'completed') {
      return res.json({
        success: true,
        alreadyCompleted: true,
        post: purchase.post,
        purchasedAt: purchase.completedAt
      });
    }

    // Update based on the passed payment verification status
    if (paymentStatus === 'completed') {
      const updated = await prisma.directPurchase.update({
        where: { id: purchaseId },
        data: {
          status: 'completed',
          completedAt: new Date()
        }
      });

      return res.json({
        success: true,
        purchase: updated,
        post: purchase.post,
        message: 'Purchase completed successfully'
      });
    }

    res.json({
      success: false,
      status: purchase.status,
      message: 'Purchase not yet completed'
    });
  } catch (error) {
    console.error('Verify purchase error:', error);
    res.status(500).json({ error: 'Failed to verify purchase' });
  }
});

// AUDIT: GET /api/purchase/status/:purchaseId - Check purchase status
router.get('/purchase/status/:purchaseId', authenticateToken, async (req, res) => {
  try {
    const { purchaseId } = req.params;
    const userId = req.user.id;

    const purchase = await prisma.directPurchase.findFirst({
      where: {
        id: purchaseId,
        userId
      },
      include: {
        post: {
          select: {
            id: true,
            title: true,
            mediaUrl: true,
            mediaType: true
          }
        }
      }
    });

    if (!purchase) {
      return res.status(404).json({ error: 'Purchase not found' });
    }

    res.json({
      success: true,
      purchase: {
        id: purchase.id,
        status: purchase.status,
        amount: purchase.amount,
        amountRands: (purchase.amount / 100).toFixed(2),
        completedAt: purchase.completedAt,
        createdAt: purchase.createdAt
      },
      post: purchase.post
    });
  } catch (error) {
    console.error('Purchase status error:', error);
    res.status(500).json({ error: 'Failed to get purchase status' });
  }
});

// AUDIT: GET /api/user/purchases - Get user's purchased content
router.get('/user/purchases', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit = 50, offset = 0 } = req.query;

    const parsedLimit = Math.min(100, parseInt(limit) || 50);
    const parsedOffset = parseInt(offset) || 0;

    const [purchases, total] = await Promise.all([
      prisma.directPurchase.findMany({
        where: {
          userId,
          status: 'completed'
        },
        include: {
          post: {
            include: {
              creator: {
                select: {
                  id: true,
                  artistName: true,
                  fullName: true,
                  profilePicUrl: true
                }
              }
            }
          }
        },
        orderBy: { completedAt: 'desc' },
        take: parsedLimit,
        skip: parsedOffset
      }),
      prisma.directPurchase.count({
        where: {
          userId,
          status: 'completed'
        }
      })
    ]);

    res.json({
      success: true,
      purchases: purchases.map(p => ({
        id: p.id,
        amount: p.amount,
        amountRands: (p.amount / 100).toFixed(2),
        completedAt: p.completedAt,
        post: p.post
      })),
      total,
      hasMore: parsedOffset + parsedLimit < total
    });
  } catch (error) {
    console.error('Get user purchases error:', error);
    res.status(500).json({ error: 'Failed to get purchases' });
  }
});

export default router;