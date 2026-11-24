# 03 · Matriz de integración admin ↔ store

> **Objetivo:** traducir los inventarios de `01-inventario-admin.md` y `02-inventario-store.md` a un modelo relacional candidato, un catálogo de operaciones de API, reglas de servidor, transacciones y riesgos.
> **Naturaleza:** propuesta de análisis. Los nombres de endpoints y tablas son provisionales; no se ha creado ninguna tabla, migración ni endpoint.
> **Fecha:** 2026-11-23 · **Fase:** 0.

## Leyenda

| Marca | Significado |
| --- | --- |
| **[E]** | Comprobado en el código. |
| **[I]** | Inferencia o normalización propuesta. |
| **[P]** | Requiere decisión humana. |

---

## 1. Entidades y relaciones candidatas

### 1.1 Entidades

Se identifican **24 entidades candidatas** y **1 entidad editorial opcional** (`StorePromotion`). Varias pueden resolverse como columnas JSON o catálogos pequeños; se marcan como **[I]**.

| # | Entidad | Origen principal | Clave candidata | Datos relevantes | Persistencia actual |
| --- | --- | --- | --- | --- | --- |
| 1 | `Product` | Admin | `id` interno; `sku` único; `slug` único | `name`, `brandId`, `categoryId`, `model`, `condition`, `cost`, `price`, `originalPrice`, `taxRate`, `stock`, `reorderPoint`, `lotControl`, `active`, `badge`, `description`, `compatibility`, `connectivity` | Catálogo admin en `localStorage` |
| 2 | `ProductSpec` | Admin | `id` + `productId` | `key`, `value`, `position` | Embebido en producto |
| 3 | `ProductLot` | Admin | `id` + `productId` | `lotNumber`, `quantity`, `expiresAt` | Embebido en producto |
| 4 | `ProductImage` | Admin | `id` + `productId` | `url`, `position` | Embebido como `images[]` |
| 5 | `Category` | Admin | `id` estable; `slug` único | `name`, `icon`, `description` | `localStorage` |
| 6 | `Brand` | Admin | `id` estable; `slug` único | `name`, `website`, `description`, `active`, `createdAt` | `localStorage` |
| 7 | `Offer` | Admin | `id` (`PRM-###`) | `title`, `badge`, `description`, `discountType`, `discountValue`, `startDate`, `endDate`, `paused`, `createdAt` | `localStorage` |
| 8 | `OfferProduct` | Admin | `offerId` + `productId` | Vínculo N–M | Embebido como `productIds[]` |
| 9 | `Customer` | Admin | `id` (`CLI-###`) | `type`, `name`, `documentId`, `phone`, `email`, `city`, `address`, `notes`, `active`, `createdAt` | `localStorage` |
| 10 | `Order` | Admin | `id` (`ORD-2026-###`) | `customerId?`, snapshot de cliente, `channelId`, `date`, `total`, `status`, `paymentMethod`, `deliveryMethod`, `notes`, `reservedUntil`, `invoiceId?`, `quoteId?`, `deletedAt?`, `deletedBy?`, `deleteReason?` | `localStorage` |
| 11 | `OrderItem` | Admin | `id` + `orderId` | `productId`, `sku`, `name`, `quantity`, `unitPrice`, `discountPercent` | Embebido en pedido |
| 12 | `OrderCharge` | Admin | `id` + `orderId` | `concept`, `amount` | Embebido en pedido |
| 13 | `OrderEvent` | Admin | `id` + `orderId` | `status`, `at`, `byUserId?`, `byName`, `note?` | Embebido en pedido |
| 14 | `Invoice` | Admin | `id` = número de control; `internalId` único | `generationCode`, `receptionSeal`, `orderId`, snapshot de receptor, `paymentCondition`, `notes`, `status`, `createdAt`, `createdBy`, snapshot de emisor, `voidedAt` | `localStorage` |
| 15 | `InvoiceItem` | Admin | `id` + `invoiceId` | `kind` (`product`/`charge`), `productId?`, `description`, `unit`, `quantity`, `unitPrice`, `discount` | Embebido en factura |
| 16 | `Quote` | Admin | `id` (`COT-2026-###`) | snapshot de cliente, `notes`, `validityDays`, `status` guardado, `createdAt`, `createdBy`, snapshot de emisor | `localStorage` |
| 17 | `QuoteItem` | Admin | `id` + `quoteId` | `productId`, `sku`, `name`, `unitPrice`, `quantity`, `discountPercent` | Embebido en cotización |
| 18 | `Review` | Admin + Store | `id` | `productId`, `author`, `city`, `rating`, `comment`, `status`, `rejectReason`, `moderatedBy`, `moderatedAt`, `createdAt`, `verified` | Admin: `localStorage`; Store: memoria |
| 19 | `User` | Admin | `id` numérico | `name`, `email` único, `phone`, `roleId`, `avatar`, `active`, `passwordHash`, `mustChangePassword`, `createdAt`, `lastLoginAt` | `localStorage` |
| 20 | `Role` | Admin | `id` (`superadmin`, etc.) | `name`, `title`, `description`, `icon`, `badgeClass`, `allowedViews`, permisos | Código + `localStorage` |
| 21 | `UserAccess` | Admin | `userId` | `views[]`, `permissions[]` | Embebido en usuario |
| 22 | `Channel` | Admin | `id` | `name`, `badge`, `icon`, `color`, `description`, `active` | `localStorage` |
| 23 | `StoreSettings` | Admin + Store | Singleton | Identidad comercial, fiscales, moneda, IVA, semilla de facturación | Admin: `localStorage`; Store: constantes |
| 24 | `NumberingSequence` | Admin (implícita) | `documentType` | Prefijo, último valor, semilla, ámbito | Constantes + cálculo sobre facturas |
| 25 | `StorePromotion` | Store | `id` | `badge`, `title`, `discountText`, `description`, `ctaText`, `targetCategory`, `badgeColor`, `imageUrl`, `gradient` | Mock estático · **[P] opcional** |

