// Cloudflare Turnstile CAPTCHA validation
const VERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';

export async function verifyTurnstile(token, ip) {
  if (!token) {
    return { success: false, error: 'CAPTCHA token missing' };
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.warn('TURNSTILE_SECRET_KEY not configured');
    return { success: true }; // Allow in dev if not configured
  }

  try {
    const formData = new FormData();
    formData.append('secret', secret);
    formData.append('response', token);
    if (ip) formData.append('remoteip', ip);

    const response = await fetch(VERIFY_URL, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();
    console.log('Cloudflare Turnstile response:', JSON.stringify(data, null, 2));
    return { success: data.success, error: data['error-codes']?.join(', ') };
  } catch (error) {
    console.error('CAPTCHA verification error:', error);
    return { success: false, error: 'CAPTCHA verification failed' };
  }
}

// Middleware to require CAPTCHA on specific routes
export function requireCaptcha() {
  return async (req, res, next) => {
    // Bypass CAPTCHA in test and development environments
    if (process.env.NODE_ENV === 'test' || process.env.NODE_ENV === 'development' || !process.env.NODE_ENV) {
      return next();
    }

    const token = req.body.cfTurnstileResponse || req.headers['cf-turnstile-response'];

    if (!token) {
      return res.status(400).json({ error: 'CAPTCHA verification required' });
    }

    if (!token) {
      return res.status(400).json({ error: 'CAPTCHA verification required' });
    }

    const verification = await verifyTurnstile(token, req.ip);

    if (!verification.success) {
      return res.status(400).json({ error: 'CAPTCHA verification failed. Please try again.' });
    }

    next();
  };
}