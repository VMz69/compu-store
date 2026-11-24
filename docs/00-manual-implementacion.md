# CompuStore SV — Manual de implementación A + B
**Versión:** 2.0 · **Fecha:** 23-11-2026 · **Ubicación:** `docs/00-manual-implementacion.md`
**Sustituye a:** `rutaBackEnd.md` v1.0 (queda como histórico).
**Consolida:** alcance A/B, matriz de 64 funcionalidades y topología FLOA + VSA.
**Destinatarios:** Claude Code (VS Code) y el desarrollador. Es el documento rector único.

---

## 0. Cómo usar este manual

**Jerarquía:** este manual > `CompuStoreSV_alcance_A_B.md` > matriz de 64 > topología. Si el código real contradice el manual, se registra en §10 y se pregunta antes de seguir.

**Protocolo de sesión (1 sesión = 1 lote):**
1. Leer `CLAUDE.md`, §9 (registro) y el lote en curso (§7).
2. Inspeccionar el código real que toca el lote (frontends + `api/`). No suponer contratos.
3. Resolver las decisiones `D-xx` (§8) que bloquean el lote: proponer una opción con evidencia y esperar confirmación.
4. Modo plan: archivos que se crean o modifican, endpoints, cambios de Prisma y pruebas. Esperar aprobación.
5. Implementar en pasos pequeños y ejecutar `pnpm check` después de cada paso.
6. Verificar el criterio de cierre y entregar los pasos de una demostración manual.
7. Actualizar §9 y §10, y hacer commit `feat(Lxx): …`.

**Reglas de sesión:**
- Hacer cambios quirúrgicos y no tocar código funcional fuera del lote.
- Si algo se rompe y no se corrige en el mismo paso, revertir al último commit.
- Si un lote excede el contexto, dividirlo en `LxxA` / `LxxB`.

---

## 1. Objetivo y límites
- Implementar las **64 funcionalidades** (A: 27 · B: 37) sobre los frontends existentes.
- **UI intocable:** no rediseñar, eliminar ni mover componentes de `/admin` ni de `/store`. Solo se adaptan el acceso a datos y los estados de disponibilidad.
- **Sin mezclar mocks con producción:** cada vista está conectada a la API o bloqueada como "pendiente".
- **Fuera de alcance:** DTE/Hacienda, pagos en línea, cuentas públicas de clientes, integración con facturación externa, microservicios, WebSockets y correos transaccionales (salvo el restablecimiento de contraseña del proveedor de autenticación).

---

## 2. Stack

| Capa | Tecnología | Nota |
|---|---|---|
| Frontends | React + Vite + TS (existentes) | Arquitectura FLOA propia |
| API | Node LTS + Express + TypeScript | Versiones: D-03 |
| ORM / BD | Prisma (`provider = "mysql"`) + MariaDB | Motor de producción: D-02 |
| Validación | Zod | Body, query y params |
| Autenticación | Firebase Auth + Admin SDK | D-01 |
| Imágenes | Cloudinary | D-17 |
| Pruebas | Vitest + Supertest | BD de prueba separada (D-15) |
| Paquetes | pnpm | — |
| Despliegue | Railway (API + BD) · Vercel (admin, store) | Netlify solo provisional |

No se agregan tecnologías sin una necesidad funcional comprobada.

---

## 3. Reglas obligatorias

### 3.1 Arquitectura
1. Monolito modular FLOA + VSA, con los pipelines directamente bajo `src/`.
2. **Numeración consecutiva por orden de creación**, sin saltos ni espacios reservados, también dentro de cada pipeline. Nunca se renumera: un archivo nuevo toma el siguiente número.
3. `00-director-*` es la **única API pública** del pipeline: exporta sus routers y las funciones que usan otros dominios.
4. Patrón por dominio: `routes → schema (Zod) → service (reglas) → repository (Prisma)`. Cada archivo se crea solo cuando hace falta.
5. Un dominio no importa archivos internos de otro; solo su director. No se permiten ciclos (`madge --circular src` dentro de `pnpm check`).
6. **Transacciones entre dominios:** el service coordinador abre `prisma.$transaction` y pasa `tx` a las funciones del director del otro dominio.
7. La numeración organiza; no define el orden de ejecución.

