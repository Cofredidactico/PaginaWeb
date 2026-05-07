// ═══════════════════════════════════════════
// COFRE DIDÁCTICO — Service Worker
// Versión automática desde ?v=HASH del index.html
// ═══════════════════════════════════════════

var CACHE_VERSION = new URL(location.href).searchParams.get('v') || 'default';
var CACHE_NAME = 'cofre-' + CACHE_VERSION;

var SHELL = [
  '/PaginaWeb/',
  '/PaginaWeb/index.html',
  '/PaginaWeb/logo.png',
  '/PaginaWeb/manifest.json'
];

// ── Dominios que SIEMPRE van a la red (nunca al caché) ──
var NETWORK_ONLY = [
  'firestore.googleapis.com',
  'firebase.googleapis.com',
  'firebasestorage.googleapis.com',  // ← IMÁGENES DE STORAGE
  'storage.googleapis.com',           // ← Storage alternativo
  'identitytoolkit.googleapis.com',
  'www.gstatic.com',                  // ← SDKs de Firebase
  'securetoken.googleapis.com'
];

function isNetworkOnly(url) {
  return NETWORK_ONLY.some(function(domain) {
    return url.indexOf(domain) > -1;
  });
}

self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return Promise.allSettled(
        SHELL.map(function(url) {
          return cache.add(new Request(url, { cache: 'no-cache' })).catch(function(){});
        })
      );
    }).then(function() { return self.skipWaiting(); })
  );
});

self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys
          .filter(function(k){ return k !== CACHE_NAME; })
          .map(function(k){ return caches.delete(k); })
      );
    }).then(function() { return self.clients.claim(); })
  );
});

self.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', function(e) {
  var url = e.request.url;

  // ── Siempre red: Firebase APIs + Storage + SDKs ──
  if (isNetworkOnly(url)) return;

  // ── HTML: siempre red, caché solo como fallback offline ──
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request, { cache: 'no-cache' }).catch(function() {
        return caches.match('/PaginaWeb/index.html');
      })
    );
    return;
  }

  // ── Fuentes: cache-first (cambian raramente) ──
  if (url.indexOf('fonts.googleapis.com') > -1 || url.indexOf('fonts.gstatic.com') > -1) {
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        return cached || fetch(e.request).then(function(res) {
          var clone = res.clone();
          caches.open(CACHE_NAME).then(function(c){ c.put(e.request, clone); });
          return res;
        });
      })
    );
    return;
  }

  // ── CDN externos (jsdelivr, canvas-confetti, etc): network-first ──
  if (url.indexOf('cdn.jsdelivr.net') > -1 || url.indexOf('cdnjs.cloudflare.com') > -1) {
    e.respondWith(
      fetch(e.request).then(function(res) {
        if (!res || res.status !== 200) return res;
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function(c){ c.put(e.request, clone); });
        return res;
      }).catch(function() {
        return caches.match(e.request);
      })
    );
    return;
  }

  // ── Assets estáticos locales: cache-first ──
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      if (cached) return cached;
      return fetch(e.request).then(function(res) {
        if (!res || res.status !== 200 || res.type === 'opaque') return res;
        var clone = res.clone();
        caches.open(CACHE_NAME).then(function(c){ c.put(e.request, clone); });
        return res;
      }).catch(function() {
        return new Response('Sin conexión', { status: 503, headers: { 'Content-Type': 'text/plain' } });
      });
    })
  );
});
