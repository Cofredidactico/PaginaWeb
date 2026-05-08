# Cofre Didáctico — Sitio web v3

Sitio estático, rápido (<1s de carga), sin dependencias de servidor.
Catálogo cargado desde `productos.json`. Admin con Decap CMS sobre GitHub.

---

## 📂 Estructura del repo

```
PaginaWeb/
├── index.html          ← La tienda pública
├── productos.json      ← Catálogo de productos (lo edita Decap)
├── logo.png            ← Logo de la marca (poné el tuyo acá)
├── preview.jpg         ← Imagen para previews de WhatsApp/IG (1200×630)
├── images/             ← Carpeta de imágenes de productos
│   └── (Decap sube acá automáticamente)
├── admin/
│   ├── index.html      ← Shell de Decap CMS
│   └── config.yml      ← Configuración del admin
└── README.md           ← Este archivo
```

---

## ✏️ Cómo cargar un producto nuevo

1. Andá a `https://cofredidactico.github.io/PaginaWeb/admin/`
2. Iniciá sesión con tu cuenta de **GitHub** (la que es dueña del repo).
3. Click en **"📚 Productos"** → **"Catálogo de productos"**.
4. Bajá hasta la lista **Productos** y hacé click en **"Add Producto"**.
5. Completá los campos:
   - **ID interno**: sin espacios ni tildes (ej: `cuadernillo-numeros`).
   - **Nombre**, **Descripción**, **Precio**, **Link de Empretienda**.
   - **Imagen**: arrastrá una imagen (ideal 800×800 o 1200×900).
   - **Activo**: ✅ para que se vea en la tienda.
6. Click en **"Save"** arriba a la derecha.
7. Esperá 30-60 segundos y refrescá la tienda. **¡Listo!**

> 💡 Cualquier cambio queda registrado en GitHub. Si algo sale mal, podés revertir.

---

## 📊 Métricas (Umami Analytics)

1. Creá una cuenta gratis en **https://cloud.umami.is** (10.000 vistas/mes gratis).
2. Agregá tu sitio (`cofredidactico.github.io/PaginaWeb`).
3. Copiá tu `data-website-id`.
4. En `index.html`, buscá el bloque comentado de Umami y reemplazá `TU_ID_AQUI`. Descomentá las dos líneas.
5. Commit & push.

**Lo que vas a poder ver en Umami:**
- Visitantes únicos por día / semana / mes.
- Páginas más vistas.
- **Cuáles cuadernillos reciben más clics a Empretienda** (cada card dispara `click-producto` con el ID del producto).
- Newsletter: cuántas docentes se suscriben (`newsletter-suscripcion`).
- País, dispositivo, fuente (Instagram, Google, directo).

---

## 📧 Newsletter (Brevo / Mailchimp)

Por ahora el formulario es un placeholder. Para conectarlo:

### Opción A — Brevo (recomendado, gratis hasta 300 emails/día)
1. Creá cuenta en https://www.brevo.com
2. Ajustes → Tu API Key → Generar.
3. Crear una lista (Contactos → Listas → Nueva).
4. En `index.html`, dentro de la función `suscribirse()`, reemplazá el `// TODO` por:
   ```js
   await fetch('https://api.brevo.com/v3/contacts', {
     method:'POST',
     headers:{'api-key':'TU_API_KEY', 'Content-Type':'application/json'},
     body: JSON.stringify({ email, listIds:[ID_DE_TU_LISTA] })
   });
   ```

### Opción B — Mailchimp (más simple si ya lo usás)
Generan un formulario embebido que pegás directo en `#newsletter`.

---

## 🎨 Cambiar el banner de anuncio (oferta, novedad)

1. Decap → **⚙️ Configuración general** → **📢 Banner**.
2. Activalo, escribí el texto, elegí el color.
3. Save.

---

## 🚀 Deploy

GitHub Pages ya lo hace solo. Cada commit a `main` republica el sitio en 30-60 segundos.

---

## 🆘 Problemas comunes

| Problema | Solución |
|---|---|
| No me deja loguear en `/admin/` | Asegurate de que el repo en `config.yml` (`Cofredidactico/PaginaWeb`) y la branch (`main`) coincidan con la realidad. |
| Cambié algo en Decap pero no aparece online | Esperá 1 minuto. GitHub Pages tarda en republicar. Si pasaron 5 min, mirá la pestaña "Actions" del repo. |
| La imagen se ve cortada | Las cards usan ratio 4:3. Subí imágenes en formato horizontal o cuadrado. 1200×900 es ideal. |
| Quiero cambiar los textos del FAQ | Hoy están en `index.html`. Si querés que sean editables desde Decap, avisame y lo agrego. |

---

Cualquier duda: cofredidacticoo@gmail.com
