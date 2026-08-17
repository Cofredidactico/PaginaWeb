/* Cofre Didáctico — Service Worker
   Estrategia:
   - App shell (HTML, logo, íconos): cache-first, con actualización en segundo plano.
   - productos.json: network-first (siempre intenta lo último; usa caché si no hay red).
   - Navegaciones offline: cae al index cacheado.
*/
const CACHE = 'cofre-v1';
const SHELL = [
  './',
  './index.html',
  './interactivos.html',
  './gratis.html',
  './logo.png',
  './icon192.png',
  './icon512.png',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // no interceptar terceros (fuentes, analytics)

  // Catálogo: network-first
  if (url.pathname.endsWith('productos.json')) {
    e.respondWith(
      fetch(req).then(res => {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // Navegaciones: intentar red, caer a index cacheado offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match('./index.html')));
    return;
  }

  // Resto (imágenes, css, etc.): cache-first con relleno
  e.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      if (res.ok && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE).then(c => c.put(req, copy));
      }
      return res;
    }).catch(() => cached))
  );
});
