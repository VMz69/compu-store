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
- **Stock:** `físico`, `reservado` y `disponible = físico − reservado`. Nunca es negativo y todo movimiento se registra con quién, por qué y cuándo. El «por qué» es un motivo automático según el origen (ajuste rápido, edición en la ficha, lote, alta, venta…); el motivo libre escrito por el usuario no forma parte de A (L06).
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
- Códigos: 200, 201, 204, 400, 401, 403, 404, 409 (conflicto o restricción), 422 (regla de negocio), 429 (límite de tasa en escrituras públicas) y 503 (dependencia no disponible, p. ej. BD en `/health`).

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
| inventario | `registrarExistenciasIniciales(tx, …)` (L06) · `obtenerDisponibilidad(ids)` (L07) · `reservar/liberar(tx)` · `descontar/reponer(tx)` | L06 · L07 · L14 · L15 |
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
- `07-inventario`: existencias, lotes y vencimientos, ajustes manuales con usuario y motivo automático según el origen, y métricas. `obtenerDisponibilidad` pasa a L07, donde tiene consumidor.
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
| D-02 | Motor de producción: MySQL (nativo en Railway) o MariaDB | **Resuelta (L00, versión ajustada en L01):** MariaDB 11.8 LTS en ambos entornos, local y Railway (imagen `mariadb:11.8` con volumen); sin alternativa MySQL | L00 |
| D-03 | Versiones de Node, Express y Prisma | **Resuelta (L01):** Node 26 LTS; versiones exactas en `api/package.json` (Express 5.3.0, Prisma 7.10.1, Zod 4.6.7, TypeScript 6.0.3) | L01 |
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
| D-15 | BD de pruebas | **Resuelta (L01):** `compustore_test` separada, configurada en `api/.env.test` | L01 |
| D-16 | Stock físico: suma de lotes o campo del producto | **Resuelta (L00):** campo `stock` en Producto; con lotes, el servidor lo mantiene = Σ lotes en la misma transacción | L00 |
| D-17 | Subida de imágenes | **Resuelta (L05):** vía API, binario directo (`express.raw`, sin multer) → Cloudinary; máx. 1.5 MB (= `MAX_IMAGE_BYTES` del admin) con verificación de firma; sube el adaptador del admin al guardar | L05 |
| D-18 | Cotización → pedido: precio cotizado o vigente | Regla de negocio que confirma el propietario | L16 |
| D-19 | Idioma de los identificadores | **Resuelta (L00):** español en BD, API y JSON; los tipos de los frontends siguen en inglés y los adaptadores traducen | L00 |

---

## 9. Registro de avance

| Lote | Fase | Funcionalidades | Estado | Commit / fecha |
|---|---|---|---|---|
| L00 | A | — | Completado | `feat(L00)` · 23-11-2026 |
| L01 | A | — | Completado (solo local; Railway en L08) | `feat(L01)` · 23-11-2026 · rama `feat/api` |
| L02 | A | — | Completado | `feat(L02)` · 23-11-2026 · rama `feat/api` |
| L03 | A | 01, 05 | Completado (las 2 cuentas entran con Firebase real, 25-11-2026) | `feat(L03)` · 24-11-2026 · rama `feat/api` |
| L04 | A | 07, 08 | Completado | `feat(L04)` · 25-11-2026 · rama `feat/api` |
| L05 | A | 06, 09 | Completado (demo con Cloudinary real, 25-11-2026) | `feat(L05)` · 25-11-2026 · rama `feat/api` |
| L06 | A | 10, 11, 13 | Completado | `feat(L06)` · 25-11-2026 · rama `feat/api` |
| L07 | A | 45–52, 55–64 | Completado (L07A: API · L07B: store conectado; funcionalidades verificadas con API real y Chrome headless) | `feat(L07A)` + `feat(L07B)` · 25-11-2026 · rama `feat/api` |
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
| 23-11-2026 | L01 | D-03 | Node 26 LTS y versiones exactas. Se descarta `prisma@latest` (8.0.0-rc.35, una RC). TypeScript 6.0.3, porque typescript-eslint exige <6.1; se retiran TS 7, nodemon y ts-node | `api/package.json` |
| 23-11-2026 | L01 | D-15 | BD de pruebas `compustore_test`; `tests/00-setup.ts` carga `.env.test` | `api/tests/00-setup.ts` |
| 23-11-2026 | L01 | D-02 | Se fija MariaDB 11.8 LTS (la versión instalada en local, 11.8.9) en lugar de 11.4 | `mariadb --version` |
| 23-11-2026 | L01 | — | Desviación de §4: en `04-http` la validación es `01` y los errores `02`; la autenticación será `03` (L03), porque la numeración es por orden de creación y sin huecos | `api/src/04-pipeline-http/` |
| 23-11-2026 | L01 | — | Se añade el código 503 (SERVICE_UNAVAILABLE) a §3.4 para `/health` sin BD | `api/src/01-app.ts` |
| 23-11-2026 | L01 | — | Prisma 7.10.1 indica soporte para Node 20/22/24; funciona en Node 26 (generate, typecheck, ping). Si Railway da problemas, la alternativa es Node 24 LTS | aviso de `prisma` en el preinstall |
| 23-11-2026 | L01 | — | El cliente Prisma se genera en `api/generated/` (fuera de `src/`, ignorado por git) y se excluye de madge porque contiene ciclos internos | `api/prisma/schema.prisma`, `api/package.json` |
| 23-11-2026 | L01 | — | `pingBD` tiene un límite propio de 2 s: el pool de mariadb reintentaba durante unos 6 s antes de fallar | `api/src/03-pipeline-conexiones/01-prisma.ts` |
| 23-11-2026 | L01 | — | Hook de `pnpm check` en `.claude/settings.json` (pendiente desde L00) | `.claude/settings.json` |
| 23-11-2026 | L01 | D-02 | Decisión del propietario: el despliegue en Railway (MariaDB 11.8 + API) se pospone a L08; en L01 es opcional. El cierre de L01 queda demostrado solo en local (`pnpm check` en verde y `/health` → 200) | §7 L01 y L08; `api/README.md` |
| 23-11-2026 | L01 | — | Shadow DB `compustore_shadow` (mismo usuario) para `prisma migrate dev`: `shadowDatabaseUrl` opcional desde `SHADOW_DATABASE_URL`, que solo se usa en desarrollo | `api/prisma.config.ts`, `api/.env.example` |
| 23-11-2026 | L02 | P1 | `MovimientoInventario.usuarioId` opcional (`null` = sistema). El seed registra la carga inicial como movimiento (motivo "Carga inicial (seed)"), así que Σ movimientos = stock desde el primer día | `api/prisma/schema.prisma`; `api/tests/03-seed.test.ts` |
| 23-11-2026 | L02 | P2 | Seed idempotente y no destructivo: crea solo lo que falta (categoría y marca por slug; producto por id, sku o slug; configuración id = 1) y nunca sobrescribe lo editado en el admin. Conserva los ids 1–12 del store (favoritos) | `api/prisma/seed.ts` |
| 23-11-2026 | L02 | P3 | Modelos y columnas en español (camelCase) y tablas en plural snake_case con `@@map` (D-19) | `api/prisma/schema.prisma` |
| 23-11-2026 | L02 | — | Cantidades `UNSIGNED` (stock, punto de reorden, lote): la BD rechaza el stock negativo. No hay CHECK a mano: `precio > 0` y `precioAnterior > precio` se validan con Zod y en los services (L04–L06) | `api/prisma/migrations/20261124025011_modelo_a/` |
| 23-11-2026 | L02 | — | El nombre único "sin acentos" de categoría y marca lo garantiza la intercalación `utf8mb4_unicode_ci` del índice único (también sin distinguir mayúsculas), probado | `api/tests/03-seed.test.ts` |
| 23-11-2026 | L02 | — | El seed transcribe los mocks en `prisma/seed.ts` (la API no puede importar código de admin ni de store): datos del admin, más el icono de las marcas, las 3 imágenes extra por producto y la identidad del store | `api/prisma/seed.ts` |
| 23-11-2026 | L02 | — | El rol del Usuario es texto (`RoleId` del admin) y no enum, porque en L09 pasa a ser una tabla. `publicId` de Cloudinary, emisor e IVA global de la tienda no se crean por anticipado (L05 y L10) | `api/prisma/schema.prisma` |
| 23-11-2026 | L02 | D-15 | Conflicto corregido: `api/.env.test` apuntaba a `compustore` (desarrollo) y las pruebas del seed la vaciaban. Se cambió a `compustore_test` con permiso del propietario; `tests/02-bd.global-setup.ts` aplica las migraciones y aborta si la BD no termina en `_test` | `api/tests/02-bd.global-setup.ts` |
| 23-11-2026 | L02 | — | Prisma 7: `migrate reset` no ejecuta el seed por sí solo (el seed se configura en `prisma.config.ts`), y bloquea el reset lanzado por un agente de IA sin el consentimiento explícito del propietario. Se añade `pnpm db:reiniciar` (reset + seed) | `api/package.json` |
| 23-11-2026 | L02 | — | Respaldo con `mariadb-dump` (incluye `_prisma_migrations`). La restauración borra todas las tablas del destino y deja checksums idénticos en las 9 tablas; verificado en local tras borrar datos | `api/scripts/respaldo.sh`, `api/scripts/restaurar.sh` |
| 23-11-2026 | L02 | — | Además de los scripts del plan se añade `db:reiniciar`; pnpm 12 no acepta `pnpm -s` | `api/package.json` |
| 24-11-2026 | L03 | D-01 | El proyecto de Firebase ya existe con las 2 cuentas, creadas por el propietario en la consola. La API usa el Admin SDK (`firebase-admin` 14.5.1) con 3 variables extraídas del JSON de la cuenta de servicio, que queda fuera del repositorio | `api/README.md` § Firebase y acceso |
| 24-11-2026 | L03 | — | Decisión del propietario: el restablecimiento de A es el correo de Firebase, lanzado con `pnpm usuarios:vincular --enviar-restablecimiento`. `ResetPasswordModal` y los endpoints de usuarios pasan a L09 (en A no hay panel de usuarios) | `api/scripts/vincular-usuario.ts` |
| 24-11-2026 | L03 | — | Decisión del propietario: las 2 cuentas de A tienen el rol `superadmin` (acceso total) hasta el RBAC de L09. El rol se valida contra los `RoleId` del admin | `api/src/05-pipeline-acceso/02-acceso.schema.ts` |
| 24-11-2026 | L03 | — | Las cuentas se vinculan con un script idempotente (busca el uid por correo y hace upsert del Usuario por `firebaseUid`). No crea cuentas ni recibe contraseñas, y al repetirse no reactiva una cuenta desactivada | `api/scripts/vincular-usuario.ts`; `tests/04-acceso.test.ts` |
| 24-11-2026 | L03 | — | Desviación de §4: el middleware de autenticación es `04-http/03` (genérico: token → identidad) y en `05-acceso` se añade `02-acceso.schema` (política de contraseñas), así que la autorización pasa a `05-autorizacion`. Numeración por orden de creación, sin huecos | `api/src/04-pipeline-http/`, `api/src/05-pipeline-acceso/` |
| 24-11-2026 | L03 | — | `/api/v1/admin/*` se protege en bloque (`autenticar` = 401 + 403) antes de cualquier ruta: una ruta inexistente da 401 sin token y 404 solo a un usuario habilitado. El proveedor de identidad se inyecta en `crearApp` y las pruebas usan uno falso | `api/src/01-app.ts` |
| 24-11-2026 | L03 | — | `GET /admin/sesion` restaura la sesión y `POST /admin/sesion` registra `ultimoAcceso` (inicio). El cambio de contraseña (`PUT /admin/sesion/contrasena`) se hace en el servidor con el Admin SDK, que revoca los tokens (`verifyIdToken(…, checkRevoked)`); el admin vuelve a iniciar sesión con la contraseña nueva | `api/src/05-pipeline-acceso/01-acceso.routes.ts` |
| 24-11-2026 | L03 | — | Las variables de Firebase son opcionales en `02-env` para que seed, respaldo y pruebas funcionen sin credenciales; `00-main` se niega a arrancar si faltan. Un valor vacío (`CLAVE=`) cuenta como ausente | `api/src/02-env.ts`, `api/src/00-main.ts` |
| 24-11-2026 | L03 | — | Vitest con `fileParallelism: false`: `03-seed.test` vacía `usuarios` y competía con `04-acceso.test` sobre la misma BD de pruebas | `api/vitest.config.ts` |
| 24-11-2026 | L03 | — | pnpm 12 bloquea los scripts de build de `@firebase/util` y `protobufjs` (solo comprobaciones posteriores a la instalación): se marcan `false` en `allowBuilds` (api y admin) | `api/pnpm-workspace.yaml`, `admin/pnpm-workspace.yaml` |
| 24-11-2026 | L03 | D-14 | Admin: el cliente HTTP (`84/05-api.client`) recibe por inyección el token y la reacción a 401/403, para que 84 no importe de 06. La sesión vive en `06/06-sesion.api` (Firebase web SDK + mapeo API → `User`). El store conserva su interfaz pública; sus únicos agregados son `isCurrentPassword` y un cambio de una línea en `usePasswordForms` (regla "distinta de la temporal" mediante reautenticación) | `admin/src/06-pipeline-sesion-permisos/06-sesion.api.ts` |
| 24-11-2026 | L03 | — | Admin: el store de acceso v6 descarta los usuarios demo y sus hashes; `users` contiene solo al usuario de la sesión. Ajustes › Usuarios (alta, edición, restablecimiento de otros) sigue con escrituras locales: se bloquea en L08 y se conecta en L09 | `admin/src/06-pipeline-sesion-permisos/04-store.ts` |
| 24-11-2026 | L03 | — | Pendiente para L09: hoy cualquier 401/403 de la API cierra la sesión en el admin. Cuando `requierePermiso` devuelva 403 por falta de permiso, solo deberá cerrar la sesión el 401 o el 403 de cuenta deshabilitada | `admin/src/84-pipeline-persistencia-demo/05-api.client.ts` |
| 24-11-2026 | L03 | — | Con el SDK de Firebase, el bundle del admin queda en unos 907 kB (aviso de Vite > 500 kB); la división en chunks se evalúa en L08 | `pnpm -C admin build` |
| 25-11-2026 | L03 | — | Cierre demostrado: las 2 cuentas (`superadmin`) se vincularon con `pnpm usuarios:vincular` y entran al panel | `usuarios` #1 y #2 en `compustore` |
| 25-11-2026 | L04 | — | Desviación de §4: en `06-catalogo` la taxonomía se crea primero y toma 01–04 (`taxonomia.routes/schema/service/repository`); los productos (L05) tomarán 05–08. Numeración por orden de creación | `api/src/06-pipeline-catalogo/` |
| 25-11-2026 | L04 | — | Nuevo `04-http/04-paginacion` (page ≥ 1, limit 1–100 con 100 por defecto, `meta` de D-06), reutilizable en L05–L07 | `api/src/04-pipeline-http/04-paginacion.ts` |
| 25-11-2026 | L04 | — | Respaldo genérico de errores de Prisma en `02-errores`: P2002/P2003 → 409, P2025 → 404. Los services responden antes con mensajes propios (nombre repetido, eliminación con productos) | `api/src/04-pipeline-http/02-errores.middleware.ts` |
| 25-11-2026 | L04 | D-04 | Slug de categoría y marca generado en el servidor con la misma función que el admin, con sufijo `-2`, `-3`… si ya existe; inmutable al renombrar. El nombre repetido se detecta con la intercalación `utf8mb4_unicode_ci` (sin acentos ni mayúsculas) | `api/src/06-pipeline-catalogo/03-taxonomia.service.ts` |
| 25-11-2026 | L04 | — | Públicos: `GET /tienda/categorias` (todas: la categoría no tiene estado) y `GET /tienda/marcas` (solo activas), ambos con `totalProductos` contando solo los publicados y sin `activa`/`creadaEn` | `api/src/06-pipeline-catalogo/01-taxonomia.routes.ts` |
| 25-11-2026 | L04 | — | Pruebas: helper `tests/05-sesion-prueba.ts` (proveedor falso + usuario habilitado) reutilizable; `06-taxonomia.test` usa `sembrar()` (idempotente) para tener categorías y marcas con productos | `api/tests/` |
| 25-11-2026 | L04 | D-14 | Admin: `deleteCategory`/`deleteBrand`/`toggleBrand` conservan su firma síncrona y son optimistas (si la API falla, se revierte y se avisa); `saveCategory`/`saveBrand` esperan a la API. La taxonomía se carga al iniciar o restaurar la sesión mediante `onAuthenticated` del cliente (84), sin que 25 importe de 06 | `admin/src/25-pipeline-persistencia-catalogo/01-store.ts` |
| 25-11-2026 | L04 | — | Hasta L05 los productos del admin siguen siendo de demostración: los conteos y el bloqueo de eliminación de la UI salen de ellos (coinciden con el seed) y el servidor impone el 409 real. Renombrar una marca sigue actualizando en cascada el nombre en esos productos locales | `admin/src/26-…/03-useCategoriesTab.ts`, `28-…/03-useBrandsTab.ts` |
| 25-11-2026 | L04 | — | Corrección de L03: el token espera `auth.authStateReady()`, porque al recargar una petición previa a la restauración de Firebase salía sin token, recibía 401 y cerraba la sesión | `admin/src/06-pipeline-sesion-permisos/06-sesion.api.ts` |
| 25-11-2026 | L05 | D-17 | Binario directo (`POST /admin/imagenes`, `Content-Type` image/png\|jpeg\|webp) en lugar de multer: sin dependencia nueva. Límite 1.5 MB, el mismo `MAX_IMAGE_BYTES` que ya impone `useImagePicker`; el 400 con "La imagen supera 1.5 MB…" se ve en el toast existente. Se valida la firma de bytes, no solo la cabecera. Sube el adaptador del admin al guardar el producto | `api/src/06-pipeline-catalogo/09-imagenes.service.ts`; `admin/src/25-pipeline-persistencia-catalogo/05-catalogo.api.ts` |
| 25-11-2026 | L05 | D-17 | Huérfanas: la subida queda en `imagenes_pendientes` hasta que un producto la adopta (`imagenes_producto.publicId`). Si el guardado falla, el admin la descarta en el acto (`DELETE /admin/imagenes/:id`); cada subida barre las pendientes de más de 1 h; lo retirado de un producto se destruye tras el commit y, si Cloudinary falla, se reencola. Las URLs externas (`publicId` null) nunca se destruyen | migración `imagenes_cloudinary`; `tests/08-productos.test.ts` |
| 25-11-2026 | L05 | — | Cloudinary con 3 variables separadas (sin `CLOUDINARY_URL`), opcionales en `02-env` y exigidas por `00-main` como Firebase. SDK `cloudinary` 2.11.0; se destruye con la Upload API (`destroy`), que no consume la cuota de la Admin API. `crearApp` recibe el almacén por inyección (`imagenes`) y las pruebas 01/04/06 pasan uno falso | `api/src/03-pipeline-conexiones/03-cloudinary.ts`; `api/tests/07-imagenes-prueba.ts` |
| 25-11-2026 | L05 | — | Decisión del propietario: en L05 solo se acepta el stock inicial del alta, registrado como movimiento del usuario ("Alta de producto"). Lo escribe el repositorio de catálogo porque `07-inventario` aún no existe; en L06 pasa al director de inventario. Al editar no viajan stock ni lotes; en el admin, ±, el control por lotes y los cambios de stock avisan "disponible con el módulo de inventario (L06)" sin escribir nada local | `api/src/06-pipeline-catalogo/08-productos.repository.ts`; `admin/src/25-…/01-store.ts` |
| 25-11-2026 | L05 | — | Decisión del propietario: eliminar un producto con movimientos responde 409 "Tiene historial de inventario: ocúltalo de la tienda y, si corresponde, ajusta su stock a 0" (todos los del seed tienen la carga inicial). Sin movimientos se elimina junto con sus imágenes de Cloudinary | `api/src/06-pipeline-catalogo/07-productos.service.ts` |
| 25-11-2026 | L05 | — | SKU opcional: vacío o null = automático `PRD-###` con el id (se guarda uno provisional `TMP-…` dentro de la misma transacción). El slug del producto se genera con el `slugUnico` de taxonomía (ahora exportado) y es inmutable. Una marca inactiva no se asigna, salvo que el producto ya la tenga (422) | `api/src/06-pipeline-catalogo/07-productos.service.ts` |
| 25-11-2026 | L05 | — | `obtenerProductosVendibles` (§5) se pospone a L07, donde tiene consumidor ("no crear por anticipación"). `GET /tienda/productos[/:id]` se crea ya, sin filtros, para demostrar el cierre; L07 añade búsqueda, filtros y orden | `api/src/06-pipeline-catalogo/05-productos.routes.ts` |
| 25-11-2026 | L05 | — | `02-errores`: un cuerpo mayor que el límite del parser (`entity.too.large`) respondía 500; ahora 400 `VALIDATION_ERROR` | `api/src/04-pipeline-http/02-errores.middleware.ts` |
| 25-11-2026 | L05 | — | Pruebas: el helper del almacén falso toma `tests/07` y la suite de productos `tests/08` (numeración por orden de creación) | `api/tests/` |
| 25-11-2026 | L05 | D-14 | Admin: los productos se cargan con la taxonomía en `onAuthenticated` (paginando de 100 en 100); persist v5 descarta la caché demo. `deleteProduct` y `toggleActive` son optimistas con reversión (patrón de L04). Cambios mínimos fuera del adaptador/store: `adjustStock` devuelve si se aplicó y `useProductActions` solo anuncia el éxito en ese caso; `useProductForm` atrapa el error de `saveProduct` para que el modal siga abierto | `admin/src/24-…/01-useProductActions.ts`; `admin/src/18-…/02-useProductForm.ts` |
| 25-11-2026 | L06 | — | Decisión del propietario: el motivo de cada movimiento es automático según el origen (`Ajuste rápido (±n)`, `Edición de existencias`, `Lote X: creado/ajustado/retirado`, `Paso a control por lotes`, `Paso a stock manual`, `Alta de producto`); lo genera el servidor y el navegador no lo envía. Se corrigen §3.2 y §7 L06: el motivo libre no forma parte de A. Sin cambios de interacción en la UI | `api/src/07-pipeline-inventario/03-inventario.service.ts`, `05-lotes.service.ts` |
| 25-11-2026 | L06 | — | Decisión del propietario: `obtenerDisponibilidad` se pospone a L07 (consumidor: `/tienda/carrito/validar`), con el mismo criterio que `obtenerProductosVendibles` en L05. Se corrigen §5 y §7 | §5 |
| 25-11-2026 | L06 | — | Decisión del propietario: la valoración es Σ precio × stock (la fórmula que ya usaba el admin), no con costo como decía `docs/fase-0/01-inventario-admin.md`. `GET /admin/inventario/metricas` → `{total, publicados, stockBajo, agotados, valoracion}`, con agregados en SQL y la valoración como string decimal (D-05); una prueba la compara con un recálculo independiente | `api/src/07-pipeline-inventario/04-inventario.repository.ts`; `tests/09-inventario.test.ts` |
| 25-11-2026 | L06 | — | Concurrencia: cada escritura de inventario bloquea la fila del producto (`SELECT … FOR UPDATE`) dentro de `$transaction` antes de leer el stock; `UNSIGNED` queda como red de seguridad. Probado: stock 3 y 8 ajustes −1 simultáneos → 3 × 200 y 5 × 422, stock 0; Σ movimientos = stock en todo el catálogo al terminar la suite. Es el mecanismo previsto para L14 | `api/src/07-pipeline-inventario/04-inventario.repository.ts` |
| 25-11-2026 | L06 | — | Endpoints: `POST /admin/productos/:id/ajustes {delta}` (solo sin lotes; 422 si quedaría negativo), `PUT /admin/productos/:id/existencias {controlLotes, stock \| lotes, stockEsperado}` (409 si el stock cambió desde que se abrió la ficha; lotes por id: sin id = nuevo, ausente = retirado) y `GET /admin/inventario/metricas`. Responden solo la parte de inventario (`{productoId, stock, controlLotes, lotes}`) para que inventario no dependa de catálogo | `api/src/07-pipeline-inventario/01-inventario.routes.ts` |
| 25-11-2026 | L06 | — | El alta (`POST /admin/productos`) acepta `controlLotes` + `lotes` y delega en `registrarExistenciasIniciales` del director de inventario dentro de la transacción del catálogo (§3.1.6); `fijarStock` y `registrarStockInicial` salen de `08-productos.repository`. Dependencia catálogo → inventario, sin ciclos | `api/src/06-pipeline-catalogo/07-productos.service.ts` |
| 25-11-2026 | L06 | — | Un lote retirado registra su movimiento antes de borrarse; por `onDelete: SetNull` ese movimiento queda con `loteId` null y el número del lote se conserva en el motivo. Cambiar solo el vencimiento no genera movimiento. Los lotes se devuelven por id (el orden del formulario); el FEFO y el estado «vencido» derivado se aplican donde tienen consumidor (L14–L15, D-07) | `api/src/07-pipeline-inventario/05-lotes.service.ts` |
| 25-11-2026 | L06 | — | Numeración de `07-inventario`: 00-director, 01-routes, 02-schema, 03-service, 04-repository, 05-lotes.service (coincide con §4). Pruebas en `tests/09-inventario.test.ts` | `api/src/07-pipeline-inventario/` |
| 25-11-2026 | L06 | D-14 | Admin: `adjustStock` es optimista y deshace solo su delta si la API falla; `saveProduct` guarda el producto (PATCH) y, si la ficha cambió las existencias, hace el PUT con `stockEsperado` = el stock que se vio al abrirla. Si el PUT falla, la caché conserva los datos ya guardados y el modal sigue abierto. Se retira el aviso «disponible con el módulo de inventario (L06)». `useInventoryMetrics` lee las métricas de la API (se refrescan tras cada escritura) y se elimina el cálculo local `getInventoryMetrics`. Sin cambios en componentes | `admin/src/25-pipeline-persistencia-catalogo/01-store.ts`, `05-catalogo.api.ts`; `admin/src/24-…/02-useInventoryMetrics.ts` |
| 25-11-2026 | L07 | — | Decisión del propietario: L07 se divide en L07A (API, con pruebas de integración completas para que L07B parta de contratos estables) y L07B (adaptadores del store, en otra sesión). El cierre de L07 se demuestra al terminar L07B | §0 (LxxA/LxxB) |
| 25-11-2026 | L07A | — | `GET /tienda/productos` con `q`, `categoria`, `marca`, `ofertas`, `orden` y paginación. El orden por expresión (destacados, descuento) no cabe en `orderBy` de Prisma: una consulta SQL parametrizada (`Prisma.sql`) obtiene los ids de la página y el `COUNT`, y `findMany` trae el detalle. LIKE con `%`/`_` escapados; sin mayúsculas ni acentos por `utf8mb4_unicode_ci`. Destacados usa `etiqueta <=> 'Destacado'`: con `=`, una etiqueta NULL quedaba al final (lo detectó la prueba) | `api/src/06-pipeline-catalogo/08-productos.repository.ts`; `tests/10-tienda.test.ts` |
| 25-11-2026 | L07A | — | `GET /tienda/productos/:id/relacionados?limit` (1–12, 4 por defecto): misma categoría o marca, por id, como `getRelatedProducts` del store | `api/src/06-pipeline-catalogo/05-productos.routes.ts` |
| 25-11-2026 | L07A | — | Contratos §5: `obtenerProductosVendibles(ids)` (catálogo, precio base hasta L12) y `obtenerDisponibilidad(ids)` (inventario, stock físico; en L14 físico − reservado con el mismo contrato). Las consume `08-tienda` a través de los directores: tienda → catálogo → inventario, sin ciclos | `api/src/08-pipeline-tienda/03-tienda.service.ts` |
| 25-11-2026 | L07A | — | No se crea un endpoint propio de disponibilidad porque no tendría consumidor: la cubren el campo `disponible` del producto público y `POST /tienda/carrito/validar` | §7 L07 |
| 25-11-2026 | L07A | — | `POST /tienda/carrito/validar`: importes en centavos enteros y string decimal; `strictObject` rechaza precios o totales del navegador; los ids repetidos → 400. `precioUnitario`/`nombre` son `null` en `no-disponible` (contratos-A §4.5) | `api/src/08-pipeline-tienda/` |
| 25-11-2026 | L07A | — | Límite de tasa propio (`04-http/05-limite-tasa`): ventana fija en memoria por IP, sin dependencia nueva (una sola instancia en Railway); 30/min en validar el carrito y reutilizable en L17 (D-13). Nuevo código `TOO_MANY_REQUESTS` 429, agregado a §3.4 | `api/src/04-pipeline-http/05-limite-tasa.ts` |
| 25-11-2026 | L07A | — | `GET /tienda/identidad` (contratos-A §4.6), desde `ConfiguracionTienda` id = 1; 404 si no existe | `api/src/08-pipeline-tienda/01-tienda.routes.ts` |
| 25-11-2026 | L07B | D-14 | Decisiones del propietario para L07B: (1) el pipeline es `store/src/38-pipeline-datos-api` (el último era 37); (2) precarga al arrancar (identidad, categorías, marcas y todos los productos publicados, de 100 en 100), y las vistas siguen síncronas con las funciones puras existentes; (3) si la API no responde al iniciar, se muestra un mensaje de error con reintento, sin rediseñar la UI y **nunca** cayendo a los mocks. Límite asumido: la precarga sirve para un catálogo pequeño; los precios o el stock desactualizados en el navegador los corrige `POST /tienda/carrito/validar` antes de WhatsApp | conversación L07 |
| 25-11-2026 | L07B | — | Precarga en `main.tsx`: identidad, categorías, marcas y productos publicados (`38/04-precarga`) antes del primer render; la app se importa después (`import()` dinámico) para que los módulos que leen `STORE_CONFIG` al cargarse (p. ej. las redes del pie) ya encuentren la identidad, sin tocar componentes. Con la API caída se muestra el `EmptyState` existente con «Reintentar»; nunca hay datos de muestra (verificado: API apagada → error; API de vuelta + Reintentar → la tienda carga) | `store/src/main.tsx`; `store/src/38-pipeline-datos-api/` |
| 25-11-2026 | L07B | D-14 | `38-pipeline-datos-api`: 01 cliente `fetch` (`VITE_API_URL`, 15 s, recorre páginas de 100), 02 adaptadores (API → `Product`/`Category`/`Brand`/`STORE_CONFIG`; `specs = "clave: valor"`, `stock = disponible`, `rating = calificacion ?? 0`), 03 catálogo precargado (los mismos arreglos que exportaban los mocks, rellenados en el mismo lugar), 04 precarga y 05 validación del carrito. Los consumidores solo cambian el import; los filtros, conteos y relacionados siguen con sus funciones puras sobre los datos reales | `store/src/38-pipeline-datos-api/` |
| 25-11-2026 | L07B | — | `STORE_CONFIG` queda sin datos de negocio (valores vacíos) y lo rellena `aplicarIdentidad` desde `/tienda/identidad`. El enlace `wa.me` se calcula en cada llamada. Pasan a la identidad los `.ts` de la capa de datos: mensajes de pedido y de producto, pilares de confianza, asuntos de contacto, ciudad por defecto de la reseña y placeholder del buscador. Si hay un solo teléfono, el adaptador lo repite porque la vista de contacto usa `phones[1]` | `store/src/01-pipeline-identidad-tienda/01-identidad.config.ts` |
| 25-11-2026 | L07B | — | Deuda (decisión del propietario: no tocar componentes): siguen literales de negocio dentro de 11 `.tsx` (Cojutepeque, Dollar City, El Salvador: checkout, ficha, garantías, contacto, pie, vistas de categorías y marcas, resumen de calificaciones, formulario de reseña). Se resuelven en L10 junto con la edición de la identidad. `index.html` (title y description) pasa a L08 con Open Graph | `grep` en `store/src/**/*.tsx` |
| 25-11-2026 | L07B | — | Validación del carrito: `useCartValidation` valida al abrir el carrito y tras cada cambio de ids o cantidades (300 ms); aplica precio, nombre y existencias del servidor (`applyValidation`), recorta las líneas ajustadas, retira las agotadas o no disponibles y avisa con los toasts existentes. `whatsappUrl` solo se arma con las líneas ya validadas; mientras valida (o si la API falla, con aviso) vale `'#'`. No crea pedidos ni reserva stock. El hook vive en `08/05` y no en 07 porque 38 importa el carrito para depurarlo (evita el ciclo 07 ↔ 38; madge sin ciclos) | `store/src/08-pipeline-vista-carrito/05-validacion-carrito.ts` |
| 25-11-2026 | L07B | — | Carrito y favoritos persistidos: al arrancar se descartan sin avisar los ids que no están en el catálogo publicado (p. ej. de la versión de muestra), y las líneas del carrito toman la copia vigente del producto (`purgeUnknown`). Las claves de almacenamiento no cambian | `store/src/38-pipeline-datos-api/04-precarga.ts` |
| 25-11-2026 | L07B | — | Carrusel: `discountText` es una plantilla. `{precioMinimo}` toma el precio más bajo de la categoría (o «CONSULTA PRECIOS») y `{descuento}` el mayor % entre productos con precio anterior real (o «PRECIOS ESPECIALES», sin % hasta L12). Con el seed: «HASTA 18% DESCUENTO» (audio), «DESDE $525.00» (computadoras), «HASTA 20% OFF» (gaming). Las promociones siguen locales en `06/05` | `store/src/26-pipeline-presentacion-portada/02-estado-promociones.ts` |
| 25-11-2026 | L07B | — | Mocks eliminados: `06/01–04` (categorías, marcas, productos y reseñas). `05-promociones` conserva su número (nunca se renumera), así que queda un hueco intencional. Las reseñas no tienen datos ficticios: la sección muestra 0 opiniones y la lista vacía hasta L17 | `store/src/06-pipeline-datos-mock/` |
| 25-11-2026 | L07B | — | Límites aceptados: la precarga es apropiada para un catálogo pequeño (decenas o pocos cientos de productos); los precios o el stock que queden desactualizados en el navegador los corrige `POST /tienda/carrito/validar` antes de WhatsApp. El WhatsApp de producto único (ficha) usa el precio precargado: es una consulta, no un pedido. La búsqueda del store conserva su regla original (sin mayúsculas, pero distingue acentos), mientras que la de la API ignora también los acentos | `store/src/10-pipeline-consulta-catalogo/01-consultas-productos.ts` |
| 25-11-2026 | L07B | — | Verificación con la API y la BD de desarrollo en Chrome headless (CDP), una por una: 45 identidad, 46 wa.me, 47 listado, 48 búsqueda y sugerencias, 49 ofertas y orden, 50 conteos, 51 detalle y relacionados, 52 disponibilidad, 55–57 carrito (ajuste a 1 unidad, aviso y depuración), 58–59 mensaje validado, 60 favoritos depurados, 61 tema, 62 carrusel, 63–64 contacto e información. Store: `build`, `lint`, madge sin ciclos y `tests/ui-traceability` 11/11 | scripts de verificación fuera del repo |
| 25-11-2026 | L07B | — | `store/.env.example` (nuevo) con `VITE_API_URL` y `VITE_UI_TRACEABILITY`; `store/.env` sigue fuera de git | `store/.env.example` |

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
