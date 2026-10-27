/* Cofre Didáctico — Service Worker
   Estrategia:
   - App shell (HTML, logo, íconos): cache-first, con actualización en segundo plano.
   - productos.json: primero la red (así los materiales nuevos aparecen en la
     primera visita); si no hay red o tarda más de 4 s, usa la copia guardada.
   - Navegaciones offline: cae al index cacheado.
*/
const CACHE = 'cofre-v4';
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

  // Catálogo: primero la red (siempre lo último publicado). Si no hay red o tarda, la copia guardada.
  if (url.pathname.endsWith('productos.json')) {
    e.respondWith(
      caches.open(CACHE).then(async (cache) => {
        const key = new Request(url.origin + url.pathname);
        const red = fetch(req, { cache: 'no-cache' }).then((res) => {
          if (res && res.ok) cache.put(key, res.clone());
          return res;
        });
        red.catch(() => {});
        const espera = new Promise((ok) => setTimeout(ok, 4000, null));
        try {
          const res = await Promise.race([red, espera]);
          if (res && res.ok) return res;
        } catch (err) {}
        const cached = await cache.match(key);
        if (cached) return cached;
        try { const res = await red; if (res) return res; } catch (err) {}
        return new Response('{}', { headers: { 'Content-Type': 'application/json' } });
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
