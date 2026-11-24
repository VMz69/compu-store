# 01 · Inventario funcional de `/admin`

> **Alcance:** back office de CompuStore SV. Se inventarian funcionalidades con efecto sobre datos, reglas o persistencia; se excluyen componentes puramente visuales.
> **Método:** lectura directa de tipos, stores, servicios, validadores, mocks y hooks. Cada hallazgo se contrastó con al menos un archivo fuente.
> **Fecha:** 2026-11-23 · **Fase:** 0 · **Estado:** análisis, sin cambios de código.

## Leyenda

| Marca | Significado |
| --- | --- |
| **[E]** | Evidencia comprobada en código. |
| **[I]** | Inferencia razonable a partir del código, pendiente de validación. |
| **[P]** | Aspecto no definido o pendiente de confirmación humana. |

## Resumen

| Indicador | Valor |
| --- | --- |
| Dominios funcionales | 12 |
| Funcionalidades inventariadas | 44 |
| Entidades y modelos relevantes | 20, varias embebidas en documentos |
| Persistencia | `localStorage` por dominio, sin backend |
| Autenticación | Simulada en navegador, hash SHA-256 con sal solo para la demo |
| RBAC | 10 vistas, 16 permisos, 5 plantillas de rol |
| Backend | `/api` sin implementación |

---

## 1. Sesión, usuarios y RBAC

**Dependencias:** todos los módulos consumen `ensurePermission` o `usePermission`. **Persistencia:** `compustore_sv_bo_access_v1`.

| Funcionalidad | Entidades | Operaciones | Datos | Reglas | Persistencia actual | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| Inicio y cierre de sesión | `User`, `Session` | `login`, `logout`, restaurar sesión | Correo, contraseña, `active`, `passwordHash`, `mustChangePassword`, `lastLoginAt`, `session.userId` | Correo es el login; mensaje de error genérico; usuario inactivo no entra; sesión guarda solo el id y el rol se relee del usuario vigente | `localStorage`; latencia simulada | `admin/src/06-pipeline-sesion-permisos/04-store.ts`; `admin/src/10-pipeline-cambio-contrasena/04-password.ts` |
| Administración de usuarios | `User`, `Role` | Crear, editar, activar/desactivar, eliminar, restablecer contraseña | `id`, `name`, `email`, `phone`, `role`, `access`, `avatar`, `active`, `passwordHash`, `mustChangePassword`, `createdAt`, `lastLoginAt` | Correo único normalizado; no eliminar ni desactivar la propia cuenta; no dejar el sistema sin Superadmin activo; contraseña mínima de 8 caracteres | `localStorage`; operaciones con `delay()` | `admin/src/08-pipeline-edicion-usuarios/03-userRules.ts`; `admin/src/07-pipeline-administracion-usuarios/02-useUsersAdmin.ts` |
| Plantillas de rol | `Role`, `RoleId` | Consultar plantilla, aplicar a usuario | `id`, `name`, `title`, `description`, `allowedViews`, 16 permisos booleanos | 5 roles: `superadmin`, `gerencia`, `administracion`, `caja_inventario`, `servicio_cliente`; el rol es plantilla inicial, no un permiso estático; Superadmin siempre total | `localStorage`; plantillas en código | `admin/src/86-pipeline-datos-demo-personas/01-roles.mock.ts`; `admin/src/06-pipeline-sesion-permisos/03-access.ts` |
| Accesos por vista y acción | `UserAccess` | Editar vistas y permisos por usuario | `views[]`, `permissions[]` | Solo se permiten acciones de vistas habilitadas; accesos se normalizan y ordenan; Superadmin no editable | `localStorage` | `admin/src/06-pipeline-sesion-permisos/03-access.ts`; `admin/src/09-pipeline-accesos-por-vista/02-views.config.ts` |
| Cambio de contraseña | `User` | Cambiar contraseña propia o forzada | Contraseña actual, nueva, confirmación, `mustChangePassword` | Verifica contraseña actual; política mínima; guarda hash con sal; nunca texto plano | `localStorage` | `admin/src/10-pipeline-cambio-contrasena/04-password.ts`; `admin/src/06-pipeline-sesion-permisos/04-store.ts` |

**Permisos:** `canManageUsers` para CRUD de usuarios. **Observación [P]:** el hash de contraseña se ejecuta en el navegador; en producción debe migrar al servidor con bcrypt/argon2id. El propio código lo advierte.

---

## 2. Catálogo y taxonomía

**Dependencias:** Inventario, Pedidos, Cotizaciones, Ofertas, Reseñas y Front Office consumen productos. **Persistencia:** `compustore_sv_bo_catalog_v1`.