### 3.2 Datos
- Dinero en `DECIMAL(12,2)`; en JSON se transmite como string decimal (D-05). Fechas en UTC.
- Toda modificación del esquema se hace con migraciones Prisma; nada de cambios manuales.
- **Snapshot histórico** (nombre, SKU, precio) en las líneas de pedidos, cotizaciones y documentos.
- Los documentos emitidos son inmutables: se corrigen por anulación.
- **Stock:** `físico`, `reservado` y `disponible = físico − reservado`. Nunca es negativo y todo movimiento se registra con quién, por qué y cuándo.
- La eliminación se restringe si hay referencias. Se usa eliminación lógica donde la matriz lo indica (pedidos, clientes con historial).
- El seed es idempotente y no lleva contraseñas.

### 3.3 Seguridad
- El proveedor identifica al usuario, MariaDB guarda los permisos y Express los impone. El frontend no constituye seguridad.
- `/api/v1/admin/*` está protegido por defecto. `/api/v1/tienda/*` es público y de solo lectura, salvo validar el carrito y enviar reseñas.
- Nunca confiar en precios, totales, descuentos ni permisos enviados por el navegador.
- CORS con lista de orígenes, helmet y límite de tasa en las escrituras públicas. Los logs no llevan tokens ni datos sensibles.
- `.env` y las credenciales nunca se suben al repositorio.

### 3.4 Convenciones de la API
- Prefijo `/api/v1`, recursos en español, en plural y en kebab-case.
- Respuestas `{ data, meta? }`; errores `{ error: { code, message, details? } }` (D-06).
- Códigos: 200, 201, 204, 400, 401, 403, 404, 409 (conflicto o restricción) y 422 (regla de negocio).

### 3.5 Frontends
- Los adaptadores traducen el contrato de la API a los tipos existentes, dentro de la capa de datos de cada frontend (D-14).
- La URL de la API llega por variable de entorno (`VITE_API_URL`).
- Una vista no conectada se bloquea como "pendiente" en producción mediante una bandera en la capa de datos, no en los componentes.
- Estado local permitido en `/store`: búsqueda, carrito, favoritos y tema.

### 3.6 Pruebas
- Son obligatorias para las reglas críticas: stock, transiciones, totales, correlativos y permisos.
- Cada endpoint nuevo lleva al menos una prueba de integración.
- Un lote está cerrado cuando las pruebas pasan y el criterio de cierre está demostrado.

---

## 4. Topología final (A + B)

```text
api/
├── prisma/            schema.prisma · migrations/ · seed.ts
├── scripts/           respaldo.sh · restaurar.sh
├── tests/
└── src/
    ├── 00-main.ts · 01-app.ts · 02-env.ts
    ├── 03-pipeline-conexiones/     prisma, firebase, cloudinary
    ├── 04-pipeline-http/           autenticación, validación, errores
    ├── 05-pipeline-acceso/         sesión, autorización │ B: usuarios, roles, RBAC
    ├── 06-pipeline-catalogo/       taxonomía, productos, imágenes
    ├── 07-pipeline-inventario/     existencias, lotes, ajustes, métricas │ B: reservado, descuento/reposición
    ├── 08-pipeline-tienda/         identidad pública, validación de carrito │ B: ajustes, emisor, canales
    ├── 09-pipeline-clientes/       (B)
    ├── 10-pipeline-ofertas/        (B)
    ├── 11-pipeline-pedidos/        (B) pedidos, cargos, estados, reservas, vencimientos
    ├── 12-pipeline-facturacion/    (B) documentos, correlativos, PDF, anulación
    ├── 13-pipeline-cotizaciones/   (B)
    ├── 14-pipeline-resenas/        (B)
    ├── 15-pipeline-reportes/       (B)
    └── 16-pipeline-mantenimiento/  (B)
```

**Archivos previstos para la Fase A** (de la topología aprobada; se crean al necesitarlos):

| Pipeline | Archivos |
|---|---|
| 03-conexiones | `00-director-conexiones` · `01-prisma` · `02-firebase` · `03-cloudinary` |
| 04-http | `00-director-http` · `01-autenticacion.middleware` · `02-validacion.middleware` · `03-errores.middleware` |
| 05-acceso | `00-director-acceso` · `01-acceso.routes` · `02-acceso.service` · `03-acceso.repository` · `04-autorizacion` |
| 06-catalogo | `00-director-catalogo` · `01–04 productos.(routes, schema, service, repository)` · `05–08 taxonomia.(…)` · `09-imagenes.service` |
| 07-inventario | `00-director-inventario` · `01–04 inventario.(…)` · `05-lotes.service` |
| 08-tienda | `00-director-tienda` · `01-tienda.routes` · `02-tienda.service` |

