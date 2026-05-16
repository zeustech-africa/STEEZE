import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
// --- CDN CACHE HEADERS for static assets ---
import { setCacheHeaders } from './middleware/cache.js';
app.use('/uploads', setCacheHeaders, express.static(path.join(__dirname, 'uploads')));


// --- PHASE 1 SECURITY MIDDLEWARE ---
// Rate limiting & brute force protection
import { apiLimiter, authLimiter, passwordResetLimiter } from './middleware/rateLimiter.js';
app.use('/api', apiLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);
app.use('/api/auth/reset-password', passwordResetLimiter);

// Bot detection
import { detectBot } from './middleware/botDetection.js';
app.use(detectBot);

// API security - input sanitization
import { sanitizeInput } from './middleware/apiSecurity.js';
app.use(sanitizeInput);

// Session management
import { sessionMiddleware } from './middleware/session.js';
app.use(sessionMiddleware);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), message: 'STEEZE Backend Running' });
});

// --- ROUTES ---
import adminRoutes from './routes/admin.js';
import authRoutes from './routes/auth.js';
import creatorsRoutes from './routes/creators.js';
import vibesRoutes from './routes/vibes.js';
import feedRoutes from './routes/feed.js';
import postsRoutes from './routes/posts.js';
import notificationsRoutes from './routes/notifications.js';
import webhooksRoutes from './routes/webhooks.js';
import ageVerificationRoutes from './routes/ageVerification.js';
import dataExportRoutes from './routes/dataExport.js';
import consentRoutes from './routes/consent.js';
import optoutRoutes from './routes/optout.js';
import cdnRoutes from './routes/cdn.js';
import analyticsRoutes from './routes/analytics.js';
import paymentsRoutes from './routes/payments.js';

app.use('/api/admin', adminRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/creators', creatorsRoutes);
app.use('/api/vibes', vibesRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/age-verification', ageVerificationRoutes);
app.use('/api/data-export', dataExportRoutes);
app.use('/api/consent', consentRoutes);
app.use('/api/optout', optoutRoutes);
app.use('/api/cdn', cdnRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/payments', paymentsRoutes);

// --- PHASE 1 SECURITY ROUTES ---
import sessionsRoutes from './routes/sessions.js';
app.use('/api/sessions', sessionsRoutes);

import twoFARoutes from './routes/2fa.js';
app.use('/api/2fa', twoFARoutes);

import accountRoutes from './routes/account.js';
app.use('/api/account', accountRoutes);

import reportsRoutes from './routes/reports.js';
app.use('/api/reports', reportsRoutes);

// --- PHASE 2B: ZEUSLIVESTUDIO MANAGEMENT ---
import { requireFeatureAccess } from './middleware/featureAccess.js';

app.use('/api/creators/upload', requireFeatureAccess());
app.use('/api/creators/post', requireFeatureAccess());
app.use('/api/distribution', requireFeatureAccess());

import contractRoutes from './routes/contracts.js';
app.use('/api/contracts', contractRoutes);

// --- GLOBAL ERROR HANDLING (TASK 9) ---
import logger from './utils/logger.js';

// Handle 404 - Route not found
app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`, {
    type: '404',
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
  });
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', err, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userId: req.user?.id,
  });

  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message || 'Something went wrong!';

  res.status(statusCode).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});

// --- CDN HEALTH MONITORING CRON JOB (every 60 seconds) ---
import cron from 'node-cron';
import { updateCDNHealth } from './services/cdn.js';

cron.schedule('* * * * *', async () => {
  try {
    await updateCDNHealth();
  } catch (err) {
    console.error('[CRON] CDN health check failed:', err.message);
  }
});

// Daily analytics generation at midnight
import { generateDailyAnalytics } from './services/analytics.js';

cron.schedule('0 0 * * *', async () => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    await generateDailyAnalytics();
    console.log('[CRON] Daily analytics generated for', yesterday.toISOString().split('T')[0]);
  } catch (err) {
    console.error('[CRON] Daily analytics generation failed:', err.message);
  }
});

// --- CREATE HTTP SERVER & INIT SOCKET.IO (TASK 4) ---
import { initSocket } from './socket.js';

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ STEEZE Backend running on port ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
  console.log(`📍 Creators API: http://localhost:${PORT}/api/creators/signup`);
  console.log(`📍 VIBES API: http://localhost:${PORT}/api/vibes/signup`);
  console.log(`📍 Webhooks: http://localhost:${PORT}/api/webhooks/payfast`);
  console.log(`📍 Age Verification: http://localhost:${PORT}/api/age-verification`);
  console.log(`📍 Opt-Out: http://localhost:${PORT}/api/optout`);
  console.log(`📍 Socket.io: ws://localhost:${PORT}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});