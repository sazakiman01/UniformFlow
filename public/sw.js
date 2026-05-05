const CACHE_NAME = 'uniformflow-cache-v1';
const CACHE_VERSION = '2026-05-05-v1';

self.addEventListener('install', (event) => {
  // เคลียร์ cache เก่าทั้งหมดเมื่อ install SW ใหม่
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[SW] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

self.addEventListener('activate', (event) => {
  // เคลียร์ cache ที่ไม่ตรงกับ version ปัจจุบัน
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!cacheName.includes(CACHE_VERSION)) {
            console.log('[SW] Deleting outdated cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  // เคลียร์ cache เก่าที่อาจ redirect ไป /app/home
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.keys().then((requests) => {
        requests.forEach((request) => {
          if (request.url.includes('/app/home')) {
            console.log('[SW] Deleting /app/home cache:', request.url);
            cache.delete(request);
          }
        });
      });
    })
  );
});

self.addEventListener('fetch', (event) => {
  // ไม่ cache HTML pages เพื่อให้ได้ข้อมูลล่าสุดเสมอ
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request);
      })
    );
  } else {
    // Cache static assets เฉพาะที่จำเป็น
    event.respondWith(
      caches.match(event.request).then((response) => {
        return response || fetch(event.request);
      })
    );
  }
});