| Funcionalidad | Entidades | Operaciones | Datos | Reglas | Persistencia actual | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| Gestión de productos | `Product`, `ProductSpec`, `ProductLot` | Crear, editar, eliminar, listar, buscar, filtrar | `id` (`PRD-###`), `sku`, `name`, `slug`, `brand`, `model`, `condition`, `category`, `cost`, `price`, `originalPrice`, `taxRate`, `stock`, `reorderPoint`, `lotControl`, `lots[]`, `active`, `badge`, `rating`, `images[]`, `description`, `compatibility`, `connectivity`, `specs[]` | Nombre mínimo 3; categoría y marca obligatorias; SKU único con patrón `^[A-Z0-9][A-Z0-9-]{1,31}$`; precio mayor que 0; costo no negativo; precio anterior mayor que el actual; IVA 0–100; máximo 8 imágenes sin duplicados; especificaciones clave/valor completas; slug e id no cambian al editar | `localStorage`; datos iniciales de 12 productos | `admin/src/25-pipeline-persistencia-catalogo/04-types.ts`; `admin/src/20-pipeline-validacion-producto/02-productValidation.ts`; `admin/src/25-pipeline-persistencia-catalogo/01-store.ts` |
| Gestión de categorías | `Category` | Crear, editar, eliminar | `id`, `name`, `slug`, `icon`, `description` | Nombre 3–40 y único; descripción máximo 160; id y slug no cambian; no se elimina una categoría con productos | `localStorage`; 5 categorías iniciales | `admin/src/25-pipeline-persistencia-catalogo/03-taxonomy.ts` |
| Gestión de marcas | `Brand` | Crear, editar, activar/desactivar, eliminar | `id`, `name`, `slug`, `website`, `description`, `active`, `createdAt` | Nombre 2–40 y único; URL válida opcional; no se elimina una marca con productos, se desactiva; el producto guarda el **nombre** de la marca y el renombrado se propaga | `localStorage`; 8 marcas iniciales | `admin/src/25-pipeline-persistencia-catalogo/03-taxonomy.ts`; `admin/src/87-pipeline-datos-demo-productos/03-brands.mock.ts` |
| Publicación web | `Product.active` | Mostrar/ocultar | `active` | Un producto inactivo no se ofrece al Front Office; se conserva para historial y documentos | `localStorage` | `admin/src/24-pipeline-inventario-productos/01-useProductActions.ts`; `admin/src/09-pipeline-accesos-por-vista/02-views.config.ts` |

**Permisos:** `canCreateProduct`, `canEditProduct`, `canDeleteProduct`, `canToggleVisibility`, `canManageTaxonomy`. **Dependencia crítica:** el Front Office usa `slug` de categoría y marca, no sus ids. **[P]** La marca se almacena por nombre en el producto, lo que dificulta una FK relacional limpia.

---

## 3. Inventario y lotes

**Dependencias:** Catálogo, Pedidos, Facturación. **Persistencia:** dentro de `compustore_sv_bo_catalog_v1`.

| Funcionalidad | Entidades | Operaciones | Datos | Reglas | Persistencia actual | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| Existencias y lotes | `Product`, `ProductLot` | Editar stock, editar lotes, consultar severidad | `stock`, `lotControl`, `lots[]` (`lotNumber`, `quantity`, `expiresAt`), `reorderPoint` | Si `lotControl` está activo, `stock` es la suma de lotes y no se edita a mano; stock crítico si `0 < stock <= reorderPoint`; lote sin vencimiento usa `expiresAt: null` | `localStorage` | `admin/src/25-pipeline-persistencia-catalogo/04-types.ts`; `admin/src/20-pipeline-validacion-producto/03-normalize.ts`; `admin/src/25-pipeline-persistencia-catalogo/02-catalog.service.ts` |
| Ajuste rápido de stock | `Product` | Sumar o restar unidades | `stock` o `lots[]` | Requiere `canUpdateStock`; no se documenta un motivo obligatorio del ajuste **[P]**; no hay historial de movimientos manuales | `localStorage` | `admin/src/24-pipeline-inventario-productos/01-useProductActions.ts`; `admin/src/25-pipeline-persistencia-catalogo/01-store.ts` |
| Movimientos por venta y anulación | `Product`, `Factura` | Descontar por FEFO, reponer unidades | Líneas producto/cantidad | Solo productos, nunca cargos extra; al facturar descuenta; al anular repone; no hay tabla de movimientos, el stock es el saldo | `localStorage` | `admin/src/24-pipeline-inventario-productos/03-inventory.ts`; `admin/src/47-pipeline-persistencia-facturas/02-invoice.service.ts` |
| Métricas de inventario | `InventoryMetrics` | Calcular | `total`, `active`, `lowStock`, `outOfStock`, `totalValuation` | Derivadas del catálogo; valoración con costo; no persistentes | Memoria derivada | `admin/src/25-pipeline-persistencia-catalogo/02-catalog.service.ts`; `admin/src/57-pipeline-resumen-administrativo/02-useDashboardMetrics.ts` |

