import nodemailer from 'nodemailer';
import { generateUnsubscribeToken } from './optout.js';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587', 10),
  secure: process.env.SMTP_SECURE === 'true',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Generate unsubscribe link for email
function getUnsubscribeLink(email, consentType = 'email_marketing') {
  const token = generateUnsubscribeToken(email, consentType);
  return `${process.env.APP_URL}/unsubscribe?token=${token}`;
}

// Get preference center link
function getPreferenceCenterLink() {
  return `${process.env.APP_URL}/settings/consent`;
}

// Log email to database
async function logEmail(to, type, subject, status, userId = null, metadata = {}) {
  try {
    await prisma.emailLog.create({
      data: {
        userId,
        email: to,
        type,
        subject,
        status,
        metadata,
      },
    });
  } catch (err) {
    console.error('Failed to log email:', err.message);
  }
}

// Send marketing email with unsubscribe link (CAN-SPAM/POPIA compliant)
export async function sendMarketingEmail(to, subject, htmlContent, userId = null) {
  const unsubscribeLink = getUnsubscribeLink(to, 'email_marketing');
  const preferenceCenterLink = getPreferenceCenterLink();

  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0; padding:0; background-color:#000000; font-family: Arial, Helvetica, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000; padding:20px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#111111; border-radius:12px; overflow:hidden;">
              <!-- Header -->
              <tr>
                <td style="padding:30px 40px 0; text-align:center;">
                  <h1 style="color:#FFD700; font-size:28px; margin:0; font-weight:bold; letter-spacing:2px;">STEEZE</h1>
                  <p style="color:#888888; font-size:12px; margin:4px 0 0;">Powered by ZeusLiveStudio</p>
                </td>
              </tr>
              <!-- Content -->
              <tr>
                <td style="padding:30px 40px;">
                  ${htmlContent}
                </td>
              </tr>
              <!-- Footer with unsubscribe -->
              <tr>
                <td style="padding:20px 40px 30px; border-top:1px solid #222222;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="text-align:center;">
                        <p style="color:#666666; font-size:11px; margin:0 0 12px; line-height:1.5;">
                          You received this email because you subscribed to STEEZE marketing communications.<br>
                          This email was sent to ${to}.
                        </p>
                        <p style="margin:0 0 8px;">
                          <a href="${unsubscribeLink}" style="color:#FFD700; font-size:12px; text-decoration:underline; font-weight:bold;">Unsubscribe from marketing emails</a>
                        </p>
                        <p style="margin:0 0 16px;">
                          <a href="${preferenceCenterLink}" style="color:#FFD700; font-size:12px; text-decoration:underline;">Manage all communication preferences</a>
                        </p>
                        <p style="color:#444444; font-size:10px; margin:0;">
                          &copy; ${new Date().getFullYear()} STEEZE &mdash; Powered by ZeusLiveStudio<br>
                          All rights reserved.
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"STEEZE" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: fullHtml,
    });

    await logEmail(to, 'marketing', subject, 'sent', userId);
    return { success: true };
  } catch (err) {
    console.error('Failed to send marketing email:', err.message);
    await logEmail(to, 'marketing', subject, 'bounced', userId, { error: err.message });
    return { success: false, error: err.message };
  }
}

