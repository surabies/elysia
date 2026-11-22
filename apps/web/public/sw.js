// Service Worker PWA PERUMDA Tirtawening Kota Bandung

// 1. DI LINGKUNGAN DEVELOPMENT / LOCALHOST:
// Matikan Service Worker secara mutlak, hapus seluruh cache, dan unregister diri sendiri
// agar tidak pernah mencegat request JS/HTML atau menyajikan file kadaluarsa.
if (
  self.location.hostname === 'localhost' ||
  self.location.hostname === '127.0.0.1' ||
  self.location.hostname === '0.0.0.0'
) {
  self.addEventListener('install', () => {
    self.skipWaiting();
  });

  self.addEventListener('activate', (event) => {
    event.waitUntil(
      caches.keys()
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        .then(() => self.registration.unregister())
        .then(() => self.clients.claim())
    );
  });

  // JANGAN intercept fetch apapun di localhost / development — biarkan semua langsung ke network Next.js
  self.addEventListener('fetch', () => {
    return;
  });
} else {
  // 2. DI LINGKUNGAN PRODUCTION:
  const CACHE_NAME = 'tirtawening-pwa-v3';

  const STATIC_ASSETS = [
    '/offline',
    '/manifest.webmanifest',
    '/images/favicon.svg',
    '/favicon-32x32.png',
    '/apple-touch-icon.png',
    '/icons/icon-192.png',
    '/icons/icon-512.png',
    '/icons/icon-maskable-192.png',
    '/icons/icon-maskable-512.png',
    '/images/logo.png',
  ];

  self.addEventListener('install', (event) => {
    event.waitUntil(
      caches.open(CACHE_NAME).then(async (cache) => {
        await Promise.allSettled(
          STATIC_ASSETS.map((asset) => cache.add(asset))
        );
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
    const request = event.request;
    const url = new URL(request.url);

    if (request.method !== 'GET') {
      return;
    }

    // Jangan pernah intercept API, Next.js internal, atau chunks dinamis
    if (
      url.pathname.startsWith('/api/') ||
      url.pathname.startsWith('/_next/') ||
      url.pathname.includes('maplibre-worker')
    ) {
      return;
    }

    // Navigasi HTML: Network-first
    if (request.mode === 'navigate') {
      event.respondWith(
        fetch(request)
          .then((response) => {
            if (response && response.status === 200) {
              const responseClone = response.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return response;
          })
          .catch(async () => {
            const cachedResponse = await caches.match(request);
            if (cachedResponse) {
              return cachedResponse;
            }
            const offlineFallback = await caches.match('/offline');
            if (offlineFallback) {
              return offlineFallback;
            }
            return new Response('Offline - Silakan periksa koneksi internet Anda.', {
              headers: { 'Content-Type': 'text/plain; charset=utf-8' },
            });
          })
      );
      return;
    }

    // Aset Statis (Icon, Gambar publik)
    if (
      request.destination === 'image' ||
      request.destination === 'font'
    ) {
      event.respondWith(
        caches.match(request).then((cachedResponse) => {
          if (cachedResponse) {
            return cachedResponse;
          }
          return fetch(request).then((networkResponse) => {
            if (networkResponse && networkResponse.status === 200) {
              const responseClone = networkResponse.clone();
              caches.open(CACHE_NAME).then((cache) => {
                cache.put(request, responseClone);
              });
            }
            return networkResponse;
          });
        })
      );
    }
  });
}