**Permisos:** `canUpdateStock`. **[P]** No existe kardex ni trazabilidad de ajustes manuales; el stock es un saldo mutable, no un libro de movimientos. El descuento FEFO se aplica en memoria y no queda auditado por lote.

---

## 4. Clientes

**Dependencias:** Pedidos, Cotizaciones, Facturación. **Persistencia:** `compustore_sv_bo_customers_v1`.

| Funcionalidad | Entidades | Operaciones | Datos | Reglas | Persistencia actual | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| Directorio y búsqueda | `Customer` | Listar, buscar, filtrar por tipo/estado | `id` (`CLI-###`), `type`, `name`, `documentId`, `phone`, `email`, `city`, `address`, `notes`, `active`, `createdAt` | Búsqueda sin acentos por nombre, correo, ciudad, documento e id; teléfono normalizado a dígitos | `localStorage`; 8 clientes iniciales | `admin/src/33-pipeline-historial-clientes/03-types.ts`; `admin/src/30-pipeline-registro-clientes/03-customer.service.ts` |
| Alta y edición | `Customer` | Crear, editar; alta automática desde pedido | Datos de contacto y fiscales | Nombre mínimo 3; teléfono 8–15 con formato; teléfono único entre clientes; correo válido si se informa; DUI `########-#` para persona; NIT `####-######-###-#` para empresa; el alta manual desde pedido usa las mismas reglas | `localStorage` | `admin/src/31-pipeline-seleccion-clientes/02-useCustomerSelection.ts`; `admin/src/33-pipeline-historial-clientes/01-store.ts` |
| Baja | `Customer` | Eliminar | `id` | Requiere `canDeleteCustomers`; no se documenta bloqueo por pedidos asociados **[P]**; los documentos conservan snapshot | `localStorage` | `admin/src/33-pipeline-historial-clientes/01-store.ts` |
| Historial y estadísticas | `Customer`, `Order` | Consultar pedidos, total gastado, última compra | `customerId`, `phone`, `total`, `status` | Enlace por `customerId`; si falta, por teléfono normalizado; solo `facturado` y `entregado` cuentan como gasto | Derivado de pedidos | `admin/src/43-pipeline-reglas-pedidos/03-customerStats.ts` |

**Permisos:** `canManageCustomers`, `canDeleteCustomers`. **[P]** No hay identificador único de persona entre teléfono, correo y documento; la deduplicación principal es el teléfono. El Front Office no crea clientes.

---

## 5. Pedidos

**Dependencias:** Catálogo, Clientes, Ofertas (precio vigente), Reservas, Facturación. **Persistencia:** `compustore_sv_bo_sales_v1`.

