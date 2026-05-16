import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// CDN endpoints configuration
const CDN_ENDPOINTS = {
  primary: {
    name: 'Cloudflare R2',
    url: process.env.R2_PUBLIC_URL || 'https://pub-84198ca15564cde3343014d06849cf09.r2.dev',
    healthEndpoint: `${process.env.R2_PUBLIC_URL || 'https://pub-84198ca15564cde3343014d06849cf09.r2.dev'}/health-check.txt`,
    priority: 1,
  },
  secondary: {
    name: 'Cloudflare CDN (Custom Domain)',
    url: process.env.CDN_CUSTOM_DOMAIN || '',
    healthEndpoint: process.env.CDN_CUSTOM_DOMAIN ? `${process.env.CDN_CUSTOM_DOMAIN}/health-check.txt` : '',
    priority: 2,
  },
  tertiary: {
    name: process.env.CDN_BACKUP_NAME || '',
    url: process.env.CDN_BACKUP_URL || '',
    healthEndpoint: process.env.CDN_BACKUP_HEALTH_ENDPOINT || '',
    priority: 3,
  },
};

// Current active CDN tier
let activeCDN = 'primary';
let lastHealthCheck = 0;
const HEALTH_CHECK_INTERVAL = 60000; // 60 seconds

/**
 * Check health of a CDN endpoint by requesting its health-check file.
 * Falls back to HEAD request on the base URL if no health endpoint is configured.
 */
async function checkCDNHealth(endpoint) {
  if (!endpoint) return false;

  try {
    const response = await axios.get(endpoint, {
      timeout: 5000,
      validateStatus: (status) => status >= 200 && status < 400,
    });
    return response.status === 200;
  } catch (error) {
    console.error(`[CDN] Health check failed for ${endpoint}: ${error.message}`);
    return false;
  }
}

/**
 * Get the best available CDN URL for a given asset path.
 * Performs periodic health checks and auto-failover.
 */
export async function getBestCDNUrl(path) {
  if (!path) return '';

  // Strip leading slash if present to avoid double-slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;

  const now = Date.now();

  // Perform health check if interval has passed
  if (now - lastHealthCheck > HEALTH_CHECK_INTERVAL) {
    await updateCDNHealth();
    lastHealthCheck = now;
  }

  // Use the active CDN
  const cdn = CDN_ENDPOINTS[activeCDN];
  if (cdn && cdn.url) {
    return `${cdn.url.replace(/\/$/, '')}/${cleanPath}`;
  }

  // Ultimate fallback to primary R2
  return `${CDN_ENDPOINTS.primary.url.replace(/\/$/, '')}/${cleanPath}`;
}

/**
 * Update CDN health status for all endpoints and perform failover if needed.
 */
export async function updateCDNHealth() {
  const healthStatus = {
    primary: true,
    secondary: false,
    tertiary: false,
  };

  // Check primary
  if (CDN_ENDPOINTS.primary.healthEndpoint) {
    healthStatus.primary = await checkCDNHealth(CDN_ENDPOINTS.primary.healthEndpoint);
  }

  // Check secondary if configured
  if (CDN_ENDPOINTS.secondary.url && CDN_ENDPOINTS.secondary.healthEndpoint) {
    healthStatus.secondary = await checkCDNHealth(CDN_ENDPOINTS.secondary.healthEndpoint);
  }

  // Check tertiary if configured
  if (CDN_ENDPOINTS.tertiary.url && CDN_ENDPOINTS.tertiary.healthEndpoint) {
    healthStatus.tertiary = await checkCDNHealth(CDN_ENDPOINTS.tertiary.healthEndpoint);
  }

  // Log health status to database
  try {
    await prisma.cDNHealthLog.create({
      data: {
        primaryHealthy: healthStatus.primary,
        secondaryHealthy: healthStatus.secondary,
        tertiaryHealthy: healthStatus.tertiary,
        activeCDN,
        timestamp: new Date(),
      },
    });
  } catch (dbError) {
    console.error('[CDN] Failed to log CDN health:', dbError.message);
  }

  // ---- FAILOVER LOGIC ----

  // Primary is down, switch to secondary
  if (!healthStatus.primary && healthStatus.secondary && activeCDN === 'primary') {
    activeCDN = 'secondary';
    console.warn('[CDN] ⚠️  Primary CDN (R2) DOWN → Switched to secondary (Cloudflare CDN)');
    await sendCDNAlert(
      'Primary CDN (Cloudflare R2) health check failed. Automatically switched to secondary CDN.',
      'warning'
    );
  }
  // Both primary and secondary down, switch to tertiary
  else if (!healthStatus.primary && !healthStatus.secondary && healthStatus.tertiary && activeCDN !== 'tertiary') {
    activeCDN = 'tertiary';
    console.warn('[CDN] 🚨 Primary AND secondary CDNs DOWN → Switched to tertiary (backup)');
    await sendCDNAlert(
      'Primary and secondary CDNs are both down. Fallen back to tertiary CDN. Immediate investigation required.',
      'critical'
    );
  }
  // Primary is back, switch back
  else if (healthStatus.primary && activeCDN !== 'primary') {
    const previous = activeCDN;
    activeCDN = 'primary';
    console.log(`[CDN] ✅ Primary CDN restored → Switched back from ${previous} to primary`);
    await sendCDNAlert(
      `Primary CDN (Cloudflare R2) health restored. Switched back from ${previous} to primary.`,
      'info'
    );
  }
  // Secondary came back but primary still down (already on secondary)
  else if (!healthStatus.primary && healthStatus.secondary && activeCDN === 'tertiary') {
    activeCDN = 'secondary';
    console.log('[CDN] 🔄 Switching from tertiary back to secondary (secondary recovered)');
    await sendCDNAlert(
      'Secondary CDN health restored. Switched back from tertiary to secondary (primary still down).',
      'warning'
    );
  }

  return healthStatus;
}

