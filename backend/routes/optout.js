import express from 'express';
import { unsubscribe, getUserOptOutStatus, createOptOutRecord } from '../services/optout.js';

const router = express.Router();

// One-click unsubscribe (from email link — no login required)
router.post('/unsubscribe', async (req, res) => {
  const { token } = req.query;
  const ip = req.ip;
  const userAgent = req.headers['user-agent'];

  if (!token) {
    return res.status(400).json({ success: false, message: 'Missing unsubscribe token' });
  }

  const result = await unsubscribe(token, ip, userAgent);
  res.json(result);
});

// Get user's opt-out status (requires login)
router.get('/status', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const status = await getUserOptOutStatus(req.user.id);
  res.json({ success: true, status });
});

// Opt-out from settings (requires login)
router.post('/opt-out', async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'Not authenticated' });
  }

  const { consentType } = req.body; // email_marketing, sms_marketing, push_notifications, all
  const ip = req.ip;
  const userAgent = req.headers['user-agent'];

  await createOptOutRecord(req.user.email, consentType, 'settings_page', ip, userAgent, req.user.id);

  res.json({ success: true, message: `Opted out of ${consentType}` });
});

export default router;