**No son entidades de servidor en el MVP:** `CartItem`, `CartTotals`, `CheckoutState`, `ProductFilters`, `Session` (si se usa token), `Toast`, `ThemePreference`. Son estado de navegador o interfaz.

### 1.2 Relaciones

| Relación | Cardinalidad | Regla | Estado |
| --- | --- | --- | --- |
| `Category` → `Product` | 1–N | Todo producto tiene una categoría; no se elimina categoría con productos | **[E]** |
| `Brand` → `Product` | 1–N | El admin guarda nombre de marca, no id; se propone `brandId` | **[E]/[I]** |
| `Product` → `ProductSpec` | 1–N | Ordenadas; clave/valor | **[E]** |
| `Product` → `ProductLot` | 1–N | Solo si `lotControl`; stock = suma de lotes | **[E]** |
| `Product` → `ProductImage` | 1–N | Máximo 8; portada = primera | **[E]** |
| `Product` ↔ `Offer` | N–M | Vía `OfferProduct`; una oferta aplica a varios productos | **[E]** |
| `Customer` → `Order` | 1–N | `customerId` puede ser nulo para ocasional; el pedido conserva snapshot | **[E]** |
| `Customer` → `Quote` | 1–N | Snapshot de cliente; `customerId` puede ser nulo | **[E]** |
| `Order` → `OrderItem` | 1–N | Copia SKU, nombre y precio | **[E]** |
| `Order` → `OrderCharge` | 1–N | Máximo 6; no mueve stock | **[E]** |
| `Order` → `OrderEvent` | 1–N | Historial de estados | **[E]** |
| `Quote` → `Order` | 1–0..1 activo | Un pedido activo por cotización; al cancelar puede volver a convertirse | **[E]** |
| `Order` → `Invoice` | 1–0..1 activa | `invoiceId` se asigna al emitir y se limpia al anular; **[P]** si se permite más de una factura histórica | **[E]/[P]** |
| `Invoice` → `InvoiceItem` | 1–N | Productos y cargos; solo productos mueven stock | **[E]** |
| `Product` → `Review` | 1–N | El admin usa `PRD-###`; el store usa id numérico | **[E]/[P]** |
| `User` → `OrderEvent` | 1–N | Hoy `by` es nombre; se propone `byUserId` | **[I]** |
| `User` → `Review` | 1–N | Moderador; hoy nombre y fecha | **[E]** |
| `Role` → `User` | 1–N | Rol plantilla + accesos por usuario | **[E]** |
| `User` → `UserAccess` | 1–1 | Vistas y permisos | **[E]** |
| `Channel` → `Order` | 1–N | Hoy el pedido guarda nombre de canal; se propone `channelId` | **[E]/[I]** |
| `StoreSettings` | Singleton | Una configuración por instalación | **[E]** |
| `NumberingSequence` → `Invoice` | 1–N | Secuencia atómica por tipo de documento | **[I]** |

### 1.3 Decisiones estructurales

1. **Identidad de producto.** El admin usa `PRD-001`; el store, `1..12`. Se propone un `Product.id` único interno y `slug` público, con una tabla de mapeo temporal durante la migración. **[P]**
2. **Marca.** Migrar `Product.brand` (nombre) a `brandId`; conservar el nombre como snapshot si se requiere en documentos. **[I]**
3. **Canal.** Migrar `Order.channel` (nombre) a `channelId`; el nombre se conserva para visualización. **[I]**
4. **Snapshots.** Los documentos (`Order`, `Quote`, `Invoice`) deben conservar copia de cliente, emisor, ítems y precios; no dependen de cambios futuros del catálogo. **[E]**
5. **Borrado lógico.** `Order` conserva `deletedAt`, `deletedBy`, `deleteReason`; no se elimina físicamente. **[E]**

