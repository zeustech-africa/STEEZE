import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import http from 'http';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Basic middleware
app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors());
app.use(express.json());
app.use(morgan('dev'));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Simple rate limiting (simplified)
app.use('/api', (req, res, next) => next());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), message: 'STEEZE Backend Running' });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ success: true, message: 'API is working!' });
});

// Import routes (with error handling)
try {
  const authRoutes = await import('./routes/auth.js');
  app.use('/api/auth', authRoutes.default);
  console.log('✅ Auth routes loaded');
} catch (err) {
  console.log('⚠️ Auth routes not loaded:', err.message);
}

try {
  const creatorsRoutes = await import('./routes/creators.js');
  app.use('/api/creators', creatorsRoutes.default);
  console.log('✅ Creators routes loaded');
} catch (err) {
  console.log('⚠️ Creators routes not loaded:', err.message);
}

try {
  const vibesRoutes = await import('./routes/vibes.js');
  app.use('/api/vibes', vibesRoutes.default);
  console.log('✅ VIBES routes loaded');
} catch (err) {
  console.log('⚠️ VIBES routes not loaded:', err.message);
}

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: 'Route not found' });
});

const server = http.createServer(app);
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`\n✅ STEEZE Backend running on port ${PORT}`);
  console.log(`📍 Health: http://localhost:${PORT}/health`);
  console.log(`📍 Test API: http://localhost:${PORT}/api/test`);
});
