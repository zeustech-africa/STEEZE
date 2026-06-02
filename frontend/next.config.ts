import type { NextConfig } from "next";
const { withSentryConfig } = require('@sentry/nextjs');

const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
  buildExcludes: [/middleware-manifest\.json$/],
  fallbacks: {
    document: '/offline',
    image: '/images/offline-fallback.jpg',
  },
  runtimeCaching: [
    {
      urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'google-fonts',
        expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 365 },
      },
    },
    {
      urlPattern: /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm)$/i,
      handler: 'CacheFirst',
      options: {
        cacheName: 'images',
        expiration: { maxEntries: 60, maxAgeSeconds: 30 * 24 * 60 * 60 },
      },
    },
    {
      urlPattern: /\.(js|css)$/i,
      handler: 'StaleWhileRevalidate',
      options: { cacheName: 'static-resources' },
    },
    {
      urlPattern: /^https:\/\/api\./i,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        expiration: { maxEntries: 50, maxAgeSeconds: 5 * 60 },
      },
    },
  ],
});

const nextConfig: NextConfig = {
  reactStrictMode: true,
  compress: true,
  poweredByHeader: false,
  turbopack: {},
  images: {
    remotePatterns: [
      { protocol: 'http', hostname: 'localhost' },
      { protocol: 'https', hostname: 'pub-84198ca15564cde3343014d06849cf09.r2.dev' },
      { protocol: 'https', hostname: 'cdn.steeze.com' },
      { protocol: 'https', hostname: 'steeze.b-cdn.net' },
      { protocol: 'https', hostname: '**.r2.cloudflarestorage.com', pathname: '/steeze-media/**' },
      { protocol: 'https', hostname: '**.r2.dev', pathname: '/**' },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    dangerouslyAllowSVG: true,
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // Admin routes are web-only – no PWA caching for /admin/*
  async rewrites() {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    return [
      {
        source: '/api/:path*',
        destination: `${apiUrl}/api/:path*`,
      },
    ];
  },
};

const configWithPWA = withPWA(nextConfig);

module.exports = withSentryConfig(configWithPWA, {
  org: "your-org",
  project: "steeze-frontend",
  silent: true,
  widenClientFileUpload: true,
});
