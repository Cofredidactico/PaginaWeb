/* Cofre Didáctico · Mi biblioteca · funcionamiento sin conexión
   Solo controla biblioteca.html (no toca el resto de la web).
   - La página: primero internet; si no hay señal, la última copia guardada.
   - Herramientas (vendor/), logo e íconos: guardados en el dispositivo.
   - Catálogo (productos.json): respuesta guardada al instante y se actualiza por detrás.
   - Los datos de la docente y las descargas siempre van por internet (no se guardan acá). */
const CACHE = 'cofre-biblioteca-v1';
const BASE = ['./biblioteca.html', './logo.png', './icon192.png', './biblioteca.webmanifest',
  './vendor/pdf-lib.min.js', './vendor/qrcode.js', './vendor/pdf.min.js', './vendor/pdf.worker.min.js'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => Promise.all(BASE.map((u) => c.add(u).catch(() => {})))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k.startsWith('cofre-biblioteca-') && k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request; if (req.method !== 'GET') return;
  const url = new URL(req.url); if (url.origin !== location.origin) return;
  const p = url.pathname;
  if (req.mode === 'navigate' || p.endsWith('/biblioteca.html')) {
    e.respondWith(fetch(req).then((r) => { if (r.ok) caches.open(CACHE).then((c) => c.put('./biblioteca.html', r.clone())); return r; })
      .catch(() => caches.match('./biblioteca.html')));
    return;
  }
  if (p.endsWith('/productos.json')) {
    e.respondWith(caches.open(CACHE).then(async (c) => {
      const viejo = await c.match(req, { ignoreSearch: true });
      const nuevo = fetch(req).then((r) => { if (r.ok) c.put(req, r.clone()); return r; }).catch(() => null);
      return viejo || (await nuevo) || new Response('{"productos":[]}', { headers: { 'Content-Type': 'application/json' } });
    }));
    return;
  }
  if (/\/(vendor\/|logo\.png|icon\d+\.png|biblioteca\.webmanifest)/.test(p)) {
    e.respondWith(caches.match(req).then((m) => m || fetch(req).then((r) => { if (r.ok) caches.open(CACHE).then((c) => c.put(req, r.clone())); return r; })));
  }
});