| Funcionalidad | Entidades | Operaciones | Datos | Reglas | Persistencia actual | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| Registro de pedido | `Order`, `OrderItem`, `OrderCharge`, `OrderEvent` | Crear desde cero o desde cotización; calcular totales | `id` (`ORD-2026-###`), `customerId`, `client`, `phone`, `email`, `city`, `channel`, `date`, `total`, `status`, `paymentMethod`, `deliveryMethod`, `notes`, `items[]`, `charges[]`, `reservedUntil`, `invoiceId`, `quoteId`, `history[]` | Al menos un producto con stock disponible; canal, pago y entrega obligatorios; cantidad máxima 999 o el disponible; precio unitario y descuento se copian al registrar; cliente ocasional se registra en directorio si el documento es pedido | `localStorage`; 6 pedidos iniciales | `admin/src/42-pipeline-persistencia-pedidos/05-types.ts`; `admin/src/43-pipeline-reglas-pedidos/02-orderValidation.ts`; `admin/src/36-pipeline-preparacion-pedidos/03-useOrderBuilder.ts` |
| Edición | `Order`, `OrderItem` | Editar mientras no haya factura | Ítems, cantidades, descuentos, cliente, cargos, notas | Solo estados `registrado` o `confirmado` y sin `invoiceId`; se revalida stock excluyendo el propio pedido de las reservas | `localStorage` | `admin/src/39-pipeline-transiciones-pedidos/02-orderFlow.ts`; `admin/src/42-pipeline-persistencia-pedidos/01-store.ts` |
| Eliminación lógica | `DeletedOrder` | Mover a `deletedOrders`, registrar quién/cuándo/motivo | `deletedAt`, `deletedBy`, `deleteReason` | Solo sin factura; un pedido facturado/entregado no se elimina; el id nunca se reutiliza; deja de contar en métricas, reservas y facturación | `localStorage` | `admin/src/42-pipeline-persistencia-pedidos/05-types.ts`; `admin/src/39-pipeline-transiciones-pedidos/02-orderFlow.ts` |
| Cargos extra | `OrderCharge` | Agregar, editar, quitar cargos | `id`, `concept`, `amount` | Máximo 6 cargos; concepto 3–60 caracteres; monto mayor que 0 y máximo $2,000; suman al total; no reservan ni descuentan stock; se facturan como línea de servicio | `localStorage` | `admin/src/78-pipeline-cargos-documentos/03-charges.ts`; `admin/src/78-pipeline-cargos-documentos/02-useExtraCharges.ts` |
| Totales | `OrderTotals` | Calcular | Bruto, descuento, productos, cargos, total, unidades | Precios con IVA incluido; descuento por línea en porcentaje; total = productos con descuento + cargos; redondeo a centavos | Derivado | `admin/src/43-pipeline-reglas-pedidos/04-charges.ts`; `admin/src/82-pipeline-calculo-importes/00-director-calculo-importes` |

**Permisos:** `canChangeOrderStatus` para registrar y gestionar; `canDeleteOrders` para eliminación lógica. **[P]** El pedido guarda nombre de canal como texto (`channel`), no un `channelId`; los canales son catálogo aparte.

---

## 6. Reservas de inventario

**Dependencias:** Pedidos, Catálogo, Facturación. **Persistencia:** `reservedUntil` dentro de cada pedido; el reservado se calcula.

| Funcionalidad | Entidades | Operaciones | Datos | Reglas | Persistencia actual | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| Confirmar y reservar | `Order` | Validar fecha, revalidar disponibilidad, pasar a `confirmado` | `status`, `reservedUntil` | Solo desde `registrado`; permiso `canReserveOrders`; fecha mínima hoy y máxima hoy + 15 días; sugerida 3 días; disponible = stock − reservas vigentes, excluyendo el propio pedido; si no alcanza, bloquea | `localStorage` | `admin/src/38-pipeline-reserva-pedidos/04-reservation.ts`; `admin/src/38-pipeline-reserva-pedidos/02-useReserveOrder.ts`; `admin/src/39-pipeline-transiciones-pedidos/03-stock.ts` |
| Vencimiento | `Order` | Barrido periódico; volver a `registrado` | `reservedUntil`, `status` | Vence al terminar el día límite; solo aplica a `confirmado` sin factura; el stock se libera solo; hoy lo ejecuta el navegador cada 60 s | `localStorage`; barrido en cliente | `admin/src/38-pipeline-reserva-pedidos/03-useReservationExpiry.ts`; `admin/src/42-pipeline-persistencia-pedidos/01-store.ts` |
| Stock reservado | `Order`, `Product` | Calcular por producto | `reservedByProduct`, `available` | Derivado de pedidos con reserva activa; no se guarda; cancelar, facturar o anular recalcula | Derivado en memoria | `admin/src/39-pipeline-transiciones-pedidos/03-stock.ts` |

**Permisos:** `canReserveOrders`. **[P]** La regla de ocultar en el Front Office cuando `available = 0` está documentada, pero no implementada; el store no consulta reservas. El vencimiento depende de que el panel esté abierto, lo que no es apto para producción.

---

## 7. Transiciones y métricas de pedidos

**Dependencias:** Reservas, Inventario, Facturación, Ajustes. **Persistencia:** pedidos y etiquetas en `compustore_sv_bo_sales_v1`.

| Funcionalidad | Entidades | Operaciones | Datos | Reglas | Persistencia actual | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| Máquina de estados | `Order`, `OrderStatus` | Confirmar, facturar, entregar, cancelar | `status`, `history[]` | Flujo fijo: `registrado → confirmado → facturado → entregado`; `cancelado` terminal; no se cancela un facturado sin anular factura; facturar solo desde `confirmado` con reserva vigente; anular factura devuelve a `confirmado` con reserva de 3 días | `localStorage` | `admin/src/39-pipeline-transiciones-pedidos/02-orderFlow.ts`; `admin/src/45-pipeline-emision-facturas/02-useInvoiceEmit.ts`; `admin/src/44-pipeline-listado-facturacion/02-useBilling.ts` |
| Etiquetas de estado | `OrderStatus` | Editar nombre y descripción | `name`, `description` | Nombre 3–30 y único; descripción máximo 200; ids, orden, transiciones y efectos no son configurables | `localStorage` | `admin/src/39-pipeline-transiciones-pedidos/02-orderFlow.ts` |
| Métricas y tablero | `OrderMetrics`, `InventoryMetrics` | Calcular KPIs y pedidos recientes | Totales por estado, activos, ingreso, stock crítico, valoración | Ingreso = pedidos `facturado` + `entregado`; activos = `registrado` + `confirmado` + `facturado`; pedidos recientes ordenados por fecha | Derivado | `admin/src/42-pipeline-persistencia-pedidos/02-order.service.ts`; `admin/src/57-pipeline-resumen-administrativo/02-useDashboardMetrics.ts` |

**Permisos:** `canChangeOrderStatus`. **[P]** El historial `OrderEvent` guarda `by` como nombre, no como id de usuario; no hay auditoría inmutable ni actor identificable de forma estable.

---

## 8. Cotizaciones

**Dependencias:** Catálogo, Clientes, Ajustes (emisor), Pedidos. **Persistencia:** `compustore_sv_bo_quotes_v1`.

| Funcionalidad | Entidades | Operaciones | Datos | Reglas | Persistencia actual | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| Listado y consulta | `Quote` | Buscar, filtrar por estado, paginar, ver PDF | `id` (`COT-2026-###`), cliente snapshot, ítems snapshot, cargos, notas, validez, estado guardado, emisor snapshot | Búsqueda por id, cliente, contacto, documento, creador, estado, productos y cargos; estado mostrado combina guardado + derivados | `localStorage`; 6 cotizaciones iniciales | `admin/src/48-pipeline-listado-cotizaciones/02-useQuotes.ts`; `admin/src/51-pipeline-persistencia-cotizaciones/02-quote.service.ts` |
| Emisión | `Quote`, `QuoteItem`, `QuoteCustomer`, `QuoteIssuer` | Crear cotización, calcular totales | Ítems con SKU, nombre, precio y descuento; validez 7/15/30 días; cliente de directorio u ocasional; cargos; emisor | Correlativo `COT-2026-###`; validez por defecto 15 días; precios con IVA incluido; total = productos con descuento + cargos; IVA se extrae del total; emisor se copia al documento | `localStorage` | `admin/src/49-pipeline-preparacion-cotizaciones/02-useQuoteBuilder.ts`; `admin/src/51-pipeline-persistencia-cotizaciones/02-quote.service.ts` |
| Estados | `Quote` | Aceptar, rechazar, eliminar | `status`, `createdAt`, `validityDays` | Guardados: `emitida`, `aceptada`, `rechazada`. Derivados: `vencida` (emitida fuera de validez) y `convertida` (pedido activo). No se elimina una cotización convertida | `localStorage` | `admin/src/51-pipeline-persistencia-cotizaciones/03-types.ts`; `admin/src/51-pipeline-persistencia-cotizaciones/02-quote.service.ts` |
| Conversión a pedido | `Quote`, `Order` | Prellenar pedido, crear pedido, vincular `quoteId` | Cliente, ítems, precios, descuentos, cargos, notas | Solo desde `emitida` o `aceptada` y sin pedido activo; se respetan precios y descuentos cotizados; stock se valida en el constructor; un pedido activo por cotización | `localStorage` | `admin/src/48-pipeline-listado-cotizaciones/02-useQuotes.ts`; `admin/src/51-pipeline-persistencia-cotizaciones/02-quote.service.ts` |

**Permisos:** `canManageQuotes`; convertir exige además `canChangeOrderStatus`. **[P]** `vencida` y `convertida` no se persisten; cualquier backend debe decidir si las calcula al vuelo o las materializa.

---

## 9. Facturación

**Dependencias:** Pedidos, Inventario, Ajustes (emisor y semilla), Clientes. **Persistencia:** `compustore_sv_bo_invoices_v1`.

| Funcionalidad | Entidades | Operaciones | Datos | Reglas | Persistencia actual | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| Emisión | `Invoice`, `InvoiceItem`, `InvoiceReceptor`, `InvoiceIssuer` | Crear factura desde pedido, calcular totales, abrir PDF | `id` (número de control DTE), `generationCode`, `receptionSeal`, `internalId`, `orderId`, receptor, condición de pago, ítems, notas, estado, fechas, `createdBy`, emisor | Solo pedido `confirmado`, con reserva vigente y sin factura; revalida stock; productos y cargos se copian como líneas; descuento de pedido pasa a monto; receptor consumidor final o identificado; emisor snapshot | `localStorage`; 2 facturas iniciales | `admin/src/45-pipeline-emision-facturas/02-useInvoiceEmit.ts`; `admin/src/47-pipeline-persistencia-facturas/03-types.ts`; `admin/src/47-pipeline-persistencia-facturas/01-store.ts` |
| Anulación | `Invoice`, `Order`, `Product` | Anular factura, reponer stock, desvincular pedido | `status`, `voidedAt`, `invoiceId` | No se anula si el pedido ya está `entregado`; solo repone líneas de producto; la factura pasa a `anulada`; el pedido vuelve a `confirmado` con reserva de 3 días | `localStorage` | `admin/src/44-pipeline-listado-facturacion/02-useBilling.ts` |
| Consulta y PDF | `Invoice` | Filtrar, buscar, previsualizar, descargar, compartir | Todos los campos de factura y totales | Búsqueda por control, interno, pedido, receptor, documento, contacto, pago, creador, fecha y descripción; totales derivados | `localStorage`; PDF generado en cliente | `admin/src/44-pipeline-listado-facturacion/02-useBilling.ts`; `admin/src/46-pipeline-documento-factura/02-useInvoicePreview.ts` |
| Numeración y DTE | `Invoice`, `StoreSettings` | Generar siguiente control, correlativo interno, código y sello | `CONTROL_PREFIX`, último control 2074, último interno 15781, `invoiceSeed`, `generationCode`, `receptionSeal` | Control de 15 dígitos con prefijo `DTE-01-M001P001-`; interno de 6; semilla solo adelanta; nunca se reutiliza un número, incluidas anuladas; código UUID; sello **simulado** | `localStorage`; constantes en código | `admin/src/47-pipeline-persistencia-facturas/02-invoice.service.ts`; `admin/src/62-pipeline-parametros-emisor/03-identity.ts` |

**Permisos:** `canInvoice` para emitir y anular. **[P] Crítico:** la emisión ejecuta tres operaciones separadas —crear factura, descontar stock y vincular pedido— sin transacción; un fallo intermedio deja datos inconsistentes. La transmisión real a Hacienda no existe.

---

## 10. Ofertas

**Dependencias:** Catálogo, Pedidos y Cotizaciones (precio vigente). **Persistencia:** `compustore_sv_bo_promos_v1`.

| Funcionalidad | Entidades | Operaciones | Datos | Reglas | Persistencia actual | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| Gestión de ofertas | `Offer` | Crear, editar, listar, eliminar | `id` (`PRM-###`), `title`, `badge`, `description`, `productIds[]`, `discountType`, `discountValue`, `startDate`, `endDate`, `paused`, `createdAt` | Título mínimo 3; descuento mayor que 0; porcentaje máximo 90; al menos un producto; fin igual o posterior al inicio; no terminar en el pasado al crear; sin solapamiento de productos y fechas con otra oferta no vencida; bloquear si algún producto queda bajo costo | `localStorage`; 3 ofertas iniciales | `admin/src/54-pipeline-precio-ofertas/04-types.ts`; `admin/src/54-pipeline-precio-ofertas/02-offerPricing.ts`; `admin/src/53-pipeline-preparacion-ofertas/02-useOfferBuilder.ts` |
| Vigencia y pausa | `Offer` | Pausar/reanudar, consultar estado | `startDate`, `endDate`, `paused` | Estado derivado: `vencida`, `pausada`, `programada`, `vigente`; una oferta vigente se pausa antes de eliminarse; las vencidas se pueden eliminar | `localStorage` | `admin/src/54-pipeline-precio-ofertas/02-offerPricing.ts`; `admin/src/54-pipeline-precio-ofertas/03-store.ts` |
| Precio efectivo | `Offer`, `Product` | Calcular precio con descuento y margen | `price`, `cost`, `taxRate`, `discountType`, `discountValue` | No modifica `Product.price`; capa de precio al vuelo; se toma la primera oferta vigente que contenga el producto; descuento porcentual o monto fijo; precio nunca negativo; margen se mide sobre precio sin IVA; margen bajo solo advierte, bajo costo bloquea | Derivado; proveedor de precio en memoria | `admin/src/54-pipeline-precio-ofertas/02-offerPricing.ts`; `admin/src/23-pipeline-seleccion-productos/03-pricePort.ts` |

