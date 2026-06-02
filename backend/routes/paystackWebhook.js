import express from 'express';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import { creditWallet } from '../services/wallet.js';

const router = express.Router();
const prisma = new PrismaClient();

// Verify Paystack signature
function verifyWebhookSignature(signature, payload, secret) {
  const hash = crypto.createHmac('sha512', secret).update(JSON.stringify(payload)).digest('hex');
  return hash === signature;
}

// Webhook endpoint for Paystack events
router.post('/paystack', async (req, res) => {
  const signature = req.headers['x-paystack-signature'];
  
  if (!verifyWebhookSignature(signature, req.body, process.env.PAYSTACK_WEBHOOK_SECRET)) {
    console.error('Invalid webhook signature');
    return res.status(401).json({ error: 'Invalid signature' });
  }

  const event = req.body;
  const { event: eventType, data } = event;

  console.log(`Paystack webhook: ${eventType}`);

  try {
    switch (eventType) {
      case 'charge.success':
        // Payment successful
        const transaction = data;
        const userId = transaction.metadata?.userId;
        const amount = transaction.amount / 100; // Convert from kobo/cents
        const reference = transaction.reference;

        if (userId) {
          // Credit user's wallet
          await creditWallet(userId, amount, reference, `Payment via Paystack: ${reference}`);
          
          // Create transaction record
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
        break;

      case 'charge.dispute.create':
        console.log('Dispute created for transaction:', data.transaction?.reference);
        break;

      case 'transfer.success':
        // Payout to creator successful
        const transfer = data;
        const withdrawalId = transfer.reference;
        
        await prisma.transaction.updateMany({
          where: { reference: withdrawalId, type: 'payout' },
          data: { status: 'completed' }
        });
        break;

      case 'transfer.failed':
        const failedTransfer = data;
        const failedWithdrawalId = failedTransfer.reference;
        
        await prisma.transaction.updateMany({
          where: { reference: failedWithdrawalId, type: 'payout' },
          data: { status: 'failed' }
        });
        break;

      default:
        console.log(`Unhandled event type: ${eventType}`);
    }

    res.status(200).json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
