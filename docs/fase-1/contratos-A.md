# Contratos de datos — Fase A
**Lote:** L00 · **Fecha:** 23-11-2026 · **Fuente:** código de `admin/` y `store/` (commit 421b7b2)
**Rige:** manual §3.2, §3.4 y §3.5; decisiones D-01, D-02, D-04, D-05, D-06, D-10, D-14, D-16 y D-19 (ver §8 y §10 del manual).

## 1. Convenciones
- Prefijo `/api/v1`; `admin/*` autenticado (token de Firebase en `Authorization: Bearer`); `tienda/*` público.
- Éxito `{data, meta?}`; `meta = {page, limit, total, totalPages}`; `limit` ≤ 100.
- Error `{error:{code, message, details?}}`. Códigos: `VALIDATION_ERROR` 400/422, `UNAUTHENTICATED` 401,
  `FORBIDDEN` 403, `NOT_FOUND` 404, `CONFLICT` 409, `BUSINESS_RULE` 422, `TOO_MANY_REQUESTS` 429 (L07A).
- Dinero: string `"0.00"` (DECIMAL 12,2). IVA: porcentaje como string `"13.00"`. El precio incluye IVA; el costo no.
- Fechas: ISO 8601 UTC (`2026-11-23T15:00:00.000Z`). La fecha de vencimiento de un lote es `YYYY-MM-DD` o `null`.
- Identificadores: producto `id:number`; categoría y marca por `slug` (inmutable); lote `id:number`.
- Nombres en español en la API y en la BD; los frontends conservan sus tipos y traducen en el adaptador.

## 2. Entidades (modelo de A)
| Entidad | Campos | Reglas |
|---|---|---|
| Categoria | id, slug (único), nombre (3–40, único sin acentos), icono, descripcion (≤160) | 409 al eliminar si tiene productos |
| Marca | id, slug (único), nombre (2–40, único), sitioWeb?, descripcion (≤160), icono?, activa, creadaEn | 409 al eliminar si tiene productos; una marca inactiva no se asigna a productos nuevos |
| Producto | id, sku (único, `^[A-Z0-9][A-Z0-9-]{1,31}$`), slug (único), nombre (≥3), categoriaId, marcaId, modelo, condicion (nuevo/usado/reacondicionado), costo?, precio (>0), precioAnterior? (>precio), tasaIva (0–100), stock (≥0), puntoReorden (≥0, por defecto 3), controlLotes, publicado, etiqueta?, descripcion, compatibilidad, conectividad | stock = Σ lotes si controlLotes (D-16) |
| ImagenProducto | id, productoId, url, orden | máx. 8; orden 0 = portada; sin duplicados |
| Especificacion | id, productoId, clave, valor, orden | clave y valor obligatorios |
| Lote | id, productoId, numero, cantidad (≥0), vence? (DATE) | consumo FEFO; los lotes sin fecha se consumen al final |
| MovimientoInventario | id, productoId, loteId?, delta, motivo, usuarioId, creadoEn | todo cambio de stock queda registrado (L06) |
| Usuario | id, firebaseUid (único), correo (único), nombre, telefono, rol, activo, debeCambiarContrasena, creadoEn, ultimoAcceso? | sin contraseña en la BD (D-01) |
| ConfiguracionTienda | fila única: nombre, eslogan, ciudad, pais, direccion, direccionCorta, telefonos[], whatsapp, correo, horario, horarioCorto, acercaDe, mision, vision, valores[], redes{}, moneda{codigo,simbolo,locale} | se edita desde el admin en L10 |

Los nombres definitivos del esquema Prisma se fijan en L02 a partir de esta tabla.