> **Cambio frente a la topología aprobada:** en B, `ofertas` pasa antes que `pedidos` (10 ↔ 13), porque el precio efectivo debe existir antes de calcular totales. También se agrega `16-mantenimiento` para la funcionalidad 44. Ambos cambios se confirman en D-10.

---

## 5. Contratos entre dominios (indicativos)

| Director | Funciones expuestas | Lote |
|---|---|---|
| acceso | `autenticar`, `requierePermiso(permiso)` (middlewares) | L03 · L09 |
| catalogo | `obtenerProductosVendibles(ids)` → id, sku, nombre, precioBase, publicado | L05 |
| inventario | `obtenerDisponibilidad(ids)` · `reservar/liberar(tx)` · `descontar/reponer(tx)` | L06 · L14 · L15 |
| tienda | `obtenerIdentidad()` · `obtenerEmisor()` | L07 · L10 |
| clientes | `obtenerCliente(id)` | L11 |
| ofertas | `precioEfectivo(ids, fecha)`; antes de L12 se usa `precioBase` | L12 |
| pedidos | `crearDesdeCotizacion(tx, …)` | L16 |

Los nombres son orientativos: los definitivos se fijan en el plan de cada lote. **Regla de estabilidad:** `obtenerDisponibilidad` mantiene su contrato aunque en L14 pase de "físico" a "físico − reservado".

---

## 6. Dependencias

```text
L00 → L01 → L02 → L03 → L04 → L05 → L06 → L07 → L08   (Fase A)
                                                  ↓
L09 → L10 → L11 → L12 → L13 → L14 → L15 → L16 → L18   (Fase B)
               └──────────── L17 (después de L09) ─┘
```
L13, L14 y L15 forman el **circuito comercial indivisible**: su UI se habilita en producción solo al cerrar L15.

---

## 7. Lotes

### FASE A — 27 funcionalidades

**L00 — Preparación y contratos** · *sin funcionalidades*
- Copiar el Anexo A a `CLAUDE.md` y ordenar `/docs` (`fase-0/`, `fase-1/`, este manual).
- Configurar un hook que ejecute `pnpm check` después de cada edición (cuando exista `api/`).
- Inspeccionar tipos, mocks y servicios de las vistas de A en `/admin` (login, `/productos`, `/categorias`, marcas) y en `/store` (catálogo, detalle, carrito, checkout, identidad). Escribir `docs/fase-1/contratos-A.md` con las entidades, los campos que consume cada frontend, IDs/slugs, el formato de precios, las especificaciones, las imágenes y las diferencias entre admin y store.
- Resolver D-01, D-02, D-04, D-05, D-06, D-10, D-14, D-16 y D-19.
- **Cierre:** contratos documentados y decisiones bloqueantes de A resueltas.

**L01 — Base de la API**
- `00-main`, `01-app`, `02-env` (Zod), `03-conexiones/01-prisma` y `04-http` (validación y errores), CORS y `GET /api/v1/health` con ping a la BD.
- Scripts `dev`, `build`, `start` y `check` (typecheck, lint, test, madge). Vitest + Supertest con BD de prueba.
- Despliegue preliminar en Railway.
- **Cierre:** `/health` responde bien en local y en Railway, y la prueba pasa.

**L02 — Modelo de datos A y respaldo**
- `schema.prisma` con las entidades de A, según `contratos-A.md`: Usuario, Categoría, Marca, Producto, Imagen, Especificación, Lote, MovimientoInventario y ConfiguraciónTienda (nombres finales según D-19).
- Migración inicial y seed reproducible (catálogo de muestra a partir de los mocks actuales).
- `scripts/respaldo.sh` y `restaurar.sh` probados en local.
- **Cierre:** `migrate` + `seed` funcionan desde cero, y una restauración reproduce los datos.

**L03 — Acceso** · *01, 05*
- `02-firebase`, `01-autenticacion.middleware` y `05-pipeline-acceso`: sesión (`/me`), vínculo identidad → Usuario y `04-autorizacion` (en A, usuario activo habilitado).
- Admin: inicio y cierre de sesión, restauración de sesión, cambio y restablecimiento de contraseña reales.
- Procedimiento documentado para que el propietario cree las 2 cuentas, sin contraseñas en el código.
- **Cierre:** 401 sin token y 403 sin usuario habilitado (con pruebas); las 2 cuentas entran.