---

## 2. Operaciones necesarias de la API

> **Nota:** las rutas son una propuesta de contrato, no una implementación existente. Se derivan de operaciones ya presentes en hooks y stores.

### 2.1 Lectura pública

| Operación | Actor | Entrada | Salida | Efectos |
| --- | --- | --- | --- | --- |
| `GET /catalog/products` | Visitante | `category`, `brand`, `q`, `sort`, `offers`, `page` | Lista de productos públicos con `available` | Ninguno |
| `GET /catalog/products/{idOrSlug}` | Visitante | Identificador o slug | Producto, specs, imágenes, disponibilidad, rating agregado | Ninguno |
| `GET /catalog/categories` | Visitante | — | Categorías con conteo | Ninguno |
| `GET /catalog/brands` | Visitante | — | Marcas activas con conteo | Ninguno |
| `GET /catalog/availability` | Visitante | — | `{ productId: { stock, reserved, available } }` | Ninguno |
| `GET /products/{id}/reviews` | Visitante | `status=aprobado` | Reseñas publicadas y distribución | Ninguno |
| `GET /store/settings` | Visitante | — | Identidad comercial, contacto, moneda, IVA | Ninguno |

### 2.2 Escritura pública

| Operación | Actor | Entrada | Salida | Efectos |
| --- | --- | --- | --- | --- |
| `POST /products/{id}/reviews` | Visitante | `rating`, `author`, `city`, `comment` | Reseña creada con `status: pendiente` | Crea reseña; no publica |
| `POST /orders/requests` | Visitante | Ítems, entrega, nota, contacto **[P]** | Solicitud creada | **[P]** No existe hoy; requeriría definir captura de cliente |

### 2.3 Autenticación y usuarios

| Operación | Actor | Entrada | Salida | Efectos |
| --- | --- | --- | --- | --- |
| `POST /auth/login` | Usuario admin | `email`, `password` | Token/sesión + perfil | Registra `lastLoginAt` |
| `POST /auth/logout` | Usuario admin | Token | 204 | Invalida sesión |
| `GET /auth/me` | Usuario admin | Token | Usuario + rol + accesos | Ninguno |
| `POST /auth/password` | Usuario admin | Actual, nueva | 204 | Cambia hash y `mustChangePassword` |
| `GET /users` | Admin | Filtros | Usuarios | Ninguno |
| `POST /users` | Admin | Perfil + contraseña inicial | Usuario | Crea usuario |
| `PATCH /users/{id}` | Admin | Perfil, rol, estado | Usuario | Actualiza; valida último Superadmin |
| `DELETE /users/{id}` | Admin | — | 204 | Elimina; valida propia cuenta y último Superadmin |
| `PUT /users/{id}/access` | Admin | `views[]`, `permissions[]` | Accesos | Reemplaza RBAC del usuario |

### 2.4 Catálogo e inventario

| Operación | Actor | Entrada | Salida | Efectos |
| --- | --- | --- | --- | --- |
| `GET /admin/products` | Admin | Búsqueda, categoría, stock, visibilidad | Lista administrativa | Ninguno |
| `POST /products` | Admin | `ProductDraft` | Producto | Crea specs, lotes e imágenes |
| `PATCH /products/{id}` | Admin | Campos editables | Producto | Actualiza; no cambia id/slug |
| `DELETE /products/{id}` | Admin | — | 204 | **[P]** borrado físico o lógico |
| `PATCH /products/{id}/visibility` | Admin | `active` | Producto | Publica/oculta |
| `POST /products/{id}/stock` | Admin | `delta` o `quantity` | Producto | Ajusta stock o lotes |
| `POST /categories` / `PATCH` / `DELETE` | Admin | `CategoryDraft` | Categoría o 204 | Valida unicidad y productos asociados |
| `POST /brands` / `PATCH` / `DELETE` | Admin | `BrandDraft` | Marca o 204 | Valida unicidad y productos asociados |

### 2.5 Clientes, pedidos y reservas

