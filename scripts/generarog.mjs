/* Cofre Didáctico — Generador de tarjetas para compartir (Open Graph)
   ------------------------------------------------------------------
   Crea una mini-página por producto en /p/{id}.html con las etiquetas
   que leen WhatsApp, Facebook, Telegram, etc. (foto + nombre + precio),
   y redirige a la persona a la ficha real dentro de la app.

   No hace falta ejecutarlo a mano: el GitHub Action
   (.github/workflows/generar-og.yml) lo corre solo cada vez que cambia
   productos.json. También se puede correr manualmente:  node scripts/generar-og.mjs
*/
import fs from 'fs';
import path from 'path';

const BASE = 'https://cofredidactico.github.io/PaginaWeb/';
const ROOT = path.resolve(process.cwd());
const OUT_DIR = path.join(ROOT, 'p');

function esc(s){
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function normImg(ruta){
  if (!ruta) return BASE + 'preview.png';
  if (/^https?:\/\//i.test(ruta)) return ruta;
  ruta = String(ruta).replace(/^\/PaginaWeb\//, '').replace(/^\//, '');
  return BASE + ruta.split('/').map(encodeURIComponent).join('/');
}

const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'productos.json'), 'utf8'));
const productos = (data.productos || []).filter(p => p && p.id && p.activo);

fs.mkdirSync(OUT_DIR, { recursive: true });

// Limpiar shells viejas (de productos que ya no existen)
for (const f of fs.readdirSync(OUT_DIR)) {
  if (f.endsWith('.html')) fs.unlinkSync(path.join(OUT_DIR, f));
}

let n = 0;
for (const p of productos) {
  const nombre = p.nombre || 'Material';
  const titulo = `${nombre} · Cofre Didáctico`;
  const precioTxt = p.acceso === 'gratis'
    ? '¡Gratis!'
    : '$' + Number(p.precio || 0).toLocaleString('es-AR');
  const descBase = (p.descripcion || p.subtitulo || 'Recurso educativo para el aula, hecho por una docente para docentes.')
    .replace(/\s+/g, ' ').trim().slice(0, 155);
  const desc = `${precioTxt} · ${descBase}`;
  const img = normImg(p.imagen);
  const url = `${BASE}p/${p.id}.html`;
  const destino = `../index.html#/producto/${p.id}`;

  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": nombre,
    "description": descBase,
    "image": img,
    "url": url,
    "brand": { "@type": "Brand", "name": "Cofre Didáctico" },
    "offers": {
      "@type": "Offer",
      "priceCurrency": "ARS",
      "price": p.acceso === 'gratis' ? "0" : String(p.precio || 0),
      "availability": "https://schema.org/InStock",
      "url": p.link || url
    }
  };

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(desc)}">
<link rel="canonical" href="${esc(url)}">
<meta property="og:site_name" content="Cofre Didáctico">
<meta property="og:type" content="product">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:image" content="${esc(img)}">
<meta property="og:url" content="${esc(url)}">
<meta property="og:locale" content="es_AR">
<meta property="product:price:amount" content="${p.acceso === 'gratis' ? '0' : String(p.precio || 0)}">
<meta property="product:price:currency" content="ARS">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(titulo)}">
<meta name="twitter:description" content="${esc(desc)}">
<meta name="twitter:image" content="${esc(img)}">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
<link rel="icon" href="../logo.png">
<!-- Redirección para personas (los buscadores/WhatsApp leen las etiquetas de arriba) -->
<meta http-equiv="refresh" content="0; url=${esc(destino)}">
<script>location.replace(${JSON.stringify(destino)});</script>
<style>body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:#FBF7F0;color:#12233A;display:flex;min-height:100vh;align-items:center;justify-content:center;text-align:center;margin:0;padding:24px}a{color:#2196F3;font-weight:800}</style>
</head>
<body>
<p>Abriendo <a href="${esc(destino)}">${esc(nombre)}</a>…</p>
</body>
</html>
`;
  fs.writeFileSync(path.join(OUT_DIR, `${p.id}.html`), html, 'utf8');
  n++;
}

console.log(`Generadas ${n} tarjetas para compartir en /p/`);
