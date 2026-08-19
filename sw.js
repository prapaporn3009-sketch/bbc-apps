/**
 * ============================================================================
 * SERVICE WORKER (sw.js)
 * ============================================================================
 * รองรับทั้ง Localhost และ GitHub Pages
 */

const CACHE_NAME = 'apps-portal-gas-v7';
const ASSETS = [
  './',
  './index.html',
  './calendar.html',
  './admin.html',
  './config.js',
  './assets/js/config.js',
  './assets/js/api.js',
  './assets/css/style.css',
  './assets/css/admin.css',
  './assets/manifest.json',
  './assets/uploads/system_logo.png'
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
  // ไม่แคชคำขอไปยัง Google Apps Script API หรือ Google CDN
  if (e.request.url.includes('script.google.com') || e.request.url.includes('googleusercontent.com')) {
    e.respondWith(fetch(e.request).catch(() => caches.match(e.request)));
    return;
  }

  // Network First แล้ว fallback เป็น Cache สำหรับไฟล์ HTML/JS เพื่อให้ได้ข้อมูลล่าสุดเสมอ
  e.respondWith(
    fetch(e.request)
      .then((response) => {
        // อัปเดตแคชด้วยไฟล์ล่าสุดที่ได้จาก Network
        if (response && response.status === 200 && response.type === 'basic') {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(e.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        return caches.match(e.request).then((cachedResponse) => {
          return cachedResponse || caches.match('./index.html');
        });
      })
  );
});
