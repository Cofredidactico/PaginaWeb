/* Cofre Didáctico — Service Worker
   Estrategia:
   - App shell (HTML, logo, íconos): cache-first, con actualización en segundo plano.
   - productos.json: stale-while-revalidate (responde al instante desde caché y
     refresca en segundo plano; usa caché si no hay red).
   - Navegaciones offline: cae al index cacheado.
*/
const CACHE = 'cofre-v3';
const SHELL = [
  './',
  './index.html',
  './interactivos.html',
  './gratis.html',
  './herramientas.html',
  './logo.png',
  './icon192.png',
  './icon512.png',
  './manifest.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      // addAll falla entero si algún archivo no está; lo hacemos tolerante
      .then(c => Promise.all(SHELL.map(u => c.add(u).catch(() => {}))))
      .then(() => self.skipWaiting())
  );
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
  if (url.origin !== location.origin) return; // no interceptar terceros (fuentes, analytics, CDN de imágenes)

  // Catálogo: stale-while-revalidate (ignora el ?v= para reusar la caché)
  if (url.pathname.endsWith('productos.json')) {
    e.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const cached = await cache.match(req, { ignoreSearch: true });
        const fetching = fetch(req).then((res) => {
          if (res && res.ok) cache.put(req, res.clone());
          return res;
        }).catch(() => null);
        if (cached) return cached;                 // instantáneo; el fetch refresca en segundo plano
        const net = await fetching;
        return net || new Response('{}', { headers: { 'Content-Type': 'application/json' } });
      })
    );
    return;
  }

  // Navegaciones: intentar red, caer a index cacheado offline
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).catch(() => caches.match(req, { ignoreSearch: true }).then(r => r || caches.match('./index.html'))));
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