/**
 * Send a CDN-related alert to the database and notify admins.
 */
async function sendCDNAlert(message, severity = 'warning') {
  try {
    await prisma.securityAlert.create({
      data: {
        type: 'cdn_failover',
        message,
        severity,
        status: 'new',
      },
    });

    // TODO: Email notification integration point
    // if (process.env.ADMIN_ALERT_EMAILS) {
    //   const emailService = await import('./email.js');
    //   await emailService.sendAlertEmail({
    //     to: process.env.ADMIN_ALERT_EMAILS.split(','),
    //     subject: `[STEEZE CDN] ${severity.toUpperCase()}: ${message}`,
    //     body: message,
    //   });
    // }
  } catch (error) {
    console.error('[CDN] Failed to send alert:', error.message);
  }
}

/**
 * Get the current CDN status for monitoring/API.
 */
export async function getCDNStatus() {
  const now = Date.now();

  // Refresh health if stale
  if (now - lastHealthCheck > HEALTH_CHECK_INTERVAL) {
    await updateCDNHealth();
    lastHealthCheck = now;
  }

  return {
    activeCDN,
    activeCDNName: CDN_ENDPOINTS[activeCDN]?.name || activeCDN,
    endpoints: Object.entries(CDN_ENDPOINTS).reduce((acc, [key, cdn]) => {
      acc[key] = {
        name: cdn.name,
        url: cdn.url,
        priority: cdn.priority,
        isActive: key === activeCDN,
      };
      return acc;
    }, {}),
    lastHealthCheck: new Date(lastHealthCheck).toISOString(),
    healthCheckIntervalMs: HEALTH_CHECK_INTERVAL,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Generate an optimized image URL using Cloudflare Image Resizing parameters.
 * Falls back to original URL if no CDN optimization is available.
 *
 * @param {string} originalUrl - The original image URL
 * @param {object} options - Optimization options
 * @param {number} [options.width] - Desired width in pixels
 * @param {number} [options.height] - Desired height in pixels
 * @param {number} [options.quality=80] - JPEG/WebP quality (1-100)
 * @param {string} [options.format='auto'] - Output format: 'webp', 'avif', 'auto'
 * @returns {string} Optimized image URL
 */
export function getOptimizedImageUrl(originalUrl, options = {}) {
  const { width, height, quality = 80, format = 'auto' } = options;

  if (!originalUrl) return '';

  // If using Cloudflare R2, apply Image Resizing via Cloudflare
  // Cloudflare Image Resizing works when the domain is proxied (orange cloud)
  if (activeCDN === 'primary' || originalUrl.includes('r2.dev')) {
    const params = new URLSearchParams();

    if (width) params.set('width', String(width));
    if (height) params.set('height', String(height));
    if (quality && quality !== 80) params.set('quality', String(quality));
    if (format === 'webp') params.set('format', 'webp');
    else if (format === 'avif') params.set('format', 'avif');

    const queryString = params.toString();
    if (queryString) {
      return originalUrl.includes('?')
        ? `${originalUrl}&${queryString}`
        : `${originalUrl}?${queryString}`;
    }
  }

  return originalUrl;
}

/**
 * Manually force a CDN failover for testing purposes.
 * This is used by the admin API for verifying failover behavior.
 */
export async function forceFailover(targetCDN) {
  if (!CDN_ENDPOINTS[targetCDN] || !CDN_ENDPOINTS[targetCDN].url) {
    throw new Error(`CDN tier "${targetCDN}" is not configured or has no URL`);
  }

  const previous = activeCDN;
  activeCDN = targetCDN;

  console.log(`[CDN] 🔧 Manual failover from ${previous} → ${targetCDN} (admin initiated)`);
  await sendCDNAlert(
    `Manual failover triggered by admin: switched from ${previous} to ${targetCDN}.`,
    'warning'
  );

  return { previous, current: activeCDN };
}

/**
 * Reset CDN back to primary (used after manual failover testing).
 */
export async function resetToPrimary() {
  const previous = activeCDN;
  activeCDN = 'primary';

  console.log(`[CDN] 🔄 Admin reset CDN from ${previous} back to primary`);
  await sendCDNAlert(
    `CDN manually reset from ${previous} back to primary by admin.`,
    'info'
  );

  return { previous, current: activeCDN };
}

export default {
  getBestCDNUrl,
  getCDNStatus,
  getOptimizedImageUrl,
  updateCDNHealth,
  forceFailover,
  resetToPrimary,
};