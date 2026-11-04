/** @type {import('next').NextConfig} */

// ---------------------------------------------------------------------------
// Content Security Policy (report-only — validates before enforcement)
// Compatible with:
//   • Meta Pixel:    connect.facebook.net, www.facebook.com, static.xx.fbcdn.net
//   • TikTok Pixel:  analytics.tiktok.com, www.tiktok.com
//   • Cloudinary:    res.cloudinary.com, api.cloudinary.com
//   • Supabase:      *.supabase.co (REST, Auth, Realtime)
//   • Google Fonts:  fonts.googleapis.com, fonts.gstatic.com
// ---------------------------------------------------------------------------
const cspDirectives = [
  // Default: only same-origin
  "default-src 'self'",

  // Scripts: self + inline (Next.js requires 'unsafe-inline' for hydration) +
  //   Meta, TikTok, Supabase realtime (wss is in connect-src)
  "script-src 'self' 'unsafe-inline' 'unsafe-eval' " +
    "connect.facebook.net " +
    "www.tiktok.com " +
    "analytics.tiktok.com " +
    "www.googletagmanager.com",

  // Styles: self + inline (Next.js injects inline styles) + Google Fonts
  "style-src 'self' 'unsafe-inline' fonts.googleapis.com",

  // Fonts: self + Google Fonts CDN
  "font-src 'self' fonts.gstatic.com",

  // Images: self + Cloudinary + Meta pixel beacon + data URIs
  "img-src 'self' data: blob: " +
    "res.cloudinary.com " +
    "www.facebook.com " +
    "static.xx.fbcdn.net " +
    "images.unsplash.com",

  // XHR / fetch / WebSocket: self + Supabase + Cloudinary upload + Meta + TikTok
  "connect-src 'self' " +
    "*.supabase.co " +
    "wss://*.supabase.co " +
    "api.cloudinary.com " +
    "connect.facebook.net " +
    "www.facebook.com " +
    "analytics.tiktok.com " +
    "www.googletagmanager.com",

  // Frames: deny by default (Meta pixel uses image beacon, not iframe)
  "frame-src 'none'",

  // Workers: only self
  "worker-src 'self' blob:",

  // Form actions: only self
  "form-action 'self'",

  // Base tag restriction
  "base-uri 'self'",
].join('; ');

const securityHeaders = [
  {
    key: 'X-DNS-Prefetch-Control',
    value: 'on',
  },
  {
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  },
  {
    key: 'X-Frame-Options',
    value: 'SAMEORIGIN',
  },
  {
    key: 'X-Content-Type-Options',
    value: 'nosniff',
  },
  {
    key: 'Referrer-Policy',
    value: 'strict-origin-when-cross-origin',
  },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
  {
    // Report-Only: logs violations without blocking — switch to
    // Content-Security-Policy once you've verified no legitimate
    // resources are blocked in your production environment.
    key: 'Content-Security-Policy-Report-Only',
    value: cspDirectives,
  },
];


const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        pathname: '/**',
      },
    ],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  },
  async redirects() {
    return [
      {
        source: '/products/:slug',
        destination: '/product/:slug',
        permanent: true,
      },
      {
        source: '/categories/:slug',
        destination: '/category/:slug',
        permanent: true,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
