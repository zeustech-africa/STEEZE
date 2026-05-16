import crypto from 'crypto';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const PF_MERCHANT_ID = process.env.PF_MERCHANT_ID;
const PF_MERCHANT_KEY = process.env.PF_MERCHANT_KEY;
const PF_PASSPHRASE = process.env.PF_PASSPHRASE;
const PF_SANDBOX = process.env.PF_SANDBOX === 'true';
const PF_URL = PF_SANDBOX
  ? 'https://sandbox.payfast.co.za/eng/process'
  : 'https://www.payfast.co.za/eng/process';
const PF_VALIDATE_URL = PF_SANDBOX
  ? 'https://sandbox.payfast.co.za/eng/query/validate'
  : 'https://www.payfast.co.za/eng/query/validate';

// Generate signature for PayFast request
export function generateSignature(data, passphrase = null) {
  let pfOutput = '';
  // Sort keys alphabetically and exclude 'signature'
  const sortedKeys = Object.keys(data).filter(k => k !== 'signature').sort();
  for (const key of sortedKeys) {
    const val = data[key];
    if (val !== '' && val !== null && val !== undefined) {
      pfOutput += `${key}=${encodeURIComponent(String(val).trim())}&`;
    }
  }
  // Remove trailing &
  const pfOutputTemp = pfOutput.slice(0, -1);
  const phrase = passphrase || PF_PASSPHRASE;
  if (phrase && phrase !== '') {
    return crypto.createHash('md5').update(`${pfOutputTemp}&passphrase=${phrase}`).digest('hex');
  }
  return crypto.createHash('md5').update(pfOutputTemp).digest('hex');
}

// Create subscription payment data
export async function createSubscriptionPayment(user, creatorId, tier, price) {
  const mPaymentId = `sub_${Date.now()}_${user.id}`;

  const data = {
    merchant_id: PF_MERCHANT_ID,
    merchant_key: PF_MERCHANT_KEY,
    return_url: `${process.env.APP_URL}/payment-success`,
    cancel_url: `${process.env.APP_URL}/payment-cancelled`,
    notify_url: `${process.env.API_URL}/api/webhooks/payfast`,
    name_first: user.firstName || '',
    name_last: user.lastName || '',
    email_address: user.email,
    m_payment_id: mPaymentId,
    amount: price.toFixed(2),
    item_name: `${tier.charAt(0).toUpperCase() + tier.slice(1)} Subscription - ${creatorId}`,
    item_description: `Monthly subscription to ${creatorId}`,
    custom_int1: user.id,
    custom_int2: creatorId,
    custom_str1: tier,
    // Recurring billing
    subscription_type: '1',
    recurring_amount: price.toFixed(2),
    frequency: '3', // monthly
    cycles: '0', // indefinite
  };

  data.signature = generateSignature(data);

  return { url: PF_URL, data };
}

// Verify ITN webhook signature
export function verifyITN(data) {
  const pfData = { ...data };
  const receivedSignature = pfData.signature;
  delete pfData.signature;

  const expectedSignature = generateSignature(pfData);
  return receivedSignature === expectedSignature;
}

// Validate ITN with PayFast server (anti-spoofing)
export async function validateITNWithPayFast(pfParamString) {
  try {
    const response = await axios.post(PF_VALIDATE_URL, pfParamString, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10000,
    });
    return response.data === 'VALID';
  } catch (error) {
    console.error('PayFast validation request failed:', error.message);
    return false;
  }
}

// Calculate revenue split
function calculateRevenueSplit(userType, amount) {
  if (userType === 'zls_artist') {
    return { creatorShare: amount * 0.5, platformShare: amount * 0.5 };
  }
  return { creatorShare: amount * 0.7, platformShare: amount * 0.3 };
}

// Process webhook notification
export async function processWebhook(data) {
  const {
    m_payment_id,
    payment_status,
    amount_gross,
    custom_int1: userId,
    custom_int2: creatorId,
    custom_str1: tier,
    pf_payment_id,
  } = data;

  const amount = parseFloat(amount_gross) || 0;

  console.log(`[PayFast] Processing webhook: ${payment_status} for payment ${m_payment_id}`);

  if (payment_status === 'COMPLETE') {
    // Find or create subscription record
    let subscription = await prisma.subscription.findFirst({
      where: { payfastId: m_payment_id },
    });

    if (!subscription) {
      subscription = await prisma.subscription.create({
        data: {
          userId,
          creatorId,
          tier: tier || 'basic',
          price: amount,
          status: 'active',
          payfastId: pf_payment_id || m_payment_id,
          startDate: new Date(),
        },
      });
    } else {
      await prisma.subscription.update({
        where: { id: subscription.id },
        data: {
          status: 'active',
          payfastId: pf_payment_id || m_payment_id,
        },
      });
    }

    // Add payment record
    await prisma.payment.create({
      data: {
        userId,
        creatorId,
        amount,
        tier: tier || 'basic',
        status: 'completed',
        payfastId: pf_payment_id || m_payment_id,
      },
    });

    // Distribute revenue to creator
    const creator = await prisma.user.findUnique({ where: { id: creatorId } });
    if (creator) {
      const split = calculateRevenueSplit(creator.userType, amount);

      await prisma.user.update({
        where: { id: creatorId },
        data: { walletBalance: { increment: split.creatorShare } },
      });

      console.log(
        `[PayFast] Revenue split: Creator R${split.creatorShare}, Platform R${split.platformShare}`
      );
    }

    return { success: true, action: 'subscription_activated' };
  }

  if (payment_status === 'CANCELLED' || payment_status === 'FAILED') {
    await prisma.subscription.updateMany({
      where: { payfastId: m_payment_id },
      data: { status: 'cancelled', endDate: new Date() },
    });

    await prisma.payment.updateMany({
      where: { payfastId: m_payment_id },
      data: { status: 'failed' },
    });

    return { success: true, action: 'subscription_cancelled' };
  }

  return { success: true, action: 'status_updated', status: payment_status };
}

export default { generateSignature, createSubscriptionPayment, verifyITN, validateITNWithPayFast, processWebhook };