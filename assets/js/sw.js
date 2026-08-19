const CACHE_NAME = 'apps-portal-gas-v3';
const ASSETS = [
  '../../',
  '../../index.html',
  '../../calendar.html',
  '../../admin.html',
  './config.js',
  './api.js',
  '../css/style.css',
  '../css/admin.css',
  '../manifest.json',
  '../uploads/system_logo.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(err => console.log('Cache addAll error:', err));
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
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

self.addEventListener('fetch', (e) => {
  // Google Apps Script API calls or external resources should not be cached strictly
  if (e.request.url.includes('script.google.com') || e.request.url.includes('googleusercontent.com')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      return cachedResponse || fetch(e.request).catch(() => caches.match('../../index.html'));
    })
  );
});
