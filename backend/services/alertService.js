import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

// Email transporter for alerts
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT, 10) || 587,
  secure: process.env.SMTP_PORT === '465',
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// Send alert to admin emails
export async function sendAlert(type, message, details = {}) {
  const adminEmails = process.env.ADMIN_ALERT_EMAILS?.split(',') || [];

  // Log to database
  await prisma.securityAlert.create({
    data: {
      type,
      message,
      details: JSON.stringify(details),
      severity: type === 'critical' ? 'high' : 'medium',
      status: 'new',
    },
  }).catch(() => {});

  // Send email to admins (skip if no transport configured)
  if (adminEmails.length === 0 || !process.env.SMTP_HOST) return;

  for (const email of adminEmails) {
    await transporter.sendMail({
      from: `"STEEZE Security" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `🚨 STEEZE Security Alert: ${type}`,
      html: `
        <h2>Security Alert</h2>
        <p><strong>Type:</strong> ${type}</p>
        <p><strong>Message:</strong> ${message}</p>
        <p><strong>Time:</strong> ${new Date().toISOString()}</p>
        <pre>${JSON.stringify(details, null, 2)}</pre>
        <hr>
        <p><a href="${process.env.APP_URL}/admin/security">View in Admin Control Room</a></p>
      `,
    }).catch(() => {});
  }
}

// Detect and alert on suspicious login
export async function checkSuspiciousLogin(userId, ip, userAgent) {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;

    // Get last 5 login locations
    const recentLogins = await prisma.loginHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
    });

    // Check for new location/country
    const previousCountries = [...new Set(recentLogins.map((l) => l.country).filter(Boolean))];
    const currentCountry = await getCountryFromIP(ip);

    if (previousCountries.length > 0 && previousCountries.includes(currentCountry) === false) {
      await sendAlert(
        'new_location_login',
        `New login from ${currentCountry || 'unknown location'} for user ${user.email}`,
        { userId, ip, country: currentCountry, userAgent },
      );
    }

    // Log this login
    await prisma.loginHistory.create({
      data: {
        userId,
        ip,
        userAgent,
        country: currentCountry,
        timestamp: new Date(),
      },
    });
  } catch {
    // Silently fail - don't block login
  }
}

async function getCountryFromIP(ip) {
  // Use a geolocation service or return null
  // For now, return null
  return null;
}