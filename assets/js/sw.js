/**
 * ============================================================================
 * SERVICE WORKER (assets/js/sw.js)
 * ============================================================================
 */

const CACHE_NAME = 'apps-portal-gas-v9';
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
  self.skipWaiting();
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS).catch(err => console.log('Cache addAll warning:', err));
    })
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('Purging old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  // จัดการเฉพาะคำขอแบบ GET ภายใน Domain เดียวกันเท่านั้น
  // ปล่อยให้คำขอ POST, PUT, DELETE และคำขอไปยัง Google Apps Script / Drive ทำงานผ่านเครือข่ายโดยตรง
  if (e.request.method !== 'GET' || !e.request.url.startsWith(self.location.origin)) {
    return;
  }

  // ไม่ยุ่งกับคำขอที่ส่งไปยัง Google Apps Script หรือ Google User Content
  if (e.request.url.includes('script.google.com') || e.request.url.includes('googleusercontent.com')) {
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch อัปเดตแคชเบื้องหลัง
        fetch(e.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
            caches.open(CACHE_NAME).then((cache) => cache.put(e.request, networkResponse));
          }
        }).catch(() => {});
        return cachedResponse;
      }

      return fetch(e.request).then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(e.request, responseClone));
        }
        return networkResponse;
      }).catch(() => caches.match('../../index.html'));
    })
  );
});
