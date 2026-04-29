// ═══════════════════════════════════════════
// COFRE DIDÁCTICO — Service Worker v1.2
// Estrategia: Cache-first para assets estáticos,
// Network-first para datos Firestore
// ═══════════════════════════════════════════

const CACHE_NAME = 'cofre-v1.4';
const SHELL = [
  '/PaginaWeb/',
  '/PaginaWeb/index.html',
  '/PaginaWeb/logo.png',
  '/PaginaWeb/manifest.json',
  'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800;900&family=Nunito:ital,wght@0,400;0,600;0,700;0,800;0,900;1,700;1,800&family=Fredoka+One&display=swap',
  'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js'
];

// Instalar — pre-cachear el shell
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(SHELL.map(function(url) {
        return new Request(url, { mode: 'no-cors' });
      }));
    }).then(function() {
      return self.skipWaiting();
    })
  );
});

// Activar — limpiar caches viejos
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    }).then(function() {
      return self.clients.claim();
    })
  );
});

// Fetch — estrategia híbrida
self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // 1. Firestore y Firebase API → siempre red, sin cache
  if (url.indexOf('firestore.googleapis.com') > -1 ||
      url.indexOf('firebase.googleapis.com') > -1 ||
      url.indexOf('identitytoolkit.googleapis.com') > -1) {
    return; // deja pasar normalmente
  }

  // 2. Google Fonts CSS → cache-first con fallback
  if (url.indexOf('fonts.googleapis.com') > -1 || url.indexOf('fonts.gstatic.com') > -1) {
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        return cached || fetch(e.request).then(function(res) {
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function(c) { c.put(e.request, clone); });
          return res;
        });
      })
    );
    return;
  }

  // 3. Navegación (HTML) → SIEMPRE red, nunca caché (para que GitHub Pages actualice)
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(function() {
        return caches.match('/PaginaWeb/index.html');
      })
    );
    return;
  }

  // 4. Assets estáticos (JS, CSS, imágenes) → cache-first
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(res) {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function(c) { c.put(e.request, clone); });
        return res;
      }).catch(function() {
        // Fallback genérico si no hay red ni cache
        return new Response('Sin conexión. Revisá tu conexión a internet.', {
          status: 503,
          headers: { 'Content-Type': 'text/plain; charset=utf-8' }
        });
      });
    })
  );
});