## 3. Recursos de A (indicativos; el nombre final se fija en cada lote)
| Método y ruta | Uso | Lote |
|---|---|---|
| GET /health | salud y ping a la BD | L01 |
| GET /admin/sesion | usuario vinculado al token (401/403) | L03 |
| GET/POST/PATCH/DELETE /admin/categorias[/:slug] | CRUD de categorías | L04 |
| GET/POST/PATCH/DELETE /admin/marcas[/:slug] · PATCH /admin/marcas/:slug/activa | CRUD y activación de marcas | L04 |
| GET/POST/PATCH/DELETE /admin/productos[/:id] · PATCH /admin/productos/:id/publicado | CRUD y publicación de productos | L05 |
| POST /admin/imagenes | subida a Cloudinary (D-17) | L05 |
| POST /admin/productos/:id/ajustes · PUT /admin/productos/:id/existencias · GET /admin/inventario/metricas | ajuste rápido, edición de stock/lotes y métricas | L06 |
| GET /tienda/categorias · /tienda/marcas | solo activas, con `totalProductos` | L04/L07 |
| GET /tienda/productos?q&categoria&marca&ofertas&orden&page&limit | listado público (solo publicados) | L07 |
| GET /tienda/productos/:id · /tienda/productos/:id/relacionados?limit | detalle y relacionados (`limit` 1–12, 4 por defecto) | L07 |
| GET /tienda/identidad | identidad pública | L07 |
| POST /tienda/carrito/validar | recálculo de precios y existencias | L07 |

`orden` ∈ `destacados | precio-asc | precio-desc | descuento | nombre-asc` (equivale a `SortBy` del store).

## 4. Formas JSON

### 4.1 Producto público (`tienda`)
```json
{ "id": 1, "slug": "laptop-acer-aspire-5-refurbished", "sku": "ACR-A515-REF",
  "nombre": "…", "descripcion": "…",
  "categoria": { "slug": "computadoras", "nombre": "Computadoras" },
  "marca": { "slug": "acer", "nombre": "Acer" },
  "precio": "525.00", "precioAnterior": "600.00", "disponible": 1,
  "etiqueta": "Destacado", "imagenes": ["https://…", "…"],
  "especificaciones": [{ "clave": "Procesador", "valor": "Intel Core i5 11va Gen" }],
  "calificacion": null, "totalResenas": 0 }
```
En A, `disponible` es el stock físico; en L14 pasa a ser físico − reservado sin que cambie el contrato.

### 4.2 Producto admin
Producto público + `modelo`, `condicion`, `costo`, `tasaIva`, `stock`, `puntoReorden`, `controlLotes`,
`lotes: [{ id, numero, cantidad, vence }]`, `publicado`, `compatibilidad`, `conectividad`.
Escritura: los mismos campos, sin `id`, `slug`, `calificacion`, `totalResenas` ni `etiqueta`; `categoria` y `marca` se envían por slug.
El servidor genera el slug único y recalcula `stock` cuando `controlLotes = true`.

### 4.3 Categoría y marca
```json
{ "slug": "computadoras", "nombre": "Computadoras", "icono": "fa-solid fa-laptop", "descripcion": "…", "totalProductos": 3 }
{ "slug": "acer", "nombre": "Acer", "sitioWeb": "https://www.acer.com", "descripcion": "…",
  "icono": "fa-solid fa-laptop", "activa": true, "creadaEn": "2026-10-01T09:00:00.000Z", "totalProductos": 1 }
```

### 4.4 Sesión
```json
{ "id": 1, "correo": "…", "nombre": "…", "telefono": "…", "rol": "…",
  "activo": true, "debeCambiarContrasena": false, "ultimoAcceso": "2026-11-23T15:00:00.000Z" }
```

### 4.5 Validar carrito
Entrada (máx. 50 líneas, cantidad de 1 a 99):
```json
{ "lineas": [{ "productoId": 1, "cantidad": 2 }] }
```
Salida (no reserva stock ni crea pedidos):
```json
{ "lineas": [{ "productoId": 1, "nombre": "…", "precioUnitario": "525.00", "cantidadSolicitada": 2,
  "cantidadDisponible": 1, "subtotal": "525.00", "estado": "ajustada" }],
  "total": "525.00", "valido": false }
```
`estado` ∈ `ok | ajustada | agotado | no-disponible`. En `no-disponible` (producto inexistente u oculto), `precioUnitario` es `null` y `nombre` es `null` si el producto no existe; en `agotado` y `no-disponible`, el subtotal es `"0.00"`. `valido` = todas las líneas en `ok`. Repetir un `productoId` o enviar campos extra (precios, totales) → 400 (L07A).

