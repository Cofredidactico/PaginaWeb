// Cofre Didáctico · funciona sin internet una vez abierta
const V='cofre-mw1k7msl', PRE=["./","index.html","manifest.webmanifest","logo-cofre.png","icono-192.png","icono-512.png","img/portada.webp","img/pintar.png","img/guia-1.webp","img/guia-2.webp","img/historia-6.webp","img/foto-1.webp","img/foto-2.webp","img/foto-3.webp","img/foto-4.svg","img/foto-5.webp","img/foto-6.webp","img/foto-7.webp","img/foto-8.webp","img/foto-9.webp","img/foto-10.webp","img/foto-11.webp","img/foto-12.webp","img/foto-13.webp","img/foto-14.webp","img/foto-15.webp","img/foto-16.webp","img/foto-17.webp","img/foto-18.webp","img/foto-19.webp","img/foto-20.webp","img/foto-21.webp","img/foto-22.webp","img/foto-23.webp","img/foto-24.webp","img/foto-25.webp","img/foto-26.webp","img/foto-27.webp"];
self.addEventListener('install',e=>{ e.waitUntil(caches.open(V).then(c=>Promise.all(PRE.map(u=>c.add(u).catch(()=>{})))).then(()=>self.skipWaiting())); });
self.addEventListener('activate',e=>{ e.waitUntil(caches.keys().then(K=>Promise.all(K.filter(k=>k.startsWith('cofre-')&&k!==V).map(k=>caches.delete(k)))).then(()=>self.clients.claim())); });
const guardar=(r,res)=>{ if(res&&res.ok){ const cl=res.clone(); caches.open(V).then(c=>c.put(r,cl)); } return res; };
self.addEventListener('fetch',e=>{ const r=e.request; if(r.method!=='GET') return; const u=new URL(r.url);
  if(u.origin===location.origin){
    if(r.mode==='navigate'){ e.respondWith(fetch(r).then(res=>guardar(r,res)).catch(()=>caches.match(r).then(x=>x||caches.match('./')||caches.match('index.html')))); return; }
    e.respondWith(caches.match(r).then(x=>x||fetch(r).then(res=>guardar(r,res)))); return; }
  if(/fonts\.(googleapis|gstatic)\.com$/.test(u.hostname)) e.respondWith(caches.match(r).then(x=>x||fetch(r).then(res=>guardar(r,res)).catch(()=>new Response('',{status:504}))));
});
