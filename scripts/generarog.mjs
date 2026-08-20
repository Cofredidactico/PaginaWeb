/* Cofre Didáctico — Generador de páginas por producto (SEO) + tarjetas para compartir
   -----------------------------------------------------------------------------------
   Crea una página REAL e indexable por producto en /p/{id}.html (contenido visible +
   Open Graph + datos estructurados) y regenera el sitemap.xml con todas las páginas.

   No hace falta ejecutarlo a mano: el GitHub Action lo corre solo cuando cambia
   productos.json. También: node scripts/generarog.mjs
*/
import fs from 'fs';
import path from 'path';

const BASE = 'https://cofredidactico.com.ar/';
const ROOT = path.resolve(process.cwd());
const OUT_DIR = path.join(ROOT, 'p');

function esc(s){
  return String(s == null ? '' : s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function normImg(ruta){
  if (!ruta) return 'preview.png';
  if (/^https?:\/\//i.test(ruta)) return ruta;
  return String(ruta).replace(/^\/PaginaWeb\//, '').replace(/^\//, '').split('/').map(encodeURIComponent).join('/');
}
function imgAbs(ruta){ const r = normImg(ruta); return /^https?:/i.test(r) ? r : BASE + r; }
// Imagen optimizada por CDN (para la portada visible de la landing)
function imgOpt(ruta, w){
  const abs = imgAbs(ruta); const host = abs.replace(/^https?:\/\//i,'');
  return 'https://wsrv.nl/?url=' + encodeURIComponent(host) + '&w=' + (w||900) + '&output=webp&q=82&we';
}

const data = JSON.parse(fs.readFileSync(path.join(ROOT, 'productos.json'), 'utf8'));
const productos = (data.productos || []).filter(p => p && p.id && p.activo);

fs.mkdirSync(OUT_DIR, { recursive: true });
for (const f of fs.readdirSync(OUT_DIR)) { if (f.endsWith('.html')) fs.unlinkSync(path.join(OUT_DIR, f)); }

const HOY = new Date().toISOString().slice(0,10);
let n = 0;

for (const p of productos) {
  const nombre = p.nombre || 'Material';
  const titulo = `${nombre} · Cofre Didáctico`;
  const esGratis = p.acceso === 'gratis';
  const precioTxt = esGratis ? '¡Gratis!' : '$' + Number(p.precio || 0).toLocaleString('es-AR');
  const descBase = (p.descripcion || p.subtitulo || 'Recurso educativo para el aula, hecho por una docente para docentes.')
    .replace(/\s+/g, ' ').trim();
  const metaDesc = (precioTxt + ' · ' + descBase).slice(0, 158);
  const ogLocal = `og/${p.id}.jpg`;
  const tieneOg = fs.existsSync(path.join(ROOT, ogLocal));
  const ogImg = tieneOg ? (BASE + ogLocal) : imgAbs(p.imagen);
  const url = `${BASE}p/${p.id}.html`;
  const compraUrl = p.link || (esGratis ? (p.linkGratis || '') : '') || (BASE + 'index.html#/producto/' + p.id);
  const pct = (!esGratis && p.precioTachado && p.precioTachado > p.precio) ? Math.round((1 - p.precio/p.precioTachado)*100) : 0;
  const incluye = (p.incluye || []).map(i => (i && (i.texto || i)) || '').filter(Boolean);
  const tests = (p.testimonios || []).filter(Boolean);

  // ── Datos estructurados (Product + Offer + AggregateRating) ──
  const schema = {
    "@context": "https://schema.org", "@type": "Product",
    "name": nombre, "description": descBase, "image": ogImg, "url": url,
    "brand": { "@type": "Brand", "name": "Cofre Didáctico" },
    "category": p.tematica || "Educación",
    "offers": {
      "@type": "Offer", "priceCurrency": "ARS",
      "price": esGratis ? "0" : String(p.precio || 0),
      "availability": "https://schema.org/InStock",
      "url": compraUrl,
      "seller": { "@type": "Organization", "name": "Cofre Didáctico" }
    }
  };
  if (tests.length){
    schema.aggregateRating = { "@type": "AggregateRating", "ratingValue": "5", "reviewCount": String(tests.length) };
  }

  // ── Precio (HTML) ──
  const precioHtml = esGratis
    ? `<div class="precio"><span class="p-now gratis">¡Gratis! 🎁</span></div>`
    : `<div class="precio">${p.precioTachado && p.precioTachado>p.precio ? `<span class="p-old">$${Number(p.precioTachado).toLocaleString('es-AR')}</span>` : ''}<span class="p-now">$${Number(p.precio||0).toLocaleString('es-AR')}</span>${pct>=5?`<span class="p-off">−${pct}%</span>`:''}</div>`;

  const incluyeHtml = incluye.length
    ? `<section class="incluye"><h2>¿Qué incluye?</h2><ul>${incluye.map(t=>`<li>${esc(t)}</li>`).join('')}</ul></section>` : '';

  const larga = (p.descripcionLarga && String(p.descripcionLarga).trim())
    ? `<section class="larga">${esc(p.descripcionLarga).replace(/\n+/g,'</p><p>').replace(/^/,'<p>').replace(/$/,'</p>')}</section>` : '';

  const metaExtra = [];
  if (p.nivel) metaExtra.push('🎓 ' + esc(p.nivel));
  if (p.paginas) metaExtra.push('📄 ' + esc(p.paginas) + ' págs.');
  if (p.formato) metaExtra.push('🖨️ ' + esc(p.formato));

  const ctaCompra = esGratis ? '🎁 Descargar gratis' : '🛍️ Conseguir en la tienda';

  const html = `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(titulo)}</title>
<meta name="description" content="${esc(metaDesc)}">
<link rel="canonical" href="${esc(url)}">
<meta name="robots" content="index,follow">
<meta property="og:site_name" content="Cofre Didáctico">
<meta property="og:type" content="product">
<meta property="og:title" content="${esc(titulo)}">
<meta property="og:description" content="${esc(metaDesc)}">
<meta property="og:image" content="${esc(ogImg)}">${tieneOg ? `
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">` : ''}
<meta property="og:image:alt" content="${esc(nombre)} — Cofre Didáctico">
<meta property="og:url" content="${esc(url)}">
<meta property="og:locale" content="es_AR">
<meta property="product:price:amount" content="${esGratis ? '0' : String(p.precio || 0)}">
<meta property="product:price:currency" content="ARS">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(titulo)}">
<meta name="twitter:description" content="${esc(metaDesc)}">
<meta name="twitter:image" content="${esc(ogImg)}">
<script type="application/ld+json">${JSON.stringify(schema)}</script>
<link rel="icon" href="../logo.png">
<link rel="preconnect" href="https://wsrv.nl" crossorigin>
<style>
  :root{--pri:#2196F3;--acc:#FF8A4C;--ink:#12233A;--ink2:#5A6B7B;--bg:#FBF7F0;--card:#fff;--line:#ece4d8;--green:#22A06B}
  *{box-sizing:border-box}
  body{margin:0;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;background:var(--bg);color:var(--ink);line-height:1.55}
  a{color:var(--pri);text-decoration:none}
  .top{display:flex;align-items:center;gap:10px;padding:14px 20px;background:rgba(255,255,255,.85);border-bottom:1px solid var(--line);position:sticky;top:0;backdrop-filter:blur(8px)}
  .top img{width:34px;height:34px;border-radius:8px}
  .top b{font-weight:800}.top b span{color:var(--acc)}
  .wrap{max-width:1000px;margin:0 auto;padding:26px 20px 60px}
  .prod{display:grid;grid-template-columns:1fr 1.1fr;gap:34px;align-items:start}
  @media(max-width:760px){.prod{grid-template-columns:1fr;gap:20px}}
  .foto{width:100%;border-radius:18px;background:linear-gradient(135deg,#eef4fb,#fff);border:1px solid var(--line);box-shadow:0 24px 50px -24px rgba(26,39,68,.4);object-fit:contain;aspect-ratio:4/5}
  .chip{display:inline-block;background:#eaf3fb;color:var(--pri);font-weight:800;font-size:.76rem;padding:4px 11px;border-radius:99px;margin-bottom:10px}
  h1{font-size:2rem;line-height:1.15;margin:.1em 0 .3em}
  .lead{color:var(--ink2);font-size:1.06rem;margin:.2em 0 1em}
  .metae{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:14px}
  .metae span{background:#fff;border:1px solid var(--line);border-radius:99px;padding:5px 12px;font-size:.85rem;font-weight:700;color:var(--ink2)}
  .precio{display:flex;align-items:center;gap:12px;margin:6px 0 18px}
  .p-old{color:#9aa7b4;text-decoration:line-through;font-weight:700}
  .p-now{font-size:2rem;font-weight:800;color:var(--pri)}.p-now.gratis{color:var(--green)}
  .p-off{background:#FF6B35;color:#fff;font-weight:800;padding:3px 10px;border-radius:8px;font-size:.9rem}
  .btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;font-weight:800;padding:14px 22px;border-radius:14px;font-size:1.02rem;width:100%;margin-bottom:10px}
  .buy{background:linear-gradient(135deg,var(--acc),#FF6B35);color:#fff;box-shadow:0 10px 24px -8px rgba(255,107,53,.5)}
  .ghost{background:#fff;border:1.5px solid var(--line);color:var(--ink)}
  .incluye{margin-top:26px}.incluye h2,.larga h2{font-size:1.15rem;margin:0 0 10px}
  .incluye ul{list-style:none;padding:0;margin:0;display:grid;gap:8px}
  .incluye li{background:#fff;border:1px solid var(--line);border-radius:12px;padding:11px 14px;font-size:.96rem}
  .larga{margin-top:22px;color:var(--ink2)}.larga p{margin:.4em 0}
  footer{text-align:center;padding:30px 20px;color:var(--ink2);font-size:.9rem;border-top:1px solid var(--line)}
</style>
</head>
<body>
<header class="top">
  <a href="../" style="display:flex;align-items:center;gap:10px"><img src="../logo.png" alt="Cofre Didáctico"><b>Cofre <span>Didáctico</span></b></a>
</header>
<main class="wrap">
  <article class="prod">
    <img class="foto" src="${esc(imgOpt(p.imagen, 800))}" alt="${esc(nombre)}" width="800" height="1000" onerror="this.onerror=null;this.src='${esc(imgAbs(p.imagen))}'">
    <div class="info">
      ${p.tematica?`<span class="chip">${esc(p.tematica)}</span>`:''}
      <h1>${esc(nombre)}</h1>
      <p class="lead">${esc(descBase)}</p>
      ${metaExtra.length?`<div class="metae">${metaExtra.map(m=>`<span>${m}</span>`).join('')}</div>`:''}
      ${precioHtml}
      <a class="btn buy" href="${esc(compraUrl)}" ${/^https?:/i.test(compraUrl)?'target="_blank" rel="noopener"':''}>${ctaCompra}</a>
      <a class="btn ghost" href="../index.html#/producto/${esc(p.id)}">Ver más detalles y materiales →</a>
      ${incluyeHtml}
      ${larga}
    </div>
  </article>
</main>
<footer>
  © Cofre Didáctico · Materiales educativos para docentes · <a href="../">Ver todos los materiales</a>
</footer>
</body>
</html>
`;
  fs.writeFileSync(path.join(OUT_DIR, `${p.id}.html`), html, 'utf8');
  n++;
}

// ── Sitemap.xml (home + secciones + todas las páginas de producto) ──
const fijas = [
  { u: BASE, p: '1.0' },
  { u: BASE + 'gratis.html', p: '0.8' },
  { u: BASE + 'interactivos.html', p: '0.7' },
  { u: BASE + 'herramientas.html', p: '0.6' }
];
const urls = fijas.map(f => `  <url><loc>${f.u}</loc><lastmod>${HOY}</lastmod><changefreq>weekly</changefreq><priority>${f.p}</priority></url>`)
  .concat(productos.map(p => `  <url><loc>${BASE}p/${p.id}.html</loc><lastmod>${HOY}</lastmod><changefreq>monthly</changefreq><priority>0.8</priority></url>`));
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('\n')}
</urlset>
`;
fs.writeFileSync(path.join(ROOT, 'sitemap.xml'), sitemap, 'utf8');

console.log(`Generadas ${n} páginas de producto en /p/ + sitemap.xml con ${fijas.length + productos.length} URLs`);
