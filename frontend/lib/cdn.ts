/**
 * CDN Utility Library — STEEZE
 *
 * Provides optimized image URL generation, CDN health status queries,
 * and failover-aware asset URL resolution for the frontend.
 */

// ─── Types ───────────────────────────────────────────────────────────────────

export interface CDNOptions {
  width?: number;
  height?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
}

export interface CDNEndpoint {
  name: string;
  url: string;
  priority: number;
  isActive: boolean;
}

export interface CDNStatus {
  activeCDN: string;
  activeCDNName: string;
  endpoints: Record<string, CDNEndpoint>;
  lastHealthCheck: string;
  healthCheckIntervalMs: number;
  timestamp: string;
}

// ─── Constants ───────────────────────────────────────────────────────────────

const R2_PUBLIC_URL =
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
  'https://pub-84198ca15564cde3343014d06849cf09.r2.dev';

const CDN_CUSTOM_DOMAIN = process.env.NEXT_PUBLIC_CDN_CUSTOM_DOMAIN || '';

// ─── URL Helpers ─────────────────────────────────────────────────────────────

/**
 * Strip leading slash and trailing whitespace from a path segment.
 */
function sanitizePath(path: string): string {
  return path.replace(/^\/+/, '').replace(/\/+$/, '');
}

/**
 * Returns the best CDN base URL for the current session.
 * On the client, this is determined by the active CDN reported from the backend.
 * Falls back to the primary R2 public bucket URL.
 */
export function getCDNBaseUrl(): string {
  // In SSR contexts where window is not available, default to R2
  if (typeof window === 'undefined') {
    return CDN_CUSTOM_DOMAIN || R2_PUBLIC_URL;
  }

  // Check for a previously cached active CDN in sessionStorage
  try {
    const cached = sessionStorage.getItem('steeze_active_cdn_url');
    if (cached) return cached;
  } catch {
    // sessionStorage not available (private browsing, etc.)
  }

  return CDN_CUSTOM_DOMAIN || R2_PUBLIC_URL;
}

/**
 * Build a full CDN URL for a given asset path.
 *
 * @example
 *   getCDNUrl('uploads/profiles/abc123.webp')
 *   // → 'https://pub-xxx.r2.dev/uploads/profiles/abc123.webp'
 */
export function getCDNUrl(path: string): string {
  if (!path) return '/images/placeholder.jpg';

  // If already an absolute URL, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const base = getCDNBaseUrl().replace(/\/$/, '');
  const clean = sanitizePath(path);
  return `${base}/${clean}`;
}

// ─── Image Optimization ──────────────────────────────────────────────────────

/**
 * Generate an optimized image URL with Cloudflare Image Resizing parameters.
 * Works when the R2 bucket is fronted by a Cloudflare-proxied domain (orange cloud).
 *
 * @param url       - Original (or CDN) image URL
 * @param options   - width, height, quality, and desired output format
 *
 * @example
 *   getOptimizedImageUrl('https://cdn.steeze.com/uploads/pic.jpg', { width: 400, format: 'webp' })
 */
export function getOptimizedImageUrl(
  url: string,
  options: CDNOptions = {}
): string {
  if (!url) return '/images/placeholder.jpg';

  const { width, height, quality = 80, format = 'auto' } = options;

  // Only apply Cloudflare Image Resizing if the URL goes through Cloudflare
  const isCloudflareProxied =
    url.includes('r2.dev') ||
    url.includes('cdn.steeze.com') ||
    url.includes('steeze.b-cdn.net');

  if (isCloudflareProxied) {
    const params = new URLSearchParams();

    if (width) params.set('width', String(width));
    if (height) params.set('height', String(height));
    if (quality && quality !== 80) params.set('quality', String(quality));
    if (format === 'webp') params.set('format', 'webp');
    else if (format === 'avif') params.set('format', 'avif');

    const queryString = params.toString();
    if (queryString) {
      return url.includes('?')
        ? `${url}&${queryString}`
        : `${url}?${queryString}`;
    }
  }

  // Fallback: Next.js Image Optimization (handled by next/image component, not URL params)
  return url;
}

// ─── Responsive Image SrcSet Generator ───────────────────────────────────────

/**
 * Generate a srcSet string for responsive images using multiple widths.
 *
 * @param url     - Base image URL
 * @param widths  - Array of desired widths in pixels
 *
 * @example
 *   generateSrcSet('https://cdn.steeze.com/pic.jpg', [320, 640, 1080])
 *   // → '…/pic.jpg?width=320 320w, …/pic.jpg?width=640 640w, …/pic.jpg?width=1080 1080w'
 */
export function generateSrcSet(url: string, widths: number[]): string {
  return widths
    .map((w) => {
      const optimized = getOptimizedImageUrl(url, {
        width: w,
        format: 'webp',
        quality: 80,
      });
      return `${optimized} ${w}w`;
    })
    .join(', ');
}

// ─── CDN Health & Status ─────────────────────────────────────────────────────

/**
 * Fetch the current CDN health status from the backend API.
 * Caches the active CDN URL in sessionStorage for failover-aware resolution.
 */
export async function getCDNStatus(): Promise<CDNStatus | null> {
  try {
    const res = await fetch('/api/cdn/status', {
      // Use short cache on the fetch itself
      headers: { 'Cache-Control': 'max-age=30' },
    });

    if (!res.ok) {
      console.error('[CDN Lib] Failed to fetch CDN status:', res.status);
      return null;
    }

    const data = await res.json();

    if (data.success && data.status) {
      const status: CDNStatus = data.status;

      // Cache the active CDN URL in sessionStorage for immediate use
      if (status.activeCDN && status.endpoints?.[status.activeCDN]?.url) {
        try {
          sessionStorage.setItem(
            'steeze_active_cdn_name',
            status.activeCDNName
          );
          sessionStorage.setItem(
            'steeze_active_cdn_url',
            status.endpoints[status.activeCDN].url
          );
        } catch {
          // sessionStorage not available
        }
      }

      return status;
    }

    return null;
  } catch (error) {
    console.error('[CDN Lib] Failed to get CDN status:', error);
    return null;
  }
}

/**
 * Quick check: is the CDN currently healthy?
 * Healthy = active CDN is either primary (R2) or secondary (Cloudflare custom domain).
 */
export async function isCDNHealthy(): Promise<boolean> {
  const status = await getCDNStatus();
  if (!status) return true; // assume healthy if we can't check
  return status.activeCDN === 'primary' || status.activeCDN === 'secondary';
}

/**
 * Get the name of the currently active CDN for display purposes.
 */
export function getActiveCDNName(): string | null {
  try {
    return sessionStorage.getItem('steeze_active_cdn_name');
  } catch {
    return null;
  }
}