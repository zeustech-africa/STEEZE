import 'dotenv/config';
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
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
app.use(morgan('dev'));

// Import all routes (simplified for testing)
import authRoutes from './routes/auth.js';
app.use('/api/auth', authRoutes);

import userRoutes from './routes/user.js';
app.use('/api', userRoutes);

// Payment routes
import paymentRoutes from './routes/payment.js';
app.use('/api/payment', paymentRoutes);

// Subscription Paystack routes
import subscriptionPaystackRoutes from './routes/subscriptionPaystack.js';
app.use('/api/subscription-paystack', subscriptionPaystackRoutes);

// Upload routes
import uploadRoutes from './routes/upload.js';
app.use('/api', uploadRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default app;