import Paystack from 'paystack';

const paystack = Paystack(process.env.PAYSTACK_SECRET_KEY);

export default paystack;

// Initialize a transaction
export async function initializeTransaction(email, amount, reference, metadata = {}) {
  try {
    const response = await paystack.transaction.initialize({
      email,
      amount: amount * 100, // Paystack uses kobo/cents
      reference,
      metadata,
      callback_url: `${process.env.APP_URL}/payment/verify`
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Paystack init error:', error);
    return { success: false, error: error.message };
  }
}

// Verify a transaction
export async function verifyTransaction(reference) {
  try {
    const response = await paystack.transaction.verify(reference);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Paystack verify error:', error);
    return { success: false, error: error.message };
  }
}

// Create a subscription plan
export async function createPlan(name, amount, interval, description) {
  try {
    const response = await paystack.plan.create({
      name,
      amount: amount * 100,
      interval, // daily, weekly, monthly, annually
      description
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Paystack plan error:', error);
    return { success: false, error: error.message };
  }
}

// Create a subscription
export async function createSubscription(customer, planCode, authorization) {
  try {
    const response = await paystack.subscription.create({
      customer,
      plan: planCode,
      authorization
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Paystack subscription error:', error);
    return { success: false, error: error.message };
  }
}

// Create a transfer recipient (for creator payouts)
export async function createTransferRecipient(name, accountNumber, bankCode) {
  try {
    const response = await paystack.transferrecipient.create({
      type: 'nuban',
      name,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: 'NGN' // Will need to check ZAR support
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Paystack recipient error:', error);
    return { success: false, error: error.message };
  }
}

// Initiate a transfer (payout to creator)
export async function initiateTransfer(amount, recipientCode, reference) {
  try {
    const response = await paystack.transfer.create({
      source: 'balance',
      amount: amount * 100,
      recipient: recipientCode,
      reference
    });
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Paystack transfer error:', error);
    return { success: false, error: error.message };
  }
}
