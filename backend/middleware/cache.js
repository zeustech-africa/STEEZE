/**
 * Cache-Control middleware for static assets and dynamic content.
 *
 * Key caching tiers:
 *  - Images & fonts: 1 year (immutable — versioned by content hash)
 *  - CSS & JS: 1 week with stale-while-revalidate (24 h grace)
 *  - Default static: 1 hour
 *  - Dynamic/API: no-store (applied explicitly on route handlers)
 */

// ─── Static asset cache rules ────────────────────────────────────────────────

const CACHE_RULES = [
  // Images — 1 year immutable (recommended with content-hash filenames)
  {
    pattern: /\.(jpg|jpeg|png|gif|webp|avif|svg|ico)$/i,
    cacheControl: 'public, max-age=31536000, immutable',
  },
  // Fonts — 1 year immutable
  {
    pattern: /\.(woff2?|ttf|eot|otf)$/i,
    cacheControl: 'public, max-age=31536000, immutable',
  },
  // CSS & JS — 1 week with stale-while-revalidate
  {
    pattern: /\.(css|js|mjs)$/i,
    cacheControl: 'public, max-age=604800, stale-while-revalidate=86400',
  },
  // Media (video/audio) — 30 days
  {
    pattern: /\.(mp4|webm|ogg|mp3|wav|flac|aac)$/i,
    cacheControl: 'public, max-age=2592000',
  },
  // JSON / manifest — 1 hour
  {
    pattern: /\.(json|xml|txt)$/i,
    cacheControl: 'public, max-age=3600',
  },
];

/**
 * Middleware that sets appropriate Cache-Control headers based on file extension.
 * Apply before static file serving middleware (e.g., express.static).
 *
 * Usage:
 *   app.use('/uploads', setCacheHeaders, express.static(uploadsDir));
 *   app.use('/_next/static', setCacheHeaders);
 */
export const setCacheHeaders = (req, res, next) => {
  const requestPath = req.path || '';

  for (const rule of CACHE_RULES) {
    if (rule.pattern.test(requestPath)) {
      res.setHeader('Cache-Control', rule.cacheControl);
      break;
    }
  }

  // Enable CDN negotiation via Vary header
  res.setHeader('Vary', 'Accept-Encoding, Origin');

  // Remove sensitive server fingerprint headers (already handled by helmet, but belt-and-suspenders)
  res.removeHeader('X-Powered-By');

  next();
};

/**
 * Middleware that prevents caching for dynamic/private content.
 * Apply on routes that return user-specific or authentication-dependent data.
 *
 * Usage:
 *   router.get('/profile', setNoCache, profileHandler);
 */
export const setNoCache = (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
};

/**
 * Middleware for short-lived public caching (e.g., CDN-friendly API responses).
 *
 * @param {number} maxAgeSeconds - Cache TTL in seconds (default 60)
 *
 * Usage:
 *   router.get('/trending', setShortCache(120), trendingHandler);
 */
export const setShortCache = (maxAgeSeconds = 60) => {
  return (req, res, next) => {
    res.setHeader('Cache-Control', `public, max-age=${maxAgeSeconds}, stale-while-revalidate=${Math.floor(maxAgeSeconds / 2)}`);
    res.setHeader('Vary', 'Accept-Encoding, Origin');
    next();
  };
};

export default { setCacheHeaders, setNoCache, setShortCache };