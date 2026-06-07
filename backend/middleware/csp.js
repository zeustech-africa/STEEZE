// Content Security Policy middleware
export function cspMiddleware(req, res, next) {
  const cspDirectives = {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Required for Next.js inline scripts
      "'unsafe-eval'",   // Required for development
      'https://js.stripe.com',
      'https://checkout.paystack.com',
      'https://www.google.com/recaptcha/',
      'https://www.gstatic.com/recaptcha/',
    ],
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", 'data:', 'https:', 'http:'],
    'font-src': ["'self'", 'https://fonts.gstatic.com', 'data:'],
    'connect-src': [
      "'self'",
      'https://api.paystack.co',
      'https://api.stripe.com',
      'https://sentry.io',
      'wss://*.steeze.com',
      'https://api.zeustechafrica.com'
    ],
    'frame-src': [
      "'self'",
      'https://js.stripe.com',
      'https://paystack.com',
      'https://www.google.com/recaptcha/',
    ],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'upgrade-insecure-requests': process.env.NODE_ENV === 'production' ? [] : null,
  };

  // Build CSP header string
  const cspString = Object.entries(cspDirectives)
    .filter(([_, value]) => value && value.length > 0)
    .map(([key, value]) => `${key} ${value.join(' ')}`)
    .join('; ');

  res.setHeader('Content-Security-Policy', cspString);
  next();
}