| Operación | Actor | Entrada | Salida | Efectos |
| --- | --- | --- | --- | --- |
| `GET /customers` | Admin | Búsqueda, tipo, estado | Clientes | Ninguno |
| `POST /customers` | Admin | `CustomerDraft` | Cliente | Valida teléfono único y documento |
| `PATCH /customers/{id}` | Admin | `CustomerDraft` | Cliente | Actualiza |
| `DELETE /customers/{id}` | Admin | — | 204 | **[P]** bloqueo por historial |
| `GET /customers/{id}/stats` | Admin | — | Pedidos, gasto, última compra | Ninguno |
| `POST /orders` | Admin | Cliente, canal, pago, entrega, ítems, cargos | Pedido `registrado` | Valida stock; puede crear cliente |
| `PATCH /orders/{id}` | Admin | Ítems, cliente, cargos, notas | Pedido | Solo sin factura; revalida stock |
| `DELETE /orders/{id}` | Admin | Motivo | 204 | Borrado lógico; no facturado |
| `POST /orders/{id}/reserve` | Admin | `reservedUntil` | Pedido `confirmado` | Aparta stock; valida 1–15 días |
| `POST /orders/{id}/transition` | Admin | `action` (`deliver`/`cancel`) | Pedido | Aplica máquina de estados |
| `GET /orders/metrics` | Admin | — | Conteos e ingreso | Derivado |

### 2.6 Cotizaciones, facturas, ofertas, reseñas y ajustes

| Operación | Actor | Entrada | Salida | Efectos |
| --- | --- | --- | --- | --- |
| `POST /quotes` | Admin | Cliente, ítems, cargos, validez | Cotización `emitida` | Asigna correlativo |
| `PATCH /quotes/{id}` | Admin | Ítems, validez, notas | Cotización | Solo si no convertida **[P]** |
| `PATCH /quotes/{id}/status` | Admin | `aceptada`/`rechazada` | Cotización | Cambia estado guardado |
| `POST /quotes/{id}/convert` | Admin | — | Pedido | Crea pedido y vincula `quoteId` |
| `DELETE /quotes/{id}` | Admin | — | 204 | Bloquea si originó pedido |
| `POST /orders/{id}/invoice` | Admin | Receptor, condición de pago, notas | Factura | Revalida stock, descuenta, cierra pedido |
| `POST /invoices/{id}/void` | Admin | — | Factura anulada | Repone stock, reabre pedido |
| `GET /invoices` | Admin | Búsqueda, estado | Facturas | Ninguno |
| `GET /invoices/{id}` | Admin | — | Factura + totales | Ninguno |
| `POST /offers` | Admin | `OfferDraft` | Oferta | Valida fechas, solapamiento y costo |
| `PATCH /offers/{id}` | Admin | `OfferDraft` | Oferta | Ídem |
| `PATCH /offers/{id}/pause` | Admin | `paused` | Oferta | Activa/desactiva aplicación |
| `DELETE /offers/{id}` | Admin | — | 204 | Solo no vigente |
| `GET /reviews` | Admin | `status`, búsqueda | Reseñas | Ninguno |
| `PATCH /reviews/{id}` | Admin | `status`, `rejectReason` | Reseña | Publica/rechaza |
| `DELETE /reviews/{id}` | Admin | — | 204 | Elimina |
| `GET /settings` | Admin | — | `StoreSettings` | Ninguno |
| `PATCH /settings` | Admin | Campos editables | `StoreSettings` | Valida identidad y semilla |
| `GET /channels` / `POST` / `PATCH` | Admin | `ChannelDraft` | Canales | Administra catálogo |

---

## 3. Contratos críticos de entrada y salida

| Operación | Entrada mínima | Salida mínima | Errores esperados |
| --- | --- | --- | --- |
| Login | `email`, `password` | `token`, `user` (sin hash), `access` | Credenciales inválidas; usuario inactivo |
| Listar catálogo | `category?`, `brand?`, `q?`, `sort?`, `page?` | `items[]`, `total`, `page`, `available` | Parámetros inválidos |
| Detalle producto | `idOrSlug` | Producto público, specs, imágenes, rating, `available` | 404 |
| Disponibilidad | — | Mapa `productId → stock/reserved/available` | — |
| Crear reseña | `productId`, `rating`, `author`, `city?`, `comment` | `id`, `status: pendiente`, `createdAt` | Rating fuera de 1–5; comentario corto; producto inexistente; rate limit |
| Crear pedido | `customer` o `customerId`, `channelId`, `paymentMethod`, `deliveryMethod`, `items[]`, `charges[]`, `notes` | Pedido con `id`, `status: registrado`, `total`, `history` | Sin ítems; stock insuficiente; canal/pago/entrega inválidos; cliente inválido |
| Reservar | `orderId`, `reservedUntil` | Pedido `confirmado`, `reservedUntil` | Transición inválida; fecha fuera de 1–15 días; stock insuficiente |
| Transición | `orderId`, `action` | Pedido actualizado + evento | Transición no permitida; factura existente; pedido entregado |
| Emitir factura | `orderId`, `receptor`, `paymentCondition`, `notes` | Factura completa, `orderId`, `status: emitida`, totales | Pedido no reservado; reserva vencida; ya facturado; stock insuficiente; emisor incompleto |
| Anular factura | `invoiceId` | Factura `anulada`, pedido reabierto | Pedido entregado; factura ya anulada |
| Convertir cotización | `quoteId` | Pedido `registrado`, `quoteId` | Cotización vencida, rechazada o ya convertida |
| Crear/editar oferta | `title`, `productIds[]`, `discountType`, `discountValue`, `startDate`, `endDate` | Oferta | Fechas inválidas; solapamiento; producto bajo costo; sin productos |
| Actualizar ajustes | Campos de identidad/emisor | `StoreSettings` | Correo, teléfono, NIT, NRC, semilla inválidos |

**Convenciones [I]:** fechas ISO 8601 en servidor; montos decimales con dos cifras; precios con IVA incluido salvo que se decida lo contrario; IDs opacos en respuestas públicas; errores con código estable y mensaje legible.

---

## 4. Reglas que deben ejecutarse en el servidor

| # | Regla | Evidencia actual | Requisito de servidor | ¿Transacción? |
| --- | --- | --- | --- | --- |
| R1 | RBAC por vista y acción; el cliente solo oculta botones | `admin/src/06-pipeline-sesion-permisos/02-permissions.ts` | Autorizar cada endpoint con el permiso correspondiente | No |
| R2 | Superadmin siempre total; no dejar el sistema sin Superadmin activo | `admin/src/08-pipeline-edicion-usuarios/03-userRules.ts` | Validar en cada cambio de rol/estado | Sí, para concurrencia |
| R3 | Correo de usuario único; teléfono de cliente único; SKU único | `userRules.ts`; `customer.service.ts`; `productValidation.ts` | Restricciones únicas en base de datos | No |
| R4 | Contraseña nunca en texto plano; hash lento con sal | `admin/src/10-pipeline-cambio-contrasena/04-password.ts` | Hash en servidor; el cliente nunca lo calcula | No |
| R5 | Stock disponible = existencias − reservas vigentes | `admin/src/39-pipeline-transiciones-pedidos/03-stock.ts` | Cálculo consistente y bloqueo al reservar/facturar | Sí |
| R6 | Reserva máxima 15 días; sugerida 3; vence al final del día | `admin/src/38-pipeline-reserva-pedidos/04-reservation.ts` | Validar fecha y job de vencimiento | Sí |
| R7 | Reserva vencida vuelve el pedido a `registrado` y libera stock | `admin/src/38-pipeline-reserva-pedidos/03-useReservationExpiry.ts` | Job programado, no navegador | Sí |
| R8 | Máquina de estados fija; no cancelar facturado sin anular | `admin/src/39-pipeline-transiciones-pedidos/02-orderFlow.ts` | Validar transición en servidor | Sí |
| R9 | Solo se factura pedido reservado, vigente y sin factura | `admin/src/45-pipeline-emision-facturas/02-useInvoiceEmit.ts` | Bloqueo de pedido y stock | Sí |
| R10 | Facturar descuenta stock por FEFO; anular repone solo productos | `admin/src/24-pipeline-inventario-productos/03-inventory.ts` | Movimientos atómicos por lote | Sí |
| R11 | Pedido facturado/entregado no se elimina; borrado lógico | `admin/src/39-pipeline-transiciones-pedidos/02-orderFlow.ts` | Restricción de estado + auditoría | Sí |
| R12 | Correlativos de factura nunca se reutilizan, incluidas anuladas | `admin/src/47-pipeline-persistencia-facturas/02-invoice.service.ts` | Secuencia atómica y única | Sí |
| R13 | Semilla solo adelanta la secuencia interna; control se calcula por máximo | `invoice.service.ts`; `identity.ts` | Una sola fuente de secuencia | Sí |
| R14 | Documentos conservan snapshots de cliente, emisor, ítems y precios | Tipos de `Order`, `Quote`, `Invoice` | Copiar al emitir; no recalcular históricos | No |
| R15 | Precios con IVA incluido; costo sin IVA | `Product.price`/`cost`; `offerPricing.ts` | Definir representación decimal y redondeo | No |
| R16 | Totales de pedido, cotización y factura se calculan en servidor | Servicios de totales | No confiar en el cliente | No |
| R17 | Cargos: máximo 6, concepto 3–60, monto 0–2000, sin stock | `admin/src/78-pipeline-cargos-documentos/03-charges.ts` | Validar y guardar | No |
| R18 | Oferta: sin solapamiento, sin bajo costo, % máximo 90, fechas coherentes | `admin/src/54-pipeline-precio-ofertas/02-offerPricing.ts` | Validar contra ofertas vigentes; bloqueo o restricción | Sí |
| R19 | Una sola oferta aplica al precio; no se acumulan | `effectivePrice` toma la primera vigente | Definir precedencia estable | No |
| R20 | Cotización convertida no se elimina; solo se convierte si está vigente y sin pedido activo | `admin/src/48-pipeline-listado-cotizaciones/02-useQuotes.ts` | Bloqueo y vínculo único | Sí |
| R21 | Reseña nace `pendiente`; solo `aprobado` es pública | `admin/src/56-pipeline-persistencia-comentarios/01-store.ts`; `store/.../01-contrato-resenas.ts` | Moderación y filtro público | No |
| R22 | Un pedido solo puede tener una factura activa | `Order.invoiceId` único por pedido | Restricción única parcial | Sí |
| R23 | Cliente ocasional se registra al guardar pedido, no al cotizar | `admin/src/31-pipeline-seleccion-clientes/02-useCustomerSelection.ts` | Decidir si el servidor replica esta asimetría | Sí |
| R24 | El stock del front office no puede prometer más que `available` | `store/.../01-disponibilidad-producto.ts` | Catálogo público calcula `available` | No |

---

## 5. Operaciones que requieren transacción

| # | Operación | Pasos atómicos | Riesgo si no hay transacción |
| --- | --- | --- | --- |
| T1 | Emitir factura | Bloquear pedido → revalidar stock → asignar correlativos → crear factura e ítems → descontar lotes → marcar pedido `facturado` → evento | Factura sin stock descontado, pedido sin factura o doble descuento |
| T2 | Anular factura | Bloquear factura y pedido → marcar `anulada` → reponer lotes → desvincular factura → pedido `confirmado` con nueva reserva | Stock repuesto dos veces o pedido inconsistente |
| T3 | Reservar pedido | Bloquear pedido → calcular disponible excluyendo el propio pedido → validar fecha → guardar `reservedUntil` y estado | Sobreventa o reserva sin stock |
| T4 | Convertir cotización | Bloquear cotización → verificar que no tenga pedido activo → crear pedido con snapshots → vincular | Dos pedidos para una cotización |
| T5 | Registrar pedido con cliente nuevo | Normalizar teléfono → buscar duplicado → crear cliente → crear pedido e ítems | Cliente duplicado o pedido huérfano |
| T6 | Numerar factura | Bloquear secuencia → obtener siguiente → marcar usado → crear factura | Número repetido o salto inconsistente |
| T7 | Validar y guardar oferta | Bloquear o serializar validación → comprobar solapamiento → guardar oferta y productos | Dos ofertas incompatibles sobre el mismo producto |
| T8 | Job de reservas vencidas | Seleccionar vencidas → pasar a `registrado` → registrar evento | Reservas zombis o liberación doble |

**Observación [E]:** hoy la emisión de factura ejecuta `createInvoice`, `deductStock` y `setOrderInvoice` como llamadas separadas en `admin/src/45-pipeline-emision-facturas/02-useInvoiceEmit.ts`. La anulación hace lo propio en `admin/src/44-pipeline-listado-facturacion/02-useBilling.ts`. El backend debe agruparlas.

---

## 6. Datos calculados o derivados

| Dato | Cálculo | ¿Tabla? | Evidencia |
| --- | --- | --- | --- |
| Stock reservado por producto | Suma de cantidades de pedidos `confirmado` con reserva vigente | No | `admin/src/39-pipeline-transiciones-pedidos/03-stock.ts` |
| Disponibilidad pública | `stock − reserved`; ocultar si es 0 por reservas | No | `store/src/24-pipeline-compra-producto/01-disponibilidad-producto.ts` |
| Estado de cotización mostrado | `convertida` si hay pedido activo; `vencida` si emisión + validez pasó | No | `admin/src/51-pipeline-persistencia-cotizaciones/02-quote.service.ts` |
| Estado de oferta | `vencida`, `pausada`, `programada`, `vigente` | No | `admin/src/54-pipeline-precio-ofertas/02-offerPricing.ts` |
| Precio efectivo | Precio base menos la oferta vigente | No | Ibíd. |
| Totales de pedido | Productos con descuento + cargos | No | `admin/src/43-pipeline-reglas-pedidos/04-charges.ts` |
| Totales de cotización | Bruto, descuento, productos, cargos, total, neto, IVA, unidades | No | `admin/src/51-pipeline-persistencia-cotizaciones/02-quote.service.ts` |
| Totales de factura | Líneas con descuento, cargos, total y unidades | No | `admin/src/47-pipeline-persistencia-facturas/02-invoice.service.ts` |
| Métricas de pedidos | Conteos por estado e ingreso | No | `admin/src/42-pipeline-persistencia-pedidos/02-order.service.ts` |
| Métricas de inventario | Total, activos, stock bajo, agotados, valoración | No | `admin/src/25-pipeline-persistencia-catalogo/02-catalog.service.ts` |
| Conteos de categoría/marca | Productos por taxonomía | No | `store/src/10-pipeline-consulta-catalogo/01-consultas-productos.ts` |
| Rating y cantidad de reseñas | Agregado de reseñas aprobadas | Sí, caché opcional | Hoy estático en `Product` |
| Unidades facturadas | Suma de cantidades de líneas de producto | No | `invoiceTotals` |

**Recomendación [I]:** persistir solo datos base y snapshots; calcular totales, disponibilidad, estados y métricas en consultas o vistas. Si el volumen lo exige, cachear agregados de reseñas y métricas, nunca convertirlos en fuente de verdad.

---

## 7. Dependencias entre módulos

### 7.1 Admin

```text
Sesión/RBAC ──────────────► todos los módulos
Catálogo ◄── Inventario
   ▲   ▲
   │   └── Ofertas ──► precio efectivo ──► Pedidos / Cotizaciones
   │
Clientes ──► Pedidos / Cotizaciones / Facturación
Pedidos ◄── Reservas ──► Disponibilidad
Pedidos ──► Facturación ──► Inventario / Secuencias / Ajustes
Cotizaciones ──► Pedidos
Reseñas ──► Catálogo
Tablero ──► Catálogo / Pedidos / Ajustes
Ajustes ──► documentos / canales / respaldo
```

### 7.2 Store

```text
Identidad ──► Checkout / Contacto
Catálogo ──► Búsqueda / Filtros / Carrito / Favoritos / Reseñas / Portada
Carrito ──► Checkout
Reseñas ──► Catálogo (producto)
```

### 7.3 Dependencias cruzadas

| Dependencia | Dirección | Estado actual | Requisito |
| --- | --- | --- | --- |
| Catálogo y precios | Admin → Store | Duplicado en mocks | Una sola fuente; el store consume API |
| Disponibilidad y reservas | Admin → Store | Inexistente | Catálogo público calcula `available` |
| Ofertas | Admin → Store | Inexistente | Precio efectivo desde ofertas |
| Reseñas | Store → Admin | Inexistente | Misma entidad y estado; admin modera |
| Pedidos web/WhatsApp | Store → Admin | Inexistente | Canal `tienda-web` o `whatsapp` |
| Identidad y ajustes | Admin → Store | Duplicado | `StoreSettings` como fuente |
| Clientes | Store → Admin | Inexistente | Captura opcional y deduplicación |
| Promociones de portada | Admin → Store | Inexistente | **[P]** CMS o contenido estático |

---

## 8. Riesgos e inconsistencias

| # | Hallazgo | Evidencia | Impacto | Acción propuesta |
| --- | --- | --- | --- | --- |
| I-01 | IDs de producto incompatibles (`PRD-001` vs `1`) | `admin/.../products.mock.ts`; `store/.../productos.mock.ts` | No se pueden correlacionar ventas, reseñas ni stock | Definir id canónico y mapeo de migración **[P]** |
| I-02 | Marca por nombre en admin, slug en store | `Product.brand`; `Product.brand` | Renombres rompen equivalencias | Migrar a `brandId` y conservar slug | 
| I-03 | `specs` admin clave/valor vs store `string[]` | Tipos de ambos productos | Contratos distintos y pérdida de estructura | Normalizar a `ProductSpec[]` |
| I-04 | Ofertas admin no consumidas por store | `Offer`; `originalPrice` | Precios inconsistentes entre canales | API de precio efectivo |
| I-05 | Reservas invisibles para el store | `applyReservations` no-op | Sobreventa y promesas falsas de stock | Calcular `available` en catálogo |
| I-06 | Reseñas en dos fuentes y con ids distintos | Admin `REV-###`; store numérico | Moderación no publica en tienda | Unificar `Review` y API |
| I-07 | Checkout no crea pedido | `buildCartCheckoutUrl` | Sin reserva, métrica ni trazabilidad | Definir solicitud de pedido **[P]** |
| I-08 | IVA incluido sin desglose; cotización extrae neto; factura no | `quote.service.ts`; `invoice.service.ts` | Reportes fiscales inconsistentes | Decidir representación fiscal **[P]** |
| I-09 | Emisión/anulación sin transacción | `useInvoiceEmit.ts`; `useBilling.ts` | Datos inconsistentes ante fallo | Transacción T1/T2 |
| I-10 | Vencimiento de reservas en navegador | `useReservationExpiry.ts` | Reservas no vencen si nadie abre el panel | Job de servidor |
| I-11 | Correlativos calculados sobre facturas en cliente | `invoice.service.ts` | Duplicados con concurrencia | Secuencia atómica |
| I-12 | Cliente ocasional sin identidad estable | `Order.customerId` nullable; `Quote.customerId` nullable | Historial fragmentado | Definir deduplicación **[P]** |
| I-13 | Pedido guarda canal por nombre | `Order.channel`; `saveChannel` actualiza pedidos en cascada | Renombrar exige cascada manual; borrar canal depende de la comprobación de pedidos | `channelId` con snapshot de nombre |
| I-14 | Historial guarda autor por nombre | `OrderEvent.by` | Auditoría no confiable | `byUserId` + snapshot |
| I-15 | Reseñas de muestra se muestran si no hay reseñas | `useProductReviews` | Contenido ficticio en producción | Eliminar fallback o marcar demo |
| I-16 | `rating` y `reviewsCount` estáticos | `Product` admin/store | No reflejan reseñas reales | Agregado o caché |
| I-17 | Carrito guarda producto completo | `cart.store.ts` | Precio y stock obsoletos | Guardar id + cantidad y revalidar |
| I-18 | Promociones de portada no son ofertas | `Promotion` vs `Offer` | Campañas sin efecto en precio | Separar contenido y precio **[P]** |
| I-19 | Identidad duplicada admin/store | `STORE_CONFIG` en ambos | Mensajes y datos divergentes | `StoreSettings` público |
| I-20 | Fechas locales vs ISO | `Order.date` local; otros ISO | Errores de zona horaria y vencimientos | Estandarizar UTC + zona de negocio |

