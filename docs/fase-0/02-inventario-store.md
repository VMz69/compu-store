# 02 · Inventario funcional de `/store`

> **Alcance:** Front Office público de CompuStore SV. Se documentan entidades, consultas, estado del navegador y contratos de datos; se excluyen componentes puramente visuales.
> **Método:** lectura directa de modelos, stores, cálculos, mocks y contratos comentados. No se asume que una simulación sea regla definitiva.
> **Fecha:** 2026-11-23 · **Fase:** 0 · **Estado:** análisis, sin cambios de código.

## Leyenda

| Marca | Significado |
| --- | --- |
| **[E]** | Evidencia comprobada en código. |
| **[I]** | Inferencia razonable, pendiente de validación. |
| **[P]** | Aspecto no definido o pendiente de confirmación humana. |

## Resumen

| Indicador | Valor |
| --- | --- |
| Dominios funcionales | 7 |
| Funcionalidades inventariadas | 20 |
| Entidades y modelos | `Product`, `Category`, `Brand`, `Review`, `Promotion`, `CartItem`, `CheckoutState` |
| Persistencia | `localStorage` para carrito, favoritos y tema; resto en memoria o constantes |
| Autenticación | No existe |
| Pedidos | No se crean en el servidor; checkout por WhatsApp |
| Backend | `/api` sin implementación |

**Restricción de lectura:** este frontend no tiene cuentas, sesiones, roles ni permisos. Todo dato es público o vive en el navegador.

---

## 1. Identidad y configuración de tienda

**Dependencias:** checkout, contacto, mensajes de WhatsApp. **Persistencia:** constantes compiladas; sin store.

| Funcionalidad | Entidades | Operaciones | Datos | Reglas | Persistencia actual | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| Identidad comercial | `STORE_CONFIG` | Leer configuración | `name`, `tagline`, `city`, `country`, `address`, `addressShort`, `phones[]`, `whatsappNumber`, `email`, `schedule`, `scheduleShort`, `about`, `mission`, `vision` | Valores fijos en código; no hay formulario ni API para editarlos; el admin mantiene una copia equivalente en `StoreSettings` | Constantes | `store/src/01-pipeline-identidad-tienda/01-identidad.config.ts` |
| Enlaces de WhatsApp | `STORE_CONFIG` | Construir URL con mensaje codificado | `whatsappNumber`, texto del mensaje | Número en formato internacional; base `https://wa.me/{numero}`; cada feature arma su propio mensaje | Sin persistencia | `store/src/01-pipeline-identidad-tienda/03-enlaces-whatsapp.ts` |

**[P] Duplicación:** la identidad existe dos veces, en `store/src/01-pipeline-identidad-tienda/01-identidad.config.ts` y en `admin/src/85-pipeline-identificadores-texto/03-store.config.ts`. No hay sincronización.

---

## 2. Catálogo, búsqueda y filtros

**Dependencias:** datos mock, carrito, favoritos, reseñas, portada. **Persistencia:** productos y taxonomía en módulos estáticos.

| Funcionalidad | Entidades | Operaciones | Datos | Reglas | Persistencia actual | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| Listado de catálogo | `Product`, `Category`, `Brand` | Listar, filtrar por categoría o marca, ordenar | `id` numérico, `name`, `slug`, `brand` (slug), `category` (slug), `price`, `originalPrice`, `stock`, `badge`, `rating`, `reviewsCount`, `imageUrl`, `images[]`, `description`, `specs[]` | Solo productos del arreglo local; `onlyOffers` exige `originalPrice > price`; orden `featured`, precio ascendente/descendente, descuento o nombre; el destacado prioriza `badge === 'Destacado'` | 12 productos en código | `store/src/03-modelos-producto.ts`; `store/src/10-pipeline-consulta-catalogo/01-consultas-productos.ts`; `store/src/06-pipeline-datos-mock/03-productos.mock.ts` |
| Búsqueda | `Product` | Consultar por texto | Término libre | Insensible a mayúsculas; busca en nombre, descripción, categoría, marca y cada especificación; sin resultados vacío; entrada con debounce de 300 ms | Estado en memoria; no persistido | `store/src/10-pipeline-consulta-catalogo/01-consultas-productos.ts`; `store/src/31-pipeline-captura-busqueda/01-estado-busqueda.ts` |
| Filtros y ordenamiento | `ProductFilters` | Cambiar filtros, limpiar | `category`, `brand`, `onlyOffers`, `searchQuery`, `sortBy` | Filtros globales compartidos entre header, catálogo y resultados; no se persisten; cada sesión inicia con valores por defecto | Estado Zustand en memoria | `store/src/10-pipeline-consulta-catalogo/03-filtros.store.ts`; `store/src/10-pipeline-consulta-catalogo/04-aplicar-filtros.ts` |
| Conteos de taxonomía | `CategoryWithCount`, `BrandWithCount` | Calcular conteos | `count` por categoría y marca; total de productos | Se cuentan productos publicados del mock; el conteo no considera visibilidad ni disponibilidad porque no existen esos campos | Derivado en memoria | `store/src/11-pipeline-categorias/01-estadisticas-catalogo.ts`; `store/src/10-pipeline-consulta-catalogo/01-consultas-productos.ts` |