**L04 — Taxonomía** · *07, 08*
- `06-catalogo` 05–08: CRUD de categorías y marcas, activación/desactivación de marcas, slugs únicos y restricción de eliminación (409 si hay productos).
- Lectura pública de las activas. Admin: `/categorias` y `?tab=marcas` conectadas.
- **Cierre:** CRUD real y persistente, con las restricciones probadas.

**L05 — Productos e imágenes** · *06, 09*
- `06-catalogo` 00–04 y `09-imagenes` + `03-cloudinary`: SKU único, precios, especificaciones, publicación y ocultamiento, y limpieza de imágenes huérfanas.
- Admin: `/productos` conectado (la parte de existencias va en L06).
- **Cierre:** crear, editar y ocultar un producto con imagen; persiste y se refleja en el endpoint público.

**L06 — Inventario** · *10, 11, 13*
- `07-inventario`: existencias, lotes y vencimientos, ajustes manuales con motivo y usuario, métricas, y `obtenerDisponibilidad`.
- Admin: existencias, lotes y ajustes dentro de `/productos`.
- **Cierre:** una prueba de concurrencia no deja stock negativo y las métricas coinciden con los datos.

**L07 — Tienda conectada** · *45–52, 55–64*
- `08-tienda`: identidad, horarios y números de WhatsApp públicos.
- Endpoints públicos: listado, búsqueda, filtros, orden, paginación, conteos, detalle, relacionados y disponibilidad.
- `POST /api/v1/tienda/carrito/validar`: recalcula precios y existencias antes de WhatsApp. No crea pedidos ni reserva stock.
- Store: los adaptadores reemplazan los mocks. Carrito, favoritos, tema, carrusel y contacto siguen locales; si el carrusel muestra productos o precios, los lee de la API. Las reseñas conservan su composición, sin datos ficticios presentados como reales.
- **Cierre:** un cambio hecho en el admin se ve en la tienda, y el mensaje de WhatsApp sale con precios y existencias reales.

**L08 — Cierre de la Fase A**
- Admin: las vistas fuera de A quedan bloqueadas como "pendiente", sin escrituras simuladas en producción.
- Vercel: `/admin` y `/store` como proyectos separados, con `VITE_API_URL`, CORS final y Open Graph para WhatsApp.
- Respaldo en producción con una restauración verificada (D-08).
- Checklist de aceptación de A: 2 cuentas seguras, 3 vistas reales, cambios reflejados en la tienda, carrito + WhatsApp, sin escrituras simuladas y respaldos verificables.
- **Cierre:** Fase A aceptada con el tag `v1.0-fase-a`.

### FASE B — 37 funcionalidades

**L09 — Usuarios y RBAC** · *02, 03, 04*
- Ampliar `05-acceso`: CRUD de usuarios, plantillas de roles, permisos por vista y acción, y `requierePermiso` aplicado a todas las rutas existentes. Las 2 cuentas migran al rol de propietario.
- **Cierre:** matriz de permisos probada (permitido y denegado) en cada endpoint.

**L10 — Ajustes e identidad** · *42, 43*
- Ampliar `08-tienda`: identidad comercial, datos del emisor y canales de venta.
- **Cierre:** un cambio hecho en el admin se refleja en la tienda.

**L11 — Clientes** · *14, 15, 16*
- `09-clientes`: directorio, búsqueda, CRUD y eliminación controlada (la regla con pedidos se completa en L13).
- **Cierre:** CRUD persistente con búsqueda paginada.

**L12 — Ofertas** · *37, 38, 39*
- `10-ofertas`: CRUD, programación, vigencia, pausa y `precioEfectivo` como cálculo único para admin, tienda y validación del carrito.
- **Cierre:** una misma oferta da el mismo precio en los tres puntos.

**L13 — Pedidos y estados** · *18–22, 26, 27*
- `11-pedidos`: registro, edición, eliminación lógica, cargos adicionales, totales recalculados en el servidor con snapshot, máquina de estados con historial y etiquetas.
- **Cierre:** las transiciones inválidas se rechazan y los totales del navegador se ignoran.

**L14 — Reservas** · *23, 24, 25*
- Reserva al confirmar, vencimiento en el servidor (D-07), stock reservado y disponible. Transacciones con bloqueo de fila e idempotencia.
- **Cierre:** de dos confirmaciones sobre la última unidad, una falla.

**L15 — Facturación y stock** · *33–36, 12*
- `12-facturacion`: emisión interna desde un pedido, correlativos sin huecos ni duplicados (D-12), PDF (D-11), anulación con reposición y descuento de stock en la misma transacción.
- Habilitar en producción el circuito pedido → reserva → factura → stock → entrega.
- **Cierre:** prueba E2E del circuito; la anulación repone exactamente y la doble emisión es imposible.

**L16 — Cotizaciones** · *29–32*
- `13-cotizaciones`: listado, emisión (con su propio correlativo y el PDF de L15), estados, vencimiento y conversión a pedido (D-18).
- **Cierre:** la conversión genera un pedido válido según D-18.

**L17 — Reseñas** · *40, 41, 53, 54*
- `14-resenas`: envío público con antispam (D-13), bandeja, moderación y publicación. La tienda muestra solo las aprobadas.
- **Cierre:** solo se ven las reseñas aprobadas.

**L18 — Reportes, mantenimiento y cierre de B** · *17, 28, 44*
- `15-reportes`: dashboard, métricas comerciales, historial y estadísticas de clientes. `16-mantenimiento`: herramientas definidas en D-09.
- **Cierre:** ninguna vista del admin queda bloqueada; regresión completa y tag `v2.0-fase-b`.

**Cobertura:** A = 01, 05, 06–11, 13, 45–52, 55–64 (27) · B = 02–04, 12, 14–44 (excepto 13), 53, 54 (37) · **Total: 64.**

---

## 8. Decisiones abiertas

| ID | Decisión | Recomendación inicial | Lote |
|---|---|---|---|
| D-01 | Autenticación: Firebase o local (bcrypt + cookie) | **Resuelta (L00):** Firebase Auth + Admin SDK; Usuario en BD con `firebaseUid`, sin contraseñas | L00 |
| D-02 | Motor de producción: MySQL (nativo en Railway) o MariaDB | **Resuelta (L00):** MariaDB 11.4 LTS en ambos entornos, local y Railway (imagen Docker con volumen); sin alternativa MySQL | L00 |
| D-03 | Versiones de Node, Express y Prisma | Node LTS vigente, con versiones exactas fijadas | L01 |
| D-04 | Formato de IDs y slugs | **Resuelta (L00):** producto `Int` (el admin lo muestra como `PRD-###`); categoría y marca con slug único e inmutable; lote `Int` | L00 |
| D-05 | Dinero en JSON | **Resuelta (L00):** string decimal `"123.45"`; IVA como porcentaje `"13.00"` | L00 |
| D-06 | Sobre de respuesta y paginación | **Resuelta (L00):** `{data, meta:{page,limit,total,totalPages}}`, `limit` ≤ 100; errores `{error:{code,message,details?}}` | L00 |
| D-07 | Vencimientos de reservas, cotizaciones y lotes | Estado derivado por fecha al leer + barrido periódico en el proceso | L14 |
| D-08 | Respaldos en producción | Backups de Railway + dump externo periódico; restauración probada | L08 |
| D-09 | Alcance de la 44 (mantenimiento desde la UI) | Definirlo tras inspeccionar la vista | L18 |
| D-10 | Orden B: ofertas (10) antes que pedidos (11) y el nuevo 16 | **Resuelta (L00):** aceptada | L00 |
| D-11 | Librería de PDF | pdfkit o pdfmake (sin navegador headless) | L15 |
| D-12 | Correlativos | Tabla de secuencias por tipo y serie con `SELECT … FOR UPDATE` | L15 |
| D-13 | Antispam de reseñas | Límite de tasa por IP + honeypot | L17 |
| D-14 | Ubicación de los adaptadores en los frontends | **Resuelta (L00):** admin, dentro de los pipelines de sus stores (25, 06, 84); store, nuevo `38-pipeline-datos-api` | L00 |
| D-15 | BD de pruebas | `compustore_test` separada | L01 |
| D-16 | Stock físico: suma de lotes o campo del producto | **Resuelta (L00):** campo `stock` en Producto; con lotes, el servidor lo mantiene = Σ lotes en la misma transacción | L00 |
| D-17 | Subida de imágenes | Vía API (multer → Cloudinary) con validación de tipo y tamaño | L05 |
| D-18 | Cotización → pedido: precio cotizado o vigente | Regla de negocio que confirma el propietario | L16 |
| D-19 | Idioma de los identificadores | **Resuelta (L00):** español en BD, API y JSON; los tipos de los frontends siguen en inglés y los adaptadores traducen | L00 |

---

## 9. Registro de avance

| Lote | Fase | Funcionalidades | Estado | Commit / fecha |
|---|---|---|---|---|
| L00 | A | — | Completado | `feat(L00)` · 23-11-2026 |
| L01 | A | — | Pendiente | |
| L02 | A | — | Pendiente | |
| L03 | A | 01, 05 | Pendiente | |
| L04 | A | 07, 08 | Pendiente | |
| L05 | A | 06, 09 | Pendiente | |
| L06 | A | 10, 11, 13 | Pendiente | |
| L07 | A | 45–52, 55–64 | Pendiente | |
| L08 | A | cierre | Pendiente | |
| L09 | B | 02, 03, 04 | Pendiente | |
| L10 | B | 42, 43 | Pendiente | |
| L11 | B | 14, 15, 16 | Pendiente | |
| L12 | B | 37, 38, 39 | Pendiente | |
| L13 | B | 18–22, 26, 27 | Pendiente | |
| L14 | B | 23, 24, 25 | Pendiente | |
| L15 | B | 12, 33–36 | Pendiente | |
| L16 | B | 29–32 | Pendiente | |
| L17 | B | 40, 41, 53, 54 | Pendiente | |
| L18 | B | 17, 28, 44 · cierre | Pendiente | |

Estados posibles: Pendiente · En progreso · Completado · Bloqueado.

---

## 10. Bitácora de decisiones y conflictos

| Fecha | Lote | ID | Decisión o conflicto | Evidencia |
|---|---|---|---|---|
| 23-11-2026 | — | — | El manual v2.0 sustituye a `rutaBackEnd.md`: numeración consecutiva y alcance A/B | Este documento |
| 23-11-2026 | L00 | D-01 | Firebase Auth + Admin SDK; el Usuario se vincula por `firebaseUid` | `admin/src/06-pipeline-sesion-permisos/04-store.ts`; `admin/src/10-pipeline-cambio-contrasena/04-password.ts` |
| 23-11-2026 | L00 | D-02 | MariaDB 11.4 LTS en ambos entornos (local y Railway), confirmado por el propietario; se descarta MySQL. El despliegue en Railway se valida en L01 | CLAUDE.md; §2 |
| 23-11-2026 | L00 | D-04 | Producto `Int` (`PRD-###` solo en el adaptador del admin); categoría y marca por slug; el producto referencia la marca por FK | `store/src/01-rutas.tsx`; `admin/src/25-pipeline-persistencia-catalogo/04-types.ts` |
| 23-11-2026 | L00 | D-05 | Dinero como string decimal; IVA como porcentaje | `docs/fase-1/contratos-A.md` §1 |
| 23-11-2026 | L00 | D-06 | `{data, meta}` con page/limit/total/totalPages; en A, los adaptadores piden `limit=100` y conservan la paginación en el cliente | `admin/src/12-pipeline-listado-productos/03-usePaginatedProducts.ts` |
| 23-11-2026 | L00 | D-10 | Aceptado el orden ofertas → pedidos y el nuevo 16-mantenimiento | `admin/src/23-pipeline-seleccion-productos/03-pricePort.ts` |
| 23-11-2026 | L00 | D-14 | Adaptadores en el admin dentro de 25/06/84; en el store, nuevo pipeline 38-datos-api; sin tocar componentes | `docs/fase-1/contratos-A.md` §5 |
| 23-11-2026 | L00 | D-16 | Campo `stock` como fuente única, sincronizado con Σ lotes; FEFO | `admin/src/20-pipeline-validacion-producto/03-normalize.ts`; `admin/src/24-pipeline-inventario-productos/03-inventory.ts` |
| 23-11-2026 | L00 | D-19 | Español en BD, API y JSON; adaptadores en los frontends | §3.4 |
| 23-11-2026 | L00 | — | Conflicto: `docs/fase-0/04-propuesta-alcance.md` usa su propia numeración D-xx; prevalece la del manual | `docs/fase-0/04-propuesta-alcance.md:145` |
| 23-11-2026 | L00 | — | El hook de `pnpm check` se aplaza a L01: `api/` aún no tiene el script `check` | `api/package.json` |
| 23-11-2026 | L00 | — | La marca tiene `icon` solo en el store: columna `icono` opcional sembrada desde el store, que el admin no edita en A | `store/src/06-pipeline-datos-mock/02-marcas.mock.ts` |
| 23-11-2026 | L00 | — | `badge` no se edita en el admin, pero el store lo usa para "Destacados": columna `etiqueta` sembrada; su edición queda fuera de A | `admin/src/25-pipeline-persistencia-catalogo/04-types.ts` (ProductDraft) |
| 23-11-2026 | L00 | — | Calificación y reseñas son de la Fase B: en A, `calificacion: null` y `totalResenas: 0` | `store/src/03-modelos-producto.ts` |
| 23-11-2026 | L00 | — | El carrusel del store tiene un precio escrito a mano ("DESDE $525.00"); se resuelve en L07 | `store/src/06-pipeline-datos-mock/05-promociones.mock.ts` |
| 23-11-2026 | L00 | — | El carrito persiste un snapshot completo del producto; L07 lo revalida con `/tienda/carrito/validar` | `store/src/07-pipeline-estado-carrito/03-carrito.store.ts` |
| 23-11-2026 | L00 | — | IVA `13` en el producto frente a `0.13` en los ajustes del admin; la API usa porcentaje | `admin/src/85-pipeline-identificadores-texto/03-store.config.ts` |
| 23-11-2026 | L00 | — | El slug de producto del admin no es único; lo garantiza el servidor | `admin/src/25-pipeline-persistencia-catalogo/01-store.ts` |
| 23-11-2026 | L00 | — | Los textos de los mocks difieren entre admin y store; el seed de L02 toma el admin como fuente, más el icono de las marcas y las imágenes extra del store | `docs/fase-1/contratos-A.md` §8 |
| 23-11-2026 | L00 | — | Hay 6 cuentas demo y A requiere 2; la elección se hace en L03 | `admin/src/86-pipeline-datos-demo-personas/02-users.mock.ts` |

