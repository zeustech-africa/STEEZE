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
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Content Security Policy
import { cspMiddleware } from './middleware/csp.js';
app.use(cspMiddleware);

// CDN CACHE HEADERS for static assets
import { setCacheHeaders } from './middleware/cache.js';
app.use('/uploads', setCacheHeaders, express.static(path.join(__dirname, 'uploads')));

// --- ROUTES ---
import adminRoutes from './routes/admin.js';
import adminUsersRoutes from './routes/admin/users.js';
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

app.use('/api/admin', adminRoutes);
app.use('/api/admin/users', adminUsersRoutes);
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