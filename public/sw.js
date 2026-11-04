/**
 * Arham Collection PWA Service Worker
 * 
 * CRITICAL REQUIREMENTS:
 * - NO AGGRESSIVE CACHING of checkout, admin, account, or API mutation requests.
 * - Sensitive routes (/checkout, /admin/*, /account, /api/*) are strictly network-only.
 * - Cache static assets (JS chunks, CSS, fonts, icons) using Cache-First.
 * - Non-sensitive content pages use Network-First with offline fallback.
 */

const CACHE_NAME = 'arham-collection-v1';
const STATIC_ASSETS = [
  '/',
  '/manifest.webmanifest',
  '/icons/icon.svg',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
];

// Routes that MUST NEVER be cached
const NEVER_CACHE_PATTERNS = [
  /\/checkout(\/.*)?$/,
  /\/admin(\/.*)?$/,
  /\/account(\/.*)?$/,
  /\/order-confirmation(\/.*)?$/,
  /\/api\/.*/,
  /\/auth\/.*/,
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // 1. Never cache non-GET requests (mutations, server actions, logins)
  if (request.method !== 'GET') {
    return;
  }

  // 2. Strictly bypass service worker for sensitive / operational routes
  const isNeverCache = NEVER_CACHE_PATTERNS.some((pattern) => pattern.test(url.pathname));
  if (isNeverCache) {
    // Direct network pass-through, no cache interaction
    return;
  }

  // 3. Static assets: _next/static, icons, fonts -> Cache-First
  const isStaticAsset =
    url.pathname.startsWith('/_next/static/') ||
    url.pathname.startsWith('/icons/') ||
    url.pathname.startsWith('/fonts/') ||
    url.pathname.endsWith('.woff2') ||
    url.pathname.endsWith('.png') ||
    url.pathname.endsWith('.svg');

  if (isStaticAsset) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) return cachedResponse;
        return fetch(request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        });
      })
    );
    return;
  }

  // 4. Content HTML pages: Network-First with Cache fallback
  if (request.headers.get('accept')?.includes('text/html')) {
    event.respondWith(
      fetch(request)
        .then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            const responseToCache = networkResponse.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(request, responseToCache);
            });
          }
          return networkResponse;
        })
        .catch(() => {
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) return cachedResponse;
            return caches.match('/'); // Fallback to cached home shell
          });
        })
    );
  }
});