---

## Anexo A — `CLAUDE.md` (raíz del repositorio)

```md
# CompuStore SV — Instrucciones para Claude Code
Manual rector: docs/00-manual-implementacion.md
Antes de trabajar: leer §0, §9 y el lote en curso.

## Proyecto
- admin/ (BackOffice) y store/ (FrontOffice): React + Vite + TS, arquitectura FLOA.
- api/: Express + TS + Prisma + MariaDB, FLOA + VSA.

## Comandos (se completan en L01)
- api: pnpm dev · pnpm test · pnpm check
- admin / store: pnpm dev · pnpm build

## Reglas no negociables
- Un lote por sesión; modo plan y aprobación antes de editar.
- Cambios quirúrgicos; no modificar código funcional fuera del lote.
- No rediseñar, mover ni eliminar componentes de admin/ ni store/; solo adaptadores de datos.
- Pipelines y archivos numerados de forma consecutiva, sin saltos; nunca renumerar.
- Entre dominios solo vía 00-director-*; sin imports cruzados ni ciclos.
- No crear archivos, capas ni carpetas vacías por anticipación.
- Dinero DECIMAL, fechas UTC; importes recalculados en el servidor.
- Nunca credenciales en el código ni .env en git.
- Tras cada paso: pnpm check. Si se rompe y no se corrige en el paso: revertir.
- Al cerrar el lote: actualizar §9 y §10 del manual y hacer commit `feat(Lxx): …`.
```

## Anexo B — Prompt de arranque (L00)

```text
Lee CLAUDE.md y docs/00-manual-implementacion.md. Ejecuta el lote L00 según el protocolo §0.
No modifiques código. Inspecciona /admin (login, /productos, /categorias, marcas) y /store
(catálogo, detalle, carrito, checkout, identidad) y preséntame en modo plan:
1) los contratos de datos detectados, con rutas de archivo como evidencia;
2) tu recomendación para D-01, D-02, D-04, D-05, D-06, D-10, D-14, D-16 y D-19;
3) el contenido propuesto para docs/fase-1/contratos-A.md.
Espera mi aprobación antes de escribir.
```