**Permisos:** `canManageOffers`. **[P]** El Front Office no consume `Offer`: solo muestra `originalPrice > price`. Tampoco está definido si dos ofertas pueden acumularse; el código aplica una sola.

---

## 11. Moderación de reseñas

**Dependencias:** Catálogo (nombre de producto) y Front Office (origen declarado). **Persistencia:** `compustore_sv_bo_reviews_v1`.

| Funcionalidad | Entidades | Operaciones | Datos | Reglas | Persistencia actual | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| Bandeja de comentarios | `ProductReview` | Listar, filtrar, buscar, ver señales de spam | `id` (`REV-###`), `productId`, `productName`, `author`, `city`, `rating`, `comment`, `createdAt`, `status`, `rejectReason`, `moderatedBy`, `moderatedAt` | Estados `pendiente`, `aprobado`, `rechazado`; señales de spam solo priorizan, no rechazan automáticamente | `localStorage`; 8 reseñas iniciales | `admin/src/56-pipeline-persistencia-comentarios/03-types.ts`; `admin/src/56-pipeline-persistencia-comentarios/02-reviews.service.ts` |
| Moderación | `ProductReview` | Aprobar una o varias, rechazar con motivo, eliminar | `status`, `rejectReason`, `moderatedBy`, `moderatedAt` | Requiere `canModerateReviews`; aprobar publica; rechazar exige motivo; eliminar es definitivo y también lo quita del Front Office según el contrato | `localStorage` | `admin/src/55-pipeline-moderacion-comentarios/02-useReviewModeration.ts`; `admin/src/56-pipeline-persistencia-comentarios/01-store.ts` |

**Permisos:** `canModerateReviews`. **[P] Crítico:** las reseñas del admin y las del store son fuentes distintas, con ids y formas diferentes; no existe sincronización. El admin espera `productId` tipo `PRD-001`, el store usa ids numéricos.

---

## 12. Ajustes, identidad y mantenimiento

**Dependencias:** Facturación, Cotizaciones, Pedidos (canales y etiquetas), todos los stores (respaldo). **Persistencia:** `compustore_sv_bo_settings_v1`.

| Funcionalidad | Entidades | Operaciones | Datos | Reglas | Persistencia actual | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| Identidad comercial y emisor | `StoreSettings` | Leer, editar datos comerciales y fiscales | `name`, `tagline`, `city`, `country`, `address`, `phones[]`, `whatsappNumber`, `email`, `schedule`, `currency`, `currencySymbol`, `taxRate`, `legalName`, `nit`, `nrc`, `economicActivity`, `establishmentType`, `invoiceSeed` | Nombre mínimo 3; correo y teléfonos válidos; dirección mínima 10; razón social mínima 3; NIT de 9 o 14 dígitos; NRC con formato; actividad mínima 5; tipo de establecimiento del catálogo; semilla 1–999999 y mayor que el último emitido; IVA 13 % normativo | `localStorage` | `admin/src/85-pipeline-identificadores-texto/03-store.config.ts`; `admin/src/62-pipeline-parametros-emisor/03-identity.ts`; `admin/src/61-pipeline-identidad-comercial/05-useIdentityForm.ts` |
| Canales de venta | `Channel` | Crear, editar, activar/desactivar, eliminar | `id`, `name`, `badge`, `icon`, `color`, `description`, `active` | Canales iniciales: Sala de Ventas, WhatsApp, Tienda Web, Corporativo; los pedidos guardan el nombre del canal y se actualizan en cascada al renombrarlo; no se elimina un canal con pedidos; etiquetas de estado editables con validación | `localStorage`; 4 canales iniciales | `admin/src/88-pipeline-datos-demo-documentos/02-channels.mock.ts`; `admin/src/42-pipeline-persistencia-pedidos/01-store.ts` |
| Mantenimiento y respaldo | Todos los stores | Exportar JSON, restablecer datos de fábrica | `settings`, `products`, `orders`, `deletedOrders`, `channels`, `orderStatuses`, `categories`, `brands`, `customers`, `users` sin hash y secciones registradas | Respaldo con versión `2026.2`; incluye facturas, cotizaciones y reseñas mediante `snapshotRegisteredDemoData()`; no se encontró importación/restauración de respaldo; el restablecimiento es destructivo y requiere confirmación; permiso de ajustes | `localStorage`; descarga generada en cliente | `admin/src/63-pipeline-mantenimiento-datos/03-backup.ts`; `admin/src/63-pipeline-mantenimiento-datos/02-useMaintenance.ts` |