**[P] Inconsistencia de identidad:** el store usa `id` numérico (`1..12`), `brand` y `category` como slugs. El admin usa `id` con prefijo (`PRD-001`), marca por nombre y categoría por id. No existe tabla de equivalencias.

---

## 3. Ficha de producto, disponibilidad y reseñas

**Dependencias:** catálogo, carrito, reseñas, WhatsApp. **Persistencia:** reseñas nuevas en memoria; reseñas de muestra en código.

| Funcionalidad | Entidades | Operaciones | Datos | Reglas | Persistencia actual | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| Detalle de producto | `Product` | Consultar por id, obtener galería, relacionados | Todos los campos del producto; `images` sin duplicados y portada primero; relacionados por categoría o marca, máximo 4 | El id se convierte a número; si no existe, no hay producto; la galería deduplica; los relacionados excluyen el actual | Datos mock | `store/src/10-pipeline-consulta-catalogo/01-consultas-productos.ts`; `store/src/23-pipeline-oferta-producto/03-informacion-comercial.tsx` |
| Disponibilidad mostrada | `Product.stock` | Consultar y limitar compra | `stock`, `reserved`, `available` (solo en contrato futuro) | Hoy muestra `product.stock`; el carrito limita a ese stock; no conoce reservas del admin; el contrato futuro propone `available = stock − reservado` y ocultar si `available = 0` por reservas | `stock` en mock; `applyReservations` es no-op | `store/src/24-pipeline-compra-producto/01-disponibilidad-producto.ts`; `store/src/07-pipeline-estado-carrito/02-calculos-carrito.ts` |
| Reseñas publicadas | `Review` | Listar, calcular distribución, marcar útil | `id` numérico, `author`, `city`, `rating`, `date`, `title`, `comment`, `verified`, `status?` | Solo se muestran `aprobado`; las de muestra sin estado se asumen aprobadas; si no hay reseñas almacenadas se usan `DEFAULT_REVIEWS`; la calificación y el conteo del producto son estáticos | Memoria + mock de muestra | `store/src/20-pipeline-estado-resenas/03-resenas-producto.ts`; `store/src/06-pipeline-datos-mock/04-resenas.mock.ts` |
| Envío de reseña | `ReviewSubmission`, `Review` | Validar y enviar opinión | `rating` 1–5, `author`, `city`, `comment`; ciudad vacía usa "El Salvador"; `status: 'pendiente'`; `verified: false` | Comentario mínimo 10 caracteres; la opinión no se publica hasta aprobación del admin; hoy queda en memoria y se pierde al recargar; no se verifica compra | Memoria; sin API | `store/src/20-pipeline-estado-resenas/04-estado-formulario-resena.ts`; `store/src/20-pipeline-estado-resenas/01-contrato-resenas.ts`; `store/src/20-pipeline-estado-resenas/02-resenas.store.ts` |

**[P] Crítico:** las reseñas nacen en el navegador del cliente y el admin modera otra colección. El contrato propuesto (`GET/POST /api/products/:productId/reviews`, `PATCH /api/reviews/:id`) no está implementado. Además, `buildPendingReview` no incluye `productId` en el objeto; el vínculo se hace por la clave del mapa en memoria.

---

## 4. Carrito

**Dependencias:** catálogo, checkout. **Persistencia:** `compustore_sv_cart_v4`.