// Send notification email (transactional — no unsubscribe legally required, but included for best practice)
export async function sendNotificationEmail(to, subject, htmlContent, userId = null) {
  const preferenceCenterLink = getPreferenceCenterLink();

  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0; padding:0; background-color:#000000; font-family: Arial, Helvetica, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000; padding:20px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#111111; border-radius:12px; overflow:hidden;">
              <tr>
                <td style="padding:30px 40px 0; text-align:center;">
                  <h1 style="color:#FFD700; font-size:28px; margin:0; font-weight:bold; letter-spacing:2px;">STEEZE</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:30px 40px;">
                  ${htmlContent}
                </td>
              </tr>
              <tr>
                <td style="padding:20px 40px 30px; border-top:1px solid #222222;">
                  <table width="100%" cellpadding="0" cellspacing="0">
                    <tr>
                      <td style="text-align:center;">
                        <p style="margin:0 0 8px;">
                          <a href="${preferenceCenterLink}" style="color:#FFD700; font-size:12px; text-decoration:underline;">Manage notification preferences</a>
                        </p>
                        <p style="color:#444444; font-size:10px; margin:0;">
                          &copy; ${new Date().getFullYear()} STEEZE &mdash; Powered by ZeusLiveStudio
                        </p>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"STEEZE" <${process.env.SMTP_USER}>`,
      to,
      subject,
      html: fullHtml,
    });

    await logEmail(to, 'notification', subject, 'sent', userId);
    return { success: true };
  } catch (err) {
    console.error('Failed to send notification email:', err.message);
    await logEmail(to, 'notification', subject, 'bounced', userId, { error: err.message });
    return { success: false, error: err.message };
  }
}

// Send verification email (transactional — no unsubscribe needed)
export async function sendVerificationEmail(to, code, userId = null) {
  const verifyLink = `${process.env.APP_URL}/verify-email?code=${code}`;

  const fullHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin:0; padding:0; background-color:#000000; font-family: Arial, Helvetica, sans-serif;">
      <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#000000; padding:20px 0;">
        <tr>
          <td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#111111; border-radius:12px; overflow:hidden;">
              <tr>
                <td style="padding:30px 40px 0; text-align:center;">
                  <h1 style="color:#FFD700; font-size:28px; margin:0; font-weight:bold; letter-spacing:2px;">STEEZE</h1>
                </td>
              </tr>
              <tr>
                <td style="padding:30px 40px; text-align:center;">
                  <h2 style="color:#FFFFFF; font-size:22px; margin:0 0 12px;">Verify Your Email Address</h2>
                  <p style="color:#AAAAAA; font-size:14px; margin:0 0 24px; line-height:1.5;">
                    Welcome to STEEZE! Please verify your email address by clicking the button below.
                  </p>
                  <a href="${verifyLink}" style="display:inline-block; padding:14px 40px; background-color:#FFD700; color:#000000; text-decoration:none; border-radius:30px; font-weight:bold; font-size:16px;">Verify Email</a>
                  <p style="color:#666666; font-size:12px; margin:20px 0 0;">
                    Or copy and paste this link:<br>
                    <span style="color:#FFD700;">${verifyLink}</span>
                  </p>
                  <p style="color:#555555; font-size:11px; margin:16px 0 0;">
                    This link expires in 24 hours. If you did not create this account, you can safely ignore this email.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 40px 30px; border-top:1px solid #222222; text-align:center;">
                  <p style="color:#444444; font-size:10px; margin:0;">
                    &copy; ${new Date().getFullYear()} STEEZE &mdash; Powered by ZeusLiveStudio
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  try {
    await transporter.sendMail({
      from: `"STEEZE" <${process.env.SMTP_USER}>`,
      to,
      subject: 'Verify Your STEEZE Email Address',
      html: fullHtml,
    });

    await logEmail(to, 'verification', 'Verify Your STEEZE Email Address', 'sent', userId);
    return { success: true };
  } catch (err) {
    console.error('Failed to send verification email:', err.message);
    await logEmail(to, 'verification', 'Verify Your STEEZE Email Address', 'bounced', userId, { error: err.message });
    return { success: false, error: err.message };
  }
}

// Send welcome email
export async function sendWelcomeEmail(to, username, userId = null) {
  const unsubscribeLink = getUnsubscribeLink(to, 'email_marketing');
  const preferenceCenterLink = getPreferenceCenterLink();

  const htmlContent = `
    <h2 style="color:#FFFFFF; font-size:20px; margin:0 0 12px;">Welcome to STEEZE, ${username}!</h2>
    <p style="color:#AAAAAA; font-size:14px; margin:0 0 16px; line-height:1.6;">
      We're excited to have you on board. STEEZE is the verified entertainment platform powered by ZeusLiveStudio — where creators and fans connect through authentic, high-quality content.
    </p>
    <p style="color:#AAAAAA; font-size:14px; margin:0 0 24px; line-height:1.6;">
      Explore music, videos, live streams, and more from verified creators around the world.
    </p>
    <div style="text-align:center; margin-bottom:8px;">
      <a href="${process.env.APP_URL}/explore" style="display:inline-block; padding:12px 32px; background-color:#FFD700; color:#000000; text-decoration:none; border-radius:30px; font-weight:bold; font-size:14px;">Start Exploring</a>
    </div>
  `;

  return sendMarketingEmail(to, `Welcome to STEEZE, ${username}!`, htmlContent, userId);
}

// Send subscription confirmation email with cooling-off reminder
export async function sendSubscriptionConfirmation(to, creatorName, tier, price) {
  const cancelLink = `${process.env.APP_URL}/settings/subscriptions`;
  const termsLink = `${process.env.APP_URL}/terms`;

  const htmlContent = `
    <h2 style="color:#FFFFFF; font-size:20px; margin:0 0 12px;">Subscription Confirmed!</h2>
    <p style="color:#AAAAAA; font-size:14px; margin:0 0 16px; line-height:1.6;">
      You are now subscribed to <strong style="color:#FFD700;">${creatorName}</strong> for <strong style="color:#FFD700;">${tier.charAt(0).toUpperCase() + tier.slice(1)}</strong> (R${price}/month).
    </p>

    <div style="background:#1a1a1a; padding: 16px; border-left: 4px solid #FFD700; margin: 20px 0; border-radius: 4px;">
      <h3 style="color:#FFD700; font-size:15px; margin:0 0 10px; font-weight:bold;">Your Consumer Rights (7-day cooling-off period)</h3>
      <p style="color:#CCCCCC; font-size:13px; margin:0 0 8px; line-height:1.5;">
        Under the South African Consumer Protection Act (CPA), you have the right to cancel this subscription within <strong style="color:#FFD700;">7 days</strong> for a full refund — no penalty, no questions asked.
      </p>
      <p style="color:#CCCCCC; font-size:13px; margin:0 0 8px; line-height:1.5;">
        To cancel, visit your <a href="${cancelLink}" style="color:#FFD700; text-decoration:underline;">Subscription Settings</a> or email <a href="mailto:support@steeze.com" style="color:#FFD700; text-decoration:underline;">support@steeze.com</a> with your transaction ID.
      </p>
      <p style="color:#CCCCCC; font-size:13px; margin:0; line-height:1.5;">
        Refunds are processed within 30 days of cancellation. <a href="${termsLink}" style="color:#FFD700; text-decoration:underline;">View full terms</a>.
      </p>
    </div>

    <p style="color:#AAAAAA; font-size:14px; margin:0; line-height:1.6;">
      Thank you for supporting ${creatorName} on STEEZE!
    </p>
  `;

  try {
    await transporter.sendMail({
      from: `"STEEZE" <${process.env.SMTP_USER}>`,
      to,
      subject: `Subscription Confirmed: ${creatorName} - ${tier.charAt(0).toUpperCase() + tier.slice(1)}`,
      html: htmlContent,
    });

    console.log(`[Email] Subscription confirmation sent to ${to} for ${creatorName}`);
    return { success: true };
  } catch (err) {
    console.error('[Email] Failed to send subscription confirmation:', err.message);
    return { success: false, error: err.message };
  }
}

export default { sendMarketingEmail, sendNotificationEmail, sendVerificationEmail, sendWelcomeEmail, sendSubscriptionConfirmation };