### 4.6 Identidad pública (L07A)
```json
{ "nombre": "CompuStore SV", "eslogan": "…", "ciudad": "…", "pais": "…", "direccion": "…", "direccionCorta": "…",
  "telefonos": ["7038-8225"], "whatsapp": "50370388225", "correo": "…", "horario": "…", "horarioCorto": "…",
  "acercaDe": "…", "mision": "…", "vision": "…", "valores": ["…"], "redes": { "facebook": "https://…" },
  "moneda": { "codigo": "USD", "simbolo": "$", "locale": "en-US" } }
```

## 5. Adaptadores (D-14): qué traduce cada frontend
| Campo API | admin `Product` | store `Product` |
|---|---|---|
| id | `"PRD-" + pad3(id)` (y de vuelta a número al escribir) | `id` |
| categoria.slug | `category` | `category` |
| marca | `brand = marca.nombre` | `brand = marca.slug` |
| precio / precioAnterior / costo / tasaIva | `Number()`; al escribir, `toFixed(2)` | `Number()` (sin costo) |
| disponible / stock | `stock` | `stock = disponible` |
| imagenes | `images`, `imageUrl = images[0] ?? PLACEHOLDER_IMAGE` | `imageUrl = imagenes[0]`, `images = imagenes.slice(1)` |
| especificaciones | `specs = {key, value}` | `specs = "clave: valor"` |
| publicado | `active` | (el servidor filtra) |
| etiqueta / calificacion / totalResenas | `badge` / `rating ?? 0` | `badge` / `rating ?? 0`, `reviewsCount` |
| lotes | `lots{id: String(id), lotNumber, quantity, expiresAt}`; las filas con `uid()` son nuevas | — |
| Categoria | `{id: slug, slug, name, icon, description}` | igual |
| Marca | `{id: slug, slug, name, website, description, active, createdAt}` | `{id: slug, slug, name, icon ?? por defecto, description}` |
| Sesión | `User` sin `passwordHash`; `role` y `access` según el rol (en A, sin RBAC fino) | — |

Ubicación de los adaptadores (D-14):
- admin: `25-pipeline-persistencia-catalogo/05-catalogo.api.ts`, `06-pipeline-sesion-permisos/06-sesion.api.ts` y el cliente HTTP en `84-pipeline-persistencia-demo/05-…`. Los stores de Zustand conservan su interfaz pública.
- store: pipeline nuevo `38-pipeline-datos-api` (cliente, adaptadores y caché de catálogo). Los consumidores de los mocks cambian el import; ningún componente se modifica.
- Cada archivo se crea en el lote que lo usa (L03, L04, L05 y L07).

## 6. Diferencias admin ↔ store
1. Id de producto: texto `PRD-###` en el admin frente a número en el store → se resuelve en el adaptador del admin.
2. Marca en el producto: nombre en el admin frente a slug en el store → FK en la BD; cada adaptador elige el campo.
3. Especificaciones: clave/valor en el admin frente a texto plano en el store.
4. Imágenes: el admin guarda una galería con la portada en [0]; el store separa la portada (`imageUrl`) de las adicionales (`images`).
5. Marca: `icon` solo en el store; `website`, `active` y `createdAt` solo en el admin.
6. Campos que solo usa el admin: modelo, condición, costo, IVA, punto de reorden, lotes, compatibilidad y conectividad.
7. IVA: `13` en el producto frente a `0.13` en los ajustes del admin → la API usa porcentaje.
8. Precios calculados en el cliente (carrito persistido, carrusel con "DESDE $525.00") → en L07 la validación del carrito y el carrusel leen la API.
9. `badge` no se edita en el admin, pero el store lo usa para "Destacados" → columna `etiqueta` sembrada desde los mocks; su edición queda fuera de A.
10. `rating` y `reviewsCount` (reseñas de la Fase B) → en A, `calificacion: null` y `totalResenas: 0`, sin datos ficticios.
11. El slug de producto que genera el admin no es único → la unicidad la garantiza el servidor.