---

## 9. Contratos que deben reemplazar a los mocks

| Mock actual | Consumidor | Contrato de reemplazo | Prioridad |
| --- | --- | --- | --- |
| `store/src/06-pipeline-datos-mock/03-productos.mock.ts` | Catálogo, carrito, favoritos, portada | `GET /catalog/products` y detalle | P0 |
| `store/src/06-pipeline-datos-mock/01-categorias.mock.ts` | Categorías, filtros | `GET /catalog/categories` | P0 |
| `store/src/06-pipeline-datos-mock/02-marcas.mock.ts` | Marcas, filtros | `GET /catalog/brands` | P0 |
| `store/src/06-pipeline-datos-mock/04-resenas.mock.ts` | Ficha de producto | `GET /products/{id}/reviews` | P2 |
| `store/src/06-pipeline-datos-mock/05-promociones.mock.ts` | Portada | `GET /store/promotions` **[P]** | P2 |
| `admin/src/87-.../01-products.mock.ts` | Admin | CRUD de productos | P0 |
| `admin/src/86-.../03-customers.mock.ts` | Admin | CRUD de clientes | P0 |
| `admin/src/88-.../01-orders.mock.ts` | Admin | CRUD y transiciones de pedidos | P0 |
| `admin/src/88-.../03-invoices.mock.ts` | Admin | Emisión y consulta de facturas | P0/P1 |
| `admin/src/88-.../04-quotes.mock.ts` | Admin | CRUD y conversión de cotizaciones | P1 |
| `admin/src/87-.../04-promotions.mock.ts` | Admin | CRUD de ofertas | P1 |
| `admin/src/86-.../04-reviews.mock.ts` | Admin | Moderación | P2 |
| `admin/src/86-.../02-users.mock.ts` | Admin | Autenticación y usuarios | P0 |
| `admin/src/85-.../03-store.config.ts` | Admin y store | `GET/PATCH /settings` | P0 |

---

## 10. Decisiones que bloquean el modelo

1. **Identificador canónico de producto** y estrategia de URL pública. **[P]**
2. **Relación marca-producto**: nombre o FK. **[P]**
3. **Una o varias facturas por pedido** y tratamiento de anuladas. **[P]**
4. **Reserva en tienda**: ocultar, mostrar agotado o permitir preventa. **[P]**
5. **Captura de pedido web**: solicitud, pedido `registrado` o solo WhatsApp. **[P]**
6. **Identidad de cliente**: invitado, teléfono único o cuenta. **[P]**
7. **Tratamiento fiscal**: IVA incluido, desglosado, DTE real. **[P]**
8. **Propiedad de reseñas y promociones**: admin como única fuente. **[P]**
9. **Secuencias**: una por tipo de documento y ámbito. **[P]**
10. **Borrado**: físico o lógico por entidad. **[P]**

---

## 11. Trazabilidad

- Inventario admin: [`01-inventario-admin.md`](./01-inventario-admin.md)
- Inventario store: [`02-inventario-store.md`](./02-inventario-store.md)
- Priorización: [`04-propuesta-alcance.md`](./04-propuesta-alcance.md)
- Documentos base: `admin/arch-backOffice.md`, `store/arch-fronOffice.md`, `README.md`
- Estado del backend: `api/` solo contiene `package.json`, `pnpm-lock.yaml`, `tsconfig.json` y `node_modules`; no hay código de servidor.
