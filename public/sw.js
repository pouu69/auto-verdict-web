// Minimal service worker — satisfies PWA installability so the app can register
// as a Web Share Target. Network-first passthrough (no aggressive caching).
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', (event) => event.waitUntil(self.clients.claim()));
// A registered fetch handler is what makes the app installable. We deliberately
// do NOT call respondWith — the browser handles every request normally (the
// /api/encar proxy and IndexedDB data must not be intercepted).
self.addEventListener('fetch', () => {});