## 7. Estado local que se mantiene (manual §3.5)
- Store: carrito (`compustore_sv_cart_v4`), favoritos (ids, `compustore_sv_favorites_v2`), búsqueda y filtros, tema y formulario de contacto.
- Admin: tema y preferencias de vista. Las demás claves `compustore_sv_bo_*` dejan de ser la fuente de los datos de A.

## 8. Seed (L02)
Fuente: mocks del admin (12 productos, 5 categorías y 8 marcas), más el `icono` de las marcas y las imágenes adicionales del store.
No incluye usuarios con contraseña (las cuentas se crean en Firebase, L03).

## 9. Evidencia
| Tema | Archivos |
|---|---|
| Producto (admin) | `admin/src/25-pipeline-persistencia-catalogo/04-types.ts`, `01-store.ts`; `admin/src/20-pipeline-validacion-producto/01-productForm.ts`, `02-productValidation.ts`, `03-normalize.ts`; `admin/src/87-pipeline-datos-demo-productos/01-products.mock.ts` |
| Imágenes (admin) | `admin/src/17-pipeline-ficha-producto/03-productImages.ts` |
| Inventario y lotes (admin) | `admin/src/24-pipeline-inventario-productos/03-inventory.ts` |
| Taxonomía (admin) | `admin/src/25-pipeline-persistencia-catalogo/03-taxonomy.ts`; `admin/src/87-pipeline-datos-demo-productos/02-categories.mock.ts`, `03-brands.mock.ts` |
| IDs y slugs (admin) | `admin/src/85-pipeline-identificadores-texto/01-text.ts` |
| Sesión (admin) | `admin/src/06-pipeline-sesion-permisos/05-types.ts`, `04-store.ts`; `admin/src/05-pipeline-inicio-sesion/02-useLoginForm.ts`; `admin/src/10-pipeline-cambio-contrasena/04-password.ts` |
| Ajustes (admin) | `admin/src/85-pipeline-identificadores-texto/03-store.config.ts` |
| Precio de oferta (admin, D-10) | `admin/src/23-pipeline-seleccion-productos/03-pricePort.ts`, `04-commercial.ts` |
| Modelos (store) | `store/src/03-modelos-producto.ts`; `store/src/06-pipeline-datos-mock/01..05-*.mock.ts` |
| Catálogo (store) | `store/src/10-pipeline-consulta-catalogo/01-consultas-productos.ts`, `04-aplicar-filtros.ts`; `store/src/11-pipeline-categorias/01-estadisticas-catalogo.ts`; `store/src/01-rutas.tsx` |
| Detalle y disponibilidad (store) | `store/src/25-pipeline-detalle-producto/01-estado-detalle.ts`; `store/src/24-pipeline-compra-producto/01-disponibilidad-producto.ts` |
| Carrito y checkout (store) | `store/src/07-pipeline-estado-carrito/01-modelos-carrito.ts`, `02-calculos-carrito.ts`, `03-carrito.store.ts`; `store/src/09-pipeline-checkout-whatsapp/01-pedido-whatsapp.ts` |
| Favoritos (store) | `store/src/15-pipeline-preferencias-producto/01-favoritos.store.ts` |
| Identidad (store) | `store/src/01-pipeline-identidad-tienda/01-identidad.config.ts`, `02-formatos-comerciales.ts`, `03-enlaces-whatsapp.ts` |
| Consumidores de mocks (store, D-14) | `store/src/00-director-catalogo.ts`; `10/04-aplicar-filtros.ts`; `11/01-estadisticas-catalogo.ts`; `13/01-seleccion-categoria.ts`; `13/02-seleccion-marca.ts`; `14/04-estado-lista-favoritos.ts`; `20/02-resenas.store.ts`; `20/03-resenas-producto.ts`; `25/01-estado-detalle.ts`; `26/02-estado-promociones.ts` |
