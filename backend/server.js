import 'dotenv/config';
import { initSentry } from './services/sentry.js';
initSentry();
import http from 'http';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import path from 'path';
import { fileURLToPath } from 'url';
import { authenticateToken } from './middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Security headers
app.use(helmet({
  contentSecurityPolicy: false, // Disable helmet's default CSP (we use custom)
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
}));
app.use(cors({
  origin: [process.env.FRONTEND_URL || 'http://localhost:3000', 'https://steeze-weld.vercel.app'],
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// TEMPORARY DEBUG - Remove immediately after fixing
app.get('/api/auth/debug-secret-full', (req, res) => {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  res.json({
    fullKey: secret,
    length: secret ? secret.length : 0
  });
});

// Content Security Policy
import { cspMiddleware } from './middleware/csp.js';
app.use(cspMiddleware);

// CDN CACHE HEADERS for static assets
import { setCacheHeaders } from './middleware/cache.js';
app.use('/uploads', setCacheHeaders, express.static(path.join(__dirname, 'uploads')));

// --- ROUTES ---
import adminRoutes from './routes/admin.js';
import adminUsersRoutes from './routes/admin/users.js';
import adminUserManagementRoutes from './routes/admin/userManagement.js';
import adminNotesRoutes from './routes/admin/notes.js';
import adminStrikesRoutes from './routes/admin/strikes.js';
import adminAppealsRoutes from './routes/admin/appeals.js';
import adminCopyrightRoutes from './routes/admin/copyright.js';
import adminLegalRoutes from './routes/admin/legal.js';
import adminStatsRoutes from './routes/admin/stats.js';
import adminAnalyticsRoutes from './routes/admin/analytics.js';
import adminFraudRoutes from './routes/admin/fraud.js';
import adminFeatureRoutes from './routes/admin/features.js';
import adminAIModerationRoutes from './routes/admin/aiModeration.js';
import adminMediaOpsRoutes from './routes/admin/mediaOps.js';
import adminSearchRoutes from './routes/admin/search.js';
import adminRetentionRoutes from './routes/admin/retention.js';
import adminAnalyticsV2Routes from './routes/admin/analyticsV2.js';
import adminContentRoutes from './routes/admin/content.js';
import authRoutes from './routes/auth.js';
import creatorsRoutes from './routes/creators.js';
import vibesRoutes from './routes/vibes.js';
import feedRoutes from './routes/feed.js';
import postsRoutes from './routes/posts.js';
import notificationsRoutes from './routes/notifications.js';
import webhooksRoutes from './routes/webhooks.js';
import paymentRoutes from './routes/payment.js';
import subscriptionPaystackRoutes from './routes/subscriptionPaystack.js';
import paystackWebhookRoutes from './routes/paystackWebhook.js';

app.use('/api/admin', authenticateToken, adminRoutes);
app.use('/api/admin/users', authenticateToken, adminUsersRoutes);
app.use('/api/admin/users', adminUserManagementRoutes);
app.use('/api/admin/notes', adminNotesRoutes);
app.use('/api/admin/strikes', adminStrikesRoutes);
app.use('/api/admin/appeals', adminAppealsRoutes);
app.use('/api/admin/copyright', adminCopyrightRoutes);
app.use('/api/admin/legal', adminLegalRoutes);
app.use('/api/admin/stats', adminStatsRoutes);
app.use('/api/admin/analytics', adminAnalyticsRoutes);
app.use('/api/admin/fraud', adminFraudRoutes);
app.use('/api/admin/features', adminFeatureRoutes);
app.use('/api/admin/ai-moderation', adminAIModerationRoutes);
app.use('/api/admin/media', adminMediaOpsRoutes);
app.use('/api/admin/search', adminSearchRoutes);
app.use('/api/admin/retention', adminRetentionRoutes);
app.use('/api/admin/analytics-v2', adminAnalyticsV2Routes);
app.use('/api/admin/fraud', adminFraudRoutes);
app.use('/api/admin/content', adminContentRoutes);
app.use('/api/admin/users', adminUserManagementRoutes);
app.use('/api/admin/users', adminUserManagementRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/creators', creatorsRoutes);
app.use('/api/vibes', vibesRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/posts', postsRoutes);
app.use('/api/notifications', notificationsRoutes);
app.use('/api/webhooks', webhooksRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/subscription-paystack', subscriptionPaystackRoutes);
app.use('/api/webhooks', paystackWebhookRoutes);

// Health check

// Public feature flag check (no auth required)
app.get('/api/features/:key', async (req, res) => {
  try {
    const { key } = req.params;
    const { isFeatureEnabled } = await import('./services/featureFlagService.js');
    const enabled = await isFeatureEnabled(key);
    res.json({ success: true, key, enabled });
  } catch (error) {
    console.error('Check feature error:', error);
    res.status(500).json({ success: false, message: 'Failed to check feature' });
  }
});
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// --- GLOBAL ERROR HANDLING ---
import logger from './utils/logger.js';

// Handle 404 - Route not found
app.use((req, res) => {
  logger.warn(`404 - Route not found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({ success: false, message: 'Route not found' });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error', err);
  const statusCode = err.statusCode || err.status || 500;
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message || 'Something went wrong!';
  res.status(statusCode).json({ success: false, message });
});

// --- CREATE HTTP SERVER & INIT SOCKET.IO ---
import { initSocket } from './socket.js';

const server = http.createServer(app);
initSocket(server);

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ STEEZE Backend running on port ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
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

export default app;