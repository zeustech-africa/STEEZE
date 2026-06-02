import express from 'express';
import { PrismaClient } from '@prisma/client';
import { initializeTransaction, verifyTransaction } from '../services/payment/paystack.js';
import { creditWallet } from '../services/wallet.js';

const router = express.Router();
const prisma = new PrismaClient();

// Initialize a payment
router.post('/initialize', async (req, res) => {
  try {
    const { userId, amount, email, metadata } = req.body;

    if (!userId || !amount || !email) {
      return res.status(400).json({ error: 'Missing required fields: userId, amount, email' });
    }

    const reference = `STEEZE_${Date.now()}_${userId.slice(0, 8)}`;

    const result = await initializeTransaction(email, amount, reference, {
      userId,
      ...metadata
    });

    if (result.success) {
      return res.status(200).json({
        success: true,
        authorization_url: result.data.authorization_url,
        reference
      });
    } else {
      return res.status(500).json({ error: result.error });
    }
  } catch (error) {
    console.error('Payment init error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Verify payment (callback after user returns)
router.get('/verify', async (req, res) => {
  try {
    const { reference } = req.query;

    if (!reference) {
      return res.status(400).json({ error: 'Missing reference' });
    }

    const result = await verifyTransaction(reference);

    if (result.success && result.data.status === 'success') {
      const transaction = result.data;
      const userId = transaction.metadata?.userId;
      const amount = transaction.amount / 100;

      if (userId) {
        await creditWallet(userId, amount, reference, `Payment via Paystack: ${reference}`);
        
        await prisma.transaction.create({
          data: {
            userId,
            amount,
            type: 'credit',
            status: 'completed',
            reference,
            description: `Payment received via Paystack`,
            metadata: { paymentId: transaction.id, gateway: 'paystack' }
          }
        });
      }

      return res.redirect(`${process.env.APP_URL}/payment/success?reference=${reference}`);
    } else {
      return res.redirect(`${process.env.APP_URL}/payment/failed?reference=${reference}`);
    }
  } catch (error) {
    console.error('Payment verify error:', error);
    res.redirect(`${process.env.APP_URL}/payment/error`);
  }
});

export default router;
