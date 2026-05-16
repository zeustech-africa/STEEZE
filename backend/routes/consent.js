import express from 'express';
import { recordConsent, withdrawConsent, getUserConsents } from '../services/consent.js';
import { authenticateAny as auth } from '../middleware/auth.js';

const router = express.Router();

// Get user's current consent preferences
router.get('/', auth, async (req, res) => {
  try {
    const consents = await getUserConsents(req.user.id);
    res.json({ success: true, consents });
  } catch (error) {
    console.error('Error fetching consents:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch consent preferences' });
  }
});

// Update consent preferences
router.post('/', auth, async (req, res) => {
  try {
    const { email_marketing, sms_marketing, push_notifications, analytics } = req.body;
    const ip = req.ip || req.connection.remoteAddress;
    const userAgent = req.headers['user-agent'] || 'unknown';

    // Record or withdraw each consent type
    if (email_marketing !== undefined) {
      if (email_marketing) {
        await recordConsent(req.user.id, 'email_marketing', 'settings', ip, userAgent);
      } else {
        await withdrawConsent(req.user.id, 'email_marketing', ip, userAgent);
      }
    }

    if (sms_marketing !== undefined) {
      if (sms_marketing) {
        await recordConsent(req.user.id, 'sms_marketing', 'settings', ip, userAgent);
      } else {
        await withdrawConsent(req.user.id, 'sms_marketing', ip, userAgent);
      }
    }

    if (push_notifications !== undefined) {
      if (push_notifications) {
        await recordConsent(req.user.id, 'push_notifications', 'settings', ip, userAgent);
      } else {
        await withdrawConsent(req.user.id, 'push_notifications', ip, userAgent);
      }
    }

    // Analytics consent
    if (analytics !== undefined) {
      if (analytics) {
        await recordConsent(req.user.id, 'analytics', 'settings', ip, userAgent);
      } else {
        await withdrawConsent(req.user.id, 'analytics', ip, userAgent);
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error updating consents:', error);
    res.status(500).json({ success: false, error: 'Failed to update consent preferences' });
  }
});

export default router;