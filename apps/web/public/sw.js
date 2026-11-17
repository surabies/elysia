// Service Worker PWA PERUMDA Tirtawening Kota Bandung
const CACHE_NAME = 'tirtawening-pwa-v1';

const STATIC_ASSETS = [
  '/',
  '/offline',
  '/manifest.webmanifest',
  '/favicon.svg',
  '/favicon-32x32.png',
  '/apple-touch-icon.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-192.png',
  '/icons/icon-maskable-512.png',
  '/images/logo.png',
];

// Install: Cache core static assets & offline page
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: Clean up old cache versions
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

// Fetch: Network-first for navigations, cache-first for static assets
self.addEventListener('fetch', (event) => {
  const request = event.request;
  const url = new URL(request.url);

  // Jangan tangani selain GET
  if (request.method !== 'GET') {
    return;
  }

  // Jangan cache API atau worker internal
  if (url.pathname.startsWith('/api/') || url.pathname.includes('maplibre-worker')) {
    return;
  }

  // Permintaan Navigasi Halaman Web (HTML)
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
          // Jika offline, coba ambil dari cache halaman yang pernah dibuka
          const cachedResponse = await caches.match(request);
          if (cachedResponse) {
            return cachedResponse;
          }
          // Jika tidak ada di cache, tampilkan halaman offline cadangan
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

  // Aset Statis (Gambar, Font, CSS, Icon)
  if (
    request.destination === 'image' ||
    request.destination === 'font' ||
    request.destination === 'style' ||
    request.destination === 'script'
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          // Ambil dari cache, lalu fetch di background untuk update cache (Stale-While-Revalidate)
          fetch(request)
            .then((networkResponse) => {
              if (networkResponse && networkResponse.status === 200) {
                caches.open(CACHE_NAME).then((cache) => {
                  cache.put(request, networkResponse);
                });
              }
            })
            .catch(() => {});
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