| Funcionalidad | Entidades | Operaciones | Datos | Reglas | Persistencia actual | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| Gestión de líneas | `CartItem`, `Product` | Agregar, incrementar, decrementar, eliminar, vaciar | Producto completo como snapshot, `quantity`, `deliveryMethod`, `customerNote` | No agregar si stock 0; la cantidad acumulada no puede superar `product.stock`; al fijar cantidad ≤ 0 se elimina la línea; al exceder stock se recorta; errores legibles para toast | `localStorage` con versión `v4` | `store/src/07-pipeline-estado-carrito/01-modelos-carrito.ts`; `store/src/07-pipeline-estado-carrito/02-calculos-carrito.ts`; `store/src/07-pipeline-estado-carrito/03-carrito.store.ts` |
| Totales | `CartTotals` | Calcular unidades y subtotal | `itemCount`, `subtotal`, `total` | Suma de cantidades, no de líneas; total = subtotal; no hay IVA desglosado, envío, descuento ni impuestos | Derivado | `store/src/07-pipeline-estado-carrito/02-calculos-carrito.ts`; `store/src/08-pipeline-vista-carrito/03-estado-vista-carrito.ts` |
| Persistencia y preferencias | `CartItem`, `CheckoutState` | Guardar, restaurar, limpiar | `items[]`, `deliveryMethod` (`pickup`/`shipping`), `customerNote` | Persiste todo el producto, no solo el id; el precio puede quedar obsoleto si el catálogo cambia; vaciar conserva el método de entrega pero limpia la nota | `localStorage` | `store/src/07-pipeline-estado-carrito/03-carrito.store.ts` |

**[P] Riesgo:** guardar el producto completo congela precio, stock e imágenes. Al cambiar el catálogo, el carrito muestra datos viejos. El backend debería guardar `productId` + cantidad y resolver precio vigente.

---

## 5. Checkout por WhatsApp

**Dependencias:** carrito, identidad de tienda. **Persistencia:** solo el estado del carrito; no hay pedido.

| Funcionalidad | Entidades | Operaciones | Datos | Reglas | Persistencia actual | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| Formulario de checkout | `CheckoutState` | Elegir entrega, escribir nota | `deliveryMethod`, `customerNote` | Dos opciones: retiro en tienda o envío; no se capturan nombre, teléfono, dirección ni correo; la nota es texto libre | `localStorage` (dentro del carrito) | `store/src/09-pipeline-checkout-whatsapp/02-formulario-pedido.tsx`; `store/src/07-pipeline-estado-carrito/01-modelos-carrito.ts` |
| Mensaje y enlace de pedido | `CartItem`, `DeliveryMethod` | Generar mensaje, abrir WhatsApp | Ítems, cantidades, precio unitario, subtotal, total, método de entrega, nota | El mensaje usa precios del snapshot del carrito; no descuenta stock, no reserva, no crea pedido, no valida disponibilidad al enviar y no vacía el carrito; el cierre real ocurre en la conversación | Sin persistencia; URL generada | `store/src/09-pipeline-checkout-whatsapp/01-pedido-whatsapp.ts`; `store/src/08-pipeline-vista-carrito/03-estado-vista-carrito.ts` |

**[P] Crítico:** no existe solicitud de pedido en servidor ni integración con el canal `tienda-web` del admin. El negocio no puede medir conversión, reservar stock ni garantizar el precio mostrado.

---

## 6. Favoritos y preferencias

**Dependencias:** catálogo. **Persistencia:** `compustore_sv_favorites_v2` y `compustore_sv_theme`.

| Funcionalidad | Entidades | Operaciones | Datos | Reglas | Persistencia actual | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| Favoritos | `Product.id` | Alternar, listar, vaciar | Arreglo de ids numéricos | Se guardan ids, no productos, para no duplicar datos; se resuelven contra el catálogo; no hay usuario ni sincronización entre dispositivos; vaciar pide confirmación | `localStorage` | `store/src/15-pipeline-preferencias-producto/01-favoritos.store.ts`; `store/src/14-pipeline-listados-catalogo/04-estado-lista-favoritos.ts` |
| Preferencias de interfaz | `ThemePreference` | Cambiar tema, navegar hero, cambiar pestaña de producto | `themePreference` (`system`/`light`/`dark`), `isDark`, `activeHeroSlide`, `productDetailTab` | Sin preferencia manual sigue al sistema; tema manual persiste; el resto es estado de sesión | `localStorage` solo para tema | `store/src/02-pipeline-preferencias-interfaz/01-preferencias.store.ts`; `store/src/02-pipeline-preferencias-interfaz/02-tema.ts` |

**[P]** Favoritos no requiere backend en el MVP si se mantiene como preferencia local; solo pasa a servidor si se agregan cuentas de cliente.

---

## 7. Portada, promociones y contacto

**Dependencias:** identidad, catálogo, WhatsApp. **Persistencia:** promociones y datos de contacto en constantes.

