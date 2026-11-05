const CACHE_NAME = 'dovi-pwa-cache-v2';
const ASSETS_TO_CACHE = [
  '/manifest.json',
  '/logo.jpg?v=2',
  '/logo-192.png',
  '/logo-512.png',
  '/favicon.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return Promise.allSettled(
        ASSETS_TO_CACHE.map((url) => {
          return cache.add(url).catch((err) => {
            console.warn(`Failed to cache PWA asset on install: ${url}`, err);
          });
        })
      );
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event handler with Network-First strategy for HTML navigation
self.addEventListener('fetch', (event) => {
  if (!event.request.url.startsWith('http')) return;

  // Never cache API requests, health checks, or live chat
  if (
    event.request.url.includes('/api/') ||
    event.request.url.includes('/health/') ||
    event.request.url.includes('smartsupp')
  ) {
    return;
  }

  // Navigation requests (HTML documents): NETWORK-FIRST so new builds load immediately
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response.status === 200) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, copy));
          }
          return response;
        })
        .catch(() => caches.match(event.request))
    );
    return;
  }

  // Static assets (hashed JS, CSS, images): Network first, falling back to cache
  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response.status === 200) {
          const isAsset = event.request.url.match(/\.(png|jpg|jpeg|svg|css|js|woff2?)$/i);
          if (isAsset) {
            const responseToCache = response.clone();
            caches.open(CACHE_NAME).then((cache) => {
              cache.put(event.request, responseToCache);
            });
          }
        }
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