**Permisos:** `canEditSettings`; `canManageUsers` para usuarios. **[P]** El respaldo se descarga como JSON y no se encontró un importador que lo restaure; debe validarse como respaldo operativo antes de usarlo en producción.

---

## 13. Persistencia actual

| Clave | Contenido | Evidencia |
| --- | --- | --- |
| `compustore_sv_bo_access_v1` | Usuarios y sesión | `admin/src/84-pipeline-persistencia-demo/02-storage.ts` |
| `compustore_sv_bo_catalog_v1` | Productos, categorías, marcas | Ibíd. |
| `compustore_sv_bo_customers_v1` | Clientes | Ibíd. |
| `compustore_sv_bo_sales_v1` | Pedidos, eliminados, canales, etiquetas | Ibíd. |
| `compustore_sv_bo_invoices_v1` | Facturas | Ibíd. |
| `compustore_sv_bo_promos_v1` | Ofertas | Ibíd. |
| `compustore_sv_bo_quotes_v1` | Cotizaciones | Ibíd. |
| `compustore_sv_bo_settings_v1` | Identidad y configuración | Ibíd. |
| `compustore_sv_bo_reviews_v1` | Reseñas | Ibíd. |
| `compustore_sv_theme` | Tema visual | Ibíd. |

**Riesgos de persistencia [E/I]:** datos por navegador y no por usuario; pérdida al limpiar almacenamiento; sin concurrencia; sin control de versiones salvo migraciones puntuales; los documentos se guardan como snapshots dentro de cada registro.

---

## 14. Dependencias internas del admin

| Módulo | Depende de | Motivo |
| --- | --- | --- |
| Sesión y RBAC | Usuarios, matriz de vistas | Toda acción valida permisos |
| Catálogo | Inventario, taxonomía, imágenes | Stock, categorías, marcas y galería |
| Pedidos | Catálogo, clientes, ofertas, reservas | Precio vigente, stock, cliente y apartado |
| Reservas | Pedidos, catálogo | Disponibilidad y vencimiento |
| Cotizaciones | Catálogo, clientes, ajustes, pedidos | Precios, emisor, conversión |
| Facturación | Pedidos, catálogo, ajustes, clientes | Stock, emisor, receptor, numeración |
| Ofertas | Catálogo | Precio efectivo y margen |
| Reseñas | Catálogo | Producto y nombre |
| Tablero | Catálogo, pedidos, ajustes | KPIs y accesos |
| Ajustes | Todos | Configuración y respaldo |

---

## 15. Hallazgos inciertos que requieren confirmación

| ID | Hallazgo | Estado |
| --- | --- | --- |
| A-P1 | ¿El stock debe manejarse como saldo o como libro de movimientos con kardex? | **[P]** |
| A-P2 | ¿La eliminación de clientes debe bloquearse si tienen pedidos o facturas? | **[P]** |
| A-P3 | ¿Un pedido puede tener más de una factura a lo largo de su vida, o solo una activa? | **[P]** |
| A-P4 | ¿La anulación de factura siempre debe re-reservar 3 días, incluso si ya no hay stock? | **[P]** |
| A-P5 | ¿El descuento por línea es porcentaje en pedido/cotización y monto en factura; cómo se redondea en el servidor? | **[P]** |
| A-P6 | ¿El IVA debe mostrarse desglosado o sigue incluido en el precio? | **[P]** |
| A-P7 | ¿La semilla de facturación debe ser configuración o secuencia atómica de base de datos? | **[P]** |
| A-P8 | ¿Las etiquetas de estado personalizadas son un requisito real o solo demo? | **[P]** |
| A-P9 | ¿El respaldo JSON debe incluir facturas, cotizaciones y reseñas? | **[P]** |
| A-P10 | ¿La marca debe migrar de nombre a FK por id? | **[P]** |

---

## 16. Conteo del inventario

| Dominio | Funcionalidades |
| --- | --- |
| Sesión, usuarios y RBAC | 5 |
| Catálogo y taxonomía | 4 |
| Inventario y lotes | 4 |
| Clientes | 4 |
| Pedidos | 5 |
| Reservas | 3 |
| Transiciones y métricas | 3 |
| Cotizaciones | 4 |
| Facturación | 4 |
| Ofertas | 3 |
| Moderación de reseñas | 2 |
| Ajustes y mantenimiento | 3 |
| **Total** | **44** |

> **Nota de conteo:** se separan métricas, movimientos y totales como funcionalidades propias porque afectan datos y reglas; no se cuentan pantallas ni componentes visuales.