| Funcionalidad | Entidades | Operaciones | Datos | Reglas | Persistencia actual | Evidencia |
| --- | --- | --- | --- | --- | --- | --- |
| Carrusel de promociones | `Promotion` | Navegar, autoplay, pausar | `id`, `badge`, `title`, `discountText`, `description`, `ctaText`, `targetCategory`, `badgeColor`, `imageUrl`, `gradient` | Autoplay cada 7 s; se pausa al interactuar; respeta movimiento reducido; navegación circular; no hay relación con `Offer` del admin | Mock estático | `store/src/03-modelos-producto.ts`; `store/src/06-pipeline-datos-mock/05-promociones.mock.ts`; `store/src/26-pipeline-presentacion-portada/02-estado-promociones.ts` |
| Contacto | Formulario de contacto | Validar y abrir WhatsApp | `name`, `phone?`, `subject`, `message` | Nombre y mensaje obligatorios; asunto desde catálogo; no se guarda en servidor; solo se abre WhatsApp | Sin persistencia | `store/src/28-pipeline-consulta-contacto/02-contacto-whatsapp.ts`; `store/src/28-pipeline-consulta-contacto/03-estado-contacto.ts` |
| Información de tienda | `STORE_CONFIG` | Leer | Dirección, horario, teléfonos, misión, visión | Contenido estático; sin administración | Constantes | `store/src/01-pipeline-identidad-tienda/01-identidad.config.ts`; `store/src/29-pipeline-informacion-tienda/00-director-informacion-tienda.ts` |

**[P]** Las promociones del hero son campañas editoriales con texto libre. No descuentan precios ni se relacionan con productos concretos, a diferencia de `Offer` en el admin.

---

## 8. Persistencia actual

| Clave | Contenido | Evidencia |
| --- | --- | --- |
| `compustore_sv_cart_v4` | Líneas del carrito, método de entrega y nota | `store/src/07-pipeline-estado-carrito/03-carrito.store.ts` |
| `compustore_sv_favorites_v2` | Ids de productos favoritos | `store/src/15-pipeline-preferencias-producto/01-favoritos.store.ts` |
| `compustore_sv_theme` | Preferencia de tema manual | `store/src/02-pipeline-preferencias-interfaz/02-tema.ts` |

**Sin persistencia:** búsqueda, filtros, reseñas nuevas, formulario de contacto y checkout. **Sin backend:** catálogo, disponibilidad, pedidos y moderación.

---

## 9. Dependencias internas del store

| Módulo | Depende de | Motivo |
| --- | --- | --- |
| Catálogo y búsqueda | Mocks de productos, categorías y marcas | Fuente única actual |
| Ficha de producto | Catálogo, reseñas, carrito, WhatsApp | Datos, opiniones y compra |
| Carrito | Catálogo | Stock y precio del snapshot |
| Checkout | Carrito, identidad | Ítems, entrega y mensaje |
| Favoritos | Catálogo | Resolver ids a productos |
| Portada | Promociones, catálogo | Hero y destacados |
| Contacto | Identidad | Mensaje de WhatsApp |

---

## 10. Hallazgos inciertos que requieren confirmación

| ID | Hallazgo | Estado |
| --- | --- | --- |
| S-P1 | ¿El catálogo público debe ocultar productos con `available = 0` por reservas, o mostrarlos agotados? | **[P]** |
| S-P2 | ¿El checkout debe crear una solicitud de pedido antes de WhatsApp? | **[P]** |
| S-P3 | ¿Se capturarán datos del cliente en la tienda o se mantendrá el anonimato? | **[P]** |
| S-P4 | ¿Las reseñas requieren compra verificada? | **[P]** |
| S-P5 | ¿El precio del carrito se congela o se recalcula al abrir el checkout? | **[P]** |
| S-P6 | ¿El envío tiene costo o se cotiza por WhatsApp? | **[P]** |
| S-P7 | ¿Los favoritos deben migrar a cuentas de usuario? | **[P]** |
| S-P8 | ¿Las promociones del hero las administrará el back office? | **[P]** |
| S-P9 | ¿El IVA debe mostrarse desglosado en la tienda? | **[P]** |
| S-P10 | ¿Los ids numéricos son la URL pública definitiva o se migrará a slug? | **[P]** |

---

## 11. Conteo del inventario

| Dominio | Funcionalidades |
| --- | --- |
| Identidad y configuración | 2 |
| Catálogo, búsqueda y filtros | 4 |
| Ficha, disponibilidad y reseñas | 4 |
| Carrito | 3 |
| Checkout WhatsApp | 2 |
| Favoritos y preferencias | 2 |
| Portada, promociones y contacto | 3 |
| **Total** | **20** |

> **Nota de conteo:** se cuentan operaciones con datos o reglas; no se cuentan componentes visuales, tarjetas, modales ni animaciones.
