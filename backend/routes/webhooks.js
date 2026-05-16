import express from 'express';
import { PrismaClient } from '@prisma/client';
import { verifyITN, validateITNWithPayFast, processWebhook } from '../services/payfast.js';
import { sendSubscriptionConfirmation } from '../services/email.js';

const prisma = new PrismaClient();
const router = express.Router();

// PayFast ITN webhook endpoint (must use urlencoded parser)
router.post('/payfast', express.urlencoded({ extended: true }), async (req, res) => {
  try {
    console.log('[Webhook] Received PayFast ITN:', req.body);

    // Step 1: Verify signature
    const isValidSignature = verifyITN(req.body);
    if (!isValidSignature) {
      console.error('[Webhook] Invalid PayFast signature');
      return res.status(400).send('Invalid signature');
    }

    // Step 2: Validate with PayFast server (anti-spoofing)
    // Build the param string for validation
    const pfParamString = Object.entries(req.body)
      .filter(([key]) => key !== 'signature')
      .map(([key, val]) => `${key}=${encodeURIComponent(String(val).trim())}`)
      .join('&');

    const isValidServer = await validateITNWithPayFast(pfParamString);
    if (!isValidServer) {
      console.error('[Webhook] PayFast server validation failed');
      return res.status(400).send('Server validation failed');
    }

    // Step 3: Process the webhook
    const result = await processWebhook(req.body);
    console.log('[Webhook] Processed successfully:', result);

    // Step 4: Send subscription confirmation email with CPA cooling-off reminder
    if (result.action === 'subscription_activated') {
      try {
        const { custom_str1: tier, amount_gross: amount, email_address: email } = req.body;
        const creator = await prisma.user.findUnique({
          where: { id: req.body.custom_int2 },
          select: { username: true },
        });
        const creatorName = creator?.username || 'the creator';
        if (email) {
          await sendSubscriptionConfirmation(email, creatorName, tier || 'basic', parseFloat(amount) || 0);
          console.log('[Webhook] Subscription confirmation email sent with CPA cooling-off reminder');
        }
      } catch (emailErr) {
        console.error('[Webhook] Failed to send subscription confirmation email:', emailErr.message);
        // Non-fatal — webhook still succeeds even if email fails
      }
    }

    res.status(200).send('OK');
  } catch (error) {
    console.error('[Webhook] Error processing webhook:', error);
    res.status(500).send('Error');
  }
});

// Test webhook endpoint (for debugging)
router.get('/payfast/test', (req, res) => {
  res.json({
    success: true,
    message: 'Webhook endpoint is reachable',
    sandbox: process.env.PF_SANDBOX === 'true',
    timestamp: new Date().toISOString(),
  });
});

export default router;