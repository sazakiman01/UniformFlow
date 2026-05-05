'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegister() {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          console.log('[SW] Registered:', registration);
          
          // เคลียร์ cache ทันทีเมื่อ SW ลงทะเบียนสำเร็จ
          registration.update();
          
          // เคลียร์ cache เก่าที่อาจมีอยู่
          caches.keys().then((cacheNames) => {
            cacheNames.forEach((cacheName) => {
              if (cacheName !== 'uniformflow-cache-v1') {
                console.log('[SW] Deleting old cache on load:', cacheName);
                caches.delete(cacheName);
              }
            });
          });
        })
        .catch((error) => {
          console.log('[SW] Registration failed:', error);
        });
    }
  }, []);

  return null;
}
