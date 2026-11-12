# Blueprint · Back Office `/admin` — CompuStore SV

> **Objetivo:** prototipo funcional con datos dummy (inventario, pedidos, facturación, CRM, ofertas, moderación) con trazabilidad desactivable.
> **Stack:** React 19 · Vite 8 · TS 7 (`tsc`) + TS 6 (tooling) · Tailwind v4 · React Router 7 · Zustand 5 · jsPDF
> **Fuente visual:** `mocksUI-base/compustore_sv_back_office.html` · **Gemelo:** [`store/arch-fronOffice.md`](../store/arch-fronOffice.md)
> **Última auditoría:** 2026-11-12 — arquitectura FLOA; 139 emisores con rutas actuales; 7 comprobaciones automatizadas de trazabilidad en verde; 46 escenarios en Chrome sobre builds de producción con el kill switch activado/desactivado; typecheck, lint y build sin errores. Las reglas de negocio y datos mock se conservan.

---

## 0. Convenciones del Back Office y contratos compartidos

`/admin` usa la topología FLOA descrita aquí. El Front Office conserva su propia estructura; ambos mantienen el contrato de metadatos UI. Las excepciones al aislamiento y el mapa completo de la migración están en [REFACTOR_MAP.md](./REFACTOR_MAP.md).

| Aspecto | Convención de admin |
|---|---|
| Arquitectura | 88 pipelines paralelos en `src/`, sin subcarpetas internas, con 4–6 archivos numerados por pipeline |
| Entrada del pipeline | `00-director-[nombre].ts`: reexportación de una fase ya consumida, sin lógica nueva |
| Integración de dominios | Directores raíz como `src/00-director-catalogo.ts` y `src/00-director-ventas.ts`; conservan las API y registros anteriores |
| Anatomía | Fases `01-`, `02-`, etc., en archivos `.ts`/`.tsx`; no existen carpetas técnicas `app/`, `features/`, `shared/`, `components/`, `hooks/` o `lib/` dentro de src/ |
| Vista | `.tsx` ≤ 150 líneas (ESLint `max-lines`); estado y cálculos en hooks/funciones existentes |
| Lógica | Hooks, funciones puras y stores Zustand conservan sus símbolos y responsabilidades en archivos numerados |
| Datos | Doce módulos mock repartidos entre los pipelines `86-`, `87-` y `88-`; valores y esquemas persistidos intactos |
| Trazabilidad | `src/00-trazabilidad.ts`: `uiMeta` + `tracer`; atributos `data-ui-id`, `data-ui-component`, `data-ui-source`; kill switch `VITE_UI_TRACEABILITY` |
| Alias | `@/*` → `src/*` |

La adopción es conservadora: se preservaron las dependencias existentes entre fases/pipelines y las inicializaciones de puertos. No hay un bus global nuevo ni aislamiento absoluto; esas excepciones están documentadas y no autorizan añadir nuevos acoplamientos.

---

## 1. Reglas

1. **Máximo 150 líneas por `.tsx`** (ESLint lo bloquea); páginas < 60.
2. **La vista no lleva lógica.** Estado, cálculos y validaciones en hooks, funciones puras o stores de las fases numeradas (incluidas suscripciones: p. ej. `useStatusMeta`).
3. **Mocking-first.** Las acciones simulan latencia (`delay()`) y exponen `isLoading`; los envíos con varios pasos usan un candado local (`saving`) contra dobles clics.
4. **Permisos** se validan en los hooks de acciones (`ensurePermission`); la vista solo oculta o deshabilita botones. Mensajes de rechazo en términos de **permiso**, no de rol (§4).
5. **Integración conservadora:** los directores raíz conservan las API de los dominios y sus registros de puertos (§7). La migración preservó el grafo previo, incluidos sus ciclos; no se afirma aislamiento absoluto. Para nuevos flujos, evitar imports directos entre pipelines y coordinar su composición desde la raíz; las excepciones existentes se detallan en REFACTOR_MAP.md.
6. **Clases Tailwind completas**, nunca concatenadas (`bg-${x}-50` no se genera en v4). Importante en v4: sufijo `!` (`hover:text-red-500!`).
7. **Reglas de negocio = funciones puras** que devuelven `null` o el motivo del bloqueo (`editBlockedReason`, `deleteBlockedReason`, `categoryDeleteBlock`…). La vista las usa para deshabilitar con tooltip y el hook/store las revalida.
8. **Documentos con snapshot:** pedidos, cotizaciones y facturas copian precios, cliente y emisor al emitirse; editar catálogo, clientes o ajustes no altera lo emitido.
9. **Nada se borra si tiene historial:** se bloquea con motivo y se ofrece la alternativa (desactivar, reasignar, anular primero) o se usa **eliminación lógica** (pedidos).
10. **Cambios de esquema persistido** suben `version` del store y traen `migrate` (§10).
11. **Ventanas emergentes en portal** (`useAnchoredPopover`): calendarios y menús anclados se dibujan en `document.body` con posición fija, para que no los recorten paneles con scroll ni modales; Escape cierra solo la ventana emergente.
12. **Fechas de negocio = fechas locales `YYYY-MM-DD`** (`src/71-pipeline-seleccion-fechas/05-date.ts`: `todayISO`, `addDaysISO`, `formatLongISO`…). Nunca `toISOString()` para un día local (en El Salvador, UTC−6, desplaza la fecha).
13. **Sin selectores nativos de fecha:** se usa `DatePicker`/`Calendar` (tema claro/oscuro, teclado completo, límites).
14. **Barra de listados (`ListToolbar`, disposición única):** franja de ancho completo bajo la Topbar; arriba, línea de ubicación opcional (*Vista › Área*); debajo, **izquierda: [Áreas (`SegmentedTabs`)] [Filtros]** ··· **derecha: [Auxiliar] [Buscador (`LiveSearch`)] [Acción principal]**. El buscador va siempre a la derecha: es el último elemento de la fila, salvo que exista una acción principal, que entonces cierra la fila. Ancho del buscador: `sm:w-80 xl:w-96`. En pantallas angostas el grupo derecho baja a su propia fila y el buscador ocupa el ancho disponible. Aplicado en Productos, Pedidos, Facturación, Clientes, Categorías y marcas, Ofertas, Cotizaciones, Comentarios y Usuarios. Todas las búsquedas usan `matchesQuery`.
15. **Título único de la vista (h1) solo en la barra superior.** Las páginas no repiten su título ni usan encabezados propios. Vistas principales: nombre del menú (`VIEW_CATALOG`). Las pestañas/áreas **no** cambian el título de la Topbar: la ubicación del área (*Ofertas › Vigentes*) se muestra en la línea `context` de la `ListToolbar`, con la etiqueta expuesta por el hook dueño del área (`areaLabel`/`activeLabel`). Sub-vistas: `usePageMeta({ title, crumbs, backTo, badge })`; la Topbar muestra ruta, botón volver y etiqueta, y actualiza `document.title`. **Excepción, Ajustes:** `useSettingsPageMeta(title)` deja solo el título en la Topbar; el regreso va **dentro del contenido**, discreto, en la esquina superior izquierda (`BackLink`: “‹ Ajustes”, “‹ Usuarios” en Accesos; en vistas con `ListToolbar`, en su fila superior vía `back`). El atajo de Ajustes de la Topbar también queda resaltado y vuelve al hub.

---

## 2. Configuración

| Elemento | Valor |
|---|---|
| `vite.config.ts` | alias `@`, `port: 5174`, `base` desde `VITE_BASE_PATH`, copia `404.html` (SPA fallback) |
| `.env` | `VITE_UI_TRACEABILITY`, `VITE_STORE_URL`, `VITE_BASE_PATH`, `VITE_SHOW_DEMO_CREDENTIALS` |
| TypeScript | `typescript` = alias de `@typescript/typescript6` (lo exige typescript-eslint); `@typescript/native` = TS 7 (`tsc -b`) |
| Scripts | `pnpm dev` · `pnpm lint` (`eslint .`) · `pnpm build` (`tsc -b && vite build`) |
| Despliegue | `public/_redirects`, `_headers`, `.htaccess`, `vercel.json` |

---

## 3. Capa de trazabilidad y kill switch

```tsx
import { tracer } from '@/00-trazabilidad'

const t = tracer('ProductCard', 'src/14-pipeline-tarjetas-productos/02-ProductCard.tsx')
<article {...t(`catalog.card.${p.id}`)}>…</article>
```

- **Contrato estable:** `uiMeta({ id, component, source })` devuelve los tres atributos `data-ui-id`, `data-ui-component`, `data-ui-source` cuando la trazabilidad está activa. `tracer(component, source)` fija componente y ruta y delega en `uiMeta` para cada ID.
- **Identidad:** los IDs de negocio y los nombres de componentes se conservan. Los prefijos de pipeline no se incorporan a los IDs. Ejemplo: `sales.table.status.ORD-2026-001` sigue siendo el mismo ID.
- **Ruta física:** `source` es la ruta real relativa a admin, empezando por `src/`, con el nombre numerado de la fase que emite la metadata. No apunta al director que la reexporta. Los 139 emisores se actualizaron al árbol FLOA.
- **Propagación:** los controles compartidos reciben la metadata por props; por ello un Input/Button puede señalar al archivo de su consumidor. Los componentes con instrumentación propia (por ejemplo, SegmentedTabs) emiten la ruta de su propia fase. Modales, botones de cierre y portales usan el mismo helper y respetan el mismo apagado.
- **Punto único:** todos los emisores importan `@/00-trazabilidad`. No se escriben atributos `data-ui-*` directamente en JSX, para que el kill switch pueda retirarlos de forma uniforme.

| Valor de `VITE_UI_TRACEABILITY` | Resultado |
|---|---|
| Ausente, `true`, cadena vacía u otro valor, incluido `FALSE` | Trazabilidad activa |
| Cadena exacta `false` | `uiMeta` y las funciones de `tracer` devuelven `{}`; no se emiten los tres atributos |

La variable se evalúa al cargar el módulo y Vite la incorpora al transformar/compilar. Para cambiarla, reiniciar el servidor de desarrollo o reconstruir y desplegar el build. No es un control dinámico en localStorage ni un ajuste dependiente de PROD: QA/staging/producción pueden conservar la instrumentación.

```bash
# Desde admin/: apagar para esta ejecución o este build.
VITE_UI_TRACEABILITY=false pnpm dev
VITE_UI_TRACEABILITY=false pnpm build

# Activar explícitamente, incluso en producción.
VITE_UI_TRACEABILITY=true pnpm build

# Auditoría repetible sin dependencias adicionales.
node --test --test-isolation=none tests/traceability.test.mjs
```

Las pruebas comprueban rutas físicas y uso del helper central, los cinco valores de la tabla, IDs dinámicos independientes y propagación a HTML real de Button, Input, Modal/ModalHeader y SegmentedTabs. Tras retirar solo los atributos de trazabilidad, el HTML restante coincide entre los cinco casos.

---

## 4. Acceso: RBAC por vistas

| Concepto | Definición |
|---|---|
| **Catálogo de vistas** | `src/09-pipeline-accesos-por-vista/02-views.config.ts` (`VIEW_CATALOG`): id, etiqueta, ícono y **acciones** (permisos) de cada vista. Única fuente para el sidebar (`src/03-pipeline-navegacion-administrativa/05-nav.config.ts`) y para la pantalla de Accesos. |
| **Accesos del usuario** | `User.access = { views, permissions }`. Una acción solo vale si su vista está habilitada (`normalizeAccess`). La vista de inicio es la primera habilitada en el orden del menú. |
| **Rol** | Solo **plantilla** inicial + etiqueta del puesto (`src/86-pipeline-datos-demo-personas/01-roles.mock.ts`). Al crear un usuario o cambiarle el rol, sus accesos se copian de la plantilla (`templateAccess`). |
| **Rol efectivo** | `effectiveRole(user)` = datos del rol + vistas/permisos del usuario. Todo el sistema sigue leyendo `role.allowedViews` y `role[permiso]` (`useSession`, `getCurrentRole`, `ensurePermission`). |
| **Super Administrador** | = **Administrador de Sistema** (`sistemas@`). Acceso total siempre; sus accesos no se editan. Debe existir al menos uno activo (`src/08-pipeline-edicion-usuarios/03-userRules.ts`). El dueño (`propietario@`) usa la plantilla Gerencia. |
| **Salvaguardas** | Nadie edita sus propios accesos; mínimo una vista; editar requiere `canManageUsers` (si no, la pantalla queda en solo lectura). |

Permisos por vista: Productos (`canCreateProduct`, `canEditProduct`, `canDeleteProduct`, `canUpdateStock`, `canToggleVisibility`) · Pedidos (`canChangeOrderStatus`, **`canReserveOrders`** = Confirmar y reservar, `canDeleteOrders`) · Facturación (`canInvoice`) · Clientes (`canManageCustomers`, `canDeleteCustomers`) · Categorías y marcas (`canManageTaxonomy`) · Ofertas (`canManageOffers`) · Cotizaciones (`canManageQuotes`) · Comentarios (`canModerateReviews`) · Ajustes (`canManageUsers`, `canEditSettings`). Tablero: solo consulta.

---

## 5. Topología FLOA

La estructura estándar de Vite fuera de `src/` se conserva. Hay 492 archivos en src/: los 404 originales y 88 directores nuevos de reexportación. El listado completo de rutas está en [REFACTOR_MAP.md](./REFACTOR_MAP.md).

```txt
src/
├── main.tsx                         entrada Vite / StrictMode
├── 00-orquestador-principal.tsx      RouterProvider (antes App.tsx)
├── 00-entorno.d.ts                   variables VITE_ tipadas
├── 00-estilos-globales.css           estilos y tokens existentes
├── 00-trazabilidad.ts                contrato UI y kill switch
├── 00-director-acceso.ts             API pública de acceso
├── 00-director-catalogo.ts           API pública de catálogo
├── 00-director-ventas.ts             API + registros de reservas y métricas
├── 00-director-ofertas.ts            API + registro del precio vigente
├── 00-director-facturacion.ts        API + registro del correlativo
├── 00-director-*.ts                  otros dominios y contratos transversales
├── 00-documentacion/                HTML históricos y ESCALABILIDAD.md
├── 01-pipeline-rutas-protegidas/
│   ├── 00-director-rutas-protegidas.ts
│   ├── 01-router.tsx
│   ├── 02-RequireAuth.tsx
│   ├── 03-RequireView.tsx
│   ├── 04-HomeRedirect.tsx
│   └── 05-NotFoundPage.tsx
├── 14-pipeline-tarjetas-productos/
│   ├── 00-director-tarjetas-productos.ts
│   ├── 01-ProductGrid.tsx
│   ├── 02-ProductCard.tsx
│   ├── 03-CardMedia.tsx
│   ├── 04-CardBody.tsx
│   └── 05-CardFooter.tsx
└── …                                restantes pipelines, todos al mismo nivel
```

| Rango | Dominio / responsabilidad | Pipelines |
|---|---|---|
| `01–04` | Aplicación, rutas, marco, navegación y cabecera | 4 |
| `05–11` | Acceso, sesión, permisos, usuarios y contraseñas | 7 |
| `12–28` | Catálogo, formularios, imágenes, inventario, categorías y marcas | 17 |
| `29–33` | Clientes, registro, selección e historial | 5 |
| `34–43` | Pedidos, preparación, detalle, reservas, canales, flujo y persistencia | 10 |
| `44–47` | Facturación, emisión y documentos | 4 |
| `48–51` | Cotizaciones, preparación, documentos y persistencia | 4 |
| `52–54` | Ofertas y precio vigente | 3 |
| `55–56` | Moderación y persistencia de comentarios | 2 |
| `57–58` | Tablero y seguimiento comercial | 2 |
| `59–64` | Ajustes, identidad, administración, mantenimiento y fiscal | 6 |
| `65–85` | Interacción y contratos transversales existentes | 21 |
| `86–88` | Datos demo de personas, productos y documentos | 3 |

Cada director nuevo contiene una sola reexportación, sin cargar fases adicionales ni cambiar el orden de inicialización. Los directores raíz conservan las API públicas anteriores. Las fases ya relacionadas siguen usando sus dependencias existentes como excepción explícita al aislamiento. Los módulos desactivados se conservan; el directorio de documentación histórica no es un pipeline ejecutable y no está sujeto al límite de archivos.

---

## 6. Directorio de vistas

Acceso: cada usuario ve las vistas habilitadas en sus Accesos (§4). Columna "Plantillas": roles cuya plantilla incluye la vista.

Los nombres access, catalog, sales, etc. identifican los dominios lógicos originales y las claves de persistencia; sus ubicaciones físicas son los pipelines de §5.

| Ruta | Página | Dominio | Plantillas |
|---|---|---|---|
| `/login` | LoginPage | access | público |
| `/tablero` | DashboardPage | dashboard | super, gerencia, admin |
| `/productos` | ProductsPage | catalog | todos |
| `/pedidos` · `/nuevo` · `/:orderId/editar` | OrdersPage · NewOrderPage · EditOrderPage | sales | todos |
| `/facturacion` | BillingPage | billing | super, gerencia, admin, caja |
| `/clientes` | CustomersPage | customers | todos |
| `/categorias` (`?tab=marcas`) | CategoriesPage | catalog | super, gerencia, admin |
| `/ofertas` · `/nueva` · `/:offerId/editar` | PromotionsPage · OfferBuilderPage | promotions | super, gerencia, admin |
| `/cotizaciones` · `/nueva` | QuotesPage · NewQuotePage | quotes | super, gerencia, admin, servicio |
| `/interacciones` | InteractionsPage (Comentarios) | interactions | super, gerencia, admin, servicio |
| `/ajustes` (+ `canales`, `usuarios`, `usuarios/:userId/accesos`, `identidad`) | SettingsPage y subpáginas | settings | super |
| `*` | NotFoundPage | app | — |

- **Navegación:** Ajustes no está en el sidebar; tiene atajo en la topbar junto al tema (`placement: 'topbar'` en `src/03-pipeline-navegacion-administrativa/05-nav.config.ts`). Cerrar sesión pide confirmación.
- **Redirección:** `/` y las vistas no permitidas llevan a la primera vista habilitada del usuario.
- **Desactivadas:** `ajustes/parametros` y `ajustes/mantenimiento` (código conservado, sin ruta ni tarjeta). Motivo y reactivación: `src/00-documentacion/16-settings-ESCALABILIDAD.md`.

---

## 7. Puertos entre dominios (inversión de dependencias)

| Puerto (declara) | Implementa | Para qué |
|---|---|---|
| `src/33-pipeline-historial-clientes/02-statsPort.ts` (`provideCustomerStats`) | `sales` | Métricas de compra por cliente sin que Clientes importe Pedidos |
| `src/24-pipeline-inventario-productos/04-reservationPort.ts` (`provideReservedStock`) | `sales` | Unidades reservadas por producto, visibles en Productos (`ReservedBadge`) |
| `src/23-pipeline-seleccion-productos/03-pricePort.ts` (`provideEffectivePrice`, `useEffectivePrice`) | `promotions` | **Precio vigente** (con oferta) para el selector de productos, Pedidos y Cotizaciones |
| `src/62-pipeline-parametros-emisor/04-invoiceNumberPort.ts` (`provideLastInvoiceNumber`) | `billing` | Último correlativo emitido, visible en Ajustes › Identidad junto a la semilla |
| `src/84-pipeline-persistencia-demo/01-demoData.ts` (`registerDemoData`) | stores (quotes, interactions…) | Respaldo y restablecimiento sin que Ajustes importe cada dominio |

Los proveedores de reservas y métricas se registran en `src/00-director-ventas.ts`; el de precio, en `src/00-director-ofertas.ts`; y el correlativo, en `src/00-director-facturacion.ts`. `registerDemoData` conserva sus registros en los stores. Sin proveedor, cada puerto conserva su valor neutro anterior.

---

## 8. Flujos y reglas de negocio

| Flujo | Reglas clave | Dónde |
|---|---|---|
| **Pedidos** | Registrar → **Confirmar y reservar** (estado *Reservado*) → Facturar (descuenta) → Entregar · Cancelar antes de facturar. Editables y eliminables solo **sin factura**. Eliminación **lógica** (`deletedOrders` + motivo); el id nunca se reutiliza. Forma de pago: Efectivo/Transferencia (valores retirados se conservan como "(anterior)"). | `src/39-pipeline-transiciones-pedidos/02-orderFlow.ts`, `src/42-pipeline-persistencia-pedidos/01-store.ts` |
| **Reserva** | Modal con calendario propio: vigencia por defecto 3 días, máx. 15, vence a las 23:59 del día elegido. Aparta stock (disponible = stock − reservas **vigentes**); disponible 0 = no se agrega a otros pedidos y se oculta en el Front Office (regla documentada en `store/src/features/catalog/lib/reservations.api.ts`). Al vencer sin facturar, el barrido (`useReservationExpiry`, al abrir el panel y cada minuto) devuelve el pedido a Registrado. Anular factura = re-reserva por 3 días. | `src/38-pipeline-reserva-pedidos/04-reservation.ts`, `src/38-pipeline-reserva-pedidos/02-useReserveOrder.ts` |
| **Cliente en pedido** | Buscador accesible; "Cliente nuevo" se da de alta en el directorio al registrar (valida DUI/NIT, teléfono duplicado → "Usar este cliente"). Cotizaciones mantienen "cliente ocasional". | `src/31-pipeline-seleccion-clientes/02-useCustomerSelection.ts` |
| **Cargos extra** | Envío, instalación… (concepto + monto, máx. 6, ≤ $2 000). Suman al total; pasan de cotización a pedido y a factura como líneas **Servicio** que **nunca mueven inventario**. | `src/78-pipeline-cargos-documentos/03-charges.ts`, `src/47-pipeline-persistencia-facturas/02-invoice.service.ts` |
| **Ofertas** | Capa de precio (no modifica `Product.price`). % o monto fijo, vigencia por fechas + pausa. **Bloquea** precio bajo costo; advierte margen < 5 %; sin solapamientos por producto. | `src/54-pipeline-precio-ofertas/02-offerPricing.ts` |
| **Categorías y marcas** | Nombres únicos (sin tildes/mayúsculas); slug fijo; no se elimina con productos; renombrar marca actualiza sus productos; marca inactiva no se ofrece en productos nuevos. | `src/25-pipeline-persistencia-catalogo/03-taxonomy.ts` |
| **Canales y flujo** | Canal con pedidos no se elimina (se desactiva); renombrar actualiza pedidos. Del flujo solo se editan nombre y descripción; transiciones y efectos son fijos. | `src/42-pipeline-persistencia-pedidos/02-order.service.ts`, `src/39-pipeline-transiciones-pedidos/02-orderFlow.ts` |
| **Comentarios** | Pendiente → Publicado / Rechazado (motivo interno) · Eliminar. Señales de posible spam. | `src/56-pipeline-persistencia-comentarios/02-reviews.service.ts` |
| **Búsqueda en tiempo real** | `LiveSearch` + `matchesQuery`: cada palabra debe aparecer en algún campo (AND entre palabras), sin tildes/mayúsculas, teléfonos con o sin guion; se combina con pestañas/filtros y vuelve a la página 1. Pedidos (`orderSearchFields`, se conserva al volver de editar), Facturación (por pestaña; `invoiceSearchFields`), Ofertas y Cotizaciones (`filterQuotes`). | `src/85-pipeline-identificadores-texto/01-text.ts` |
| **Identidad del emisor** | Datos de encabezado y bloque DTE (razón social, NIT, NRC, giro, establecimiento) validados; IVA no editable; aplica a documentos futuros. **Semilla del correlativo** de facturas (`invoiceSeed`): solo adelanta la numeración; rige `max(semilla, último emitido + 1)` y nunca se reutiliza un número (incluye anuladas). | `src/62-pipeline-parametros-emisor/03-identity.ts` |

---

## 9. Inventario de componentes

| Dominio | Componentes | Hooks |
|---|---|---|
| **access** | LoginCard, ChangePasswordScreen, UsersSection/UserRow, UserFormModal, ResetPasswordModal, AccessSummaryBar, AccessSidebar, ViewActionsPanel, RoleBadge | useSession, useLoginForm, useAccessActions, useUsersAdmin, useUserForm, useUserAccess |
| **catalog** | ProductToolbar, ProductGrid/Card, ProductTable, ProductFormModal (tabs), ProductDetailModal, ProductPicker, StockBadge, ReservedBadge, TaxonomyToolbar, CategoryCard, BrandsTable/Row, Category/BrandFormModal | useFilteredProducts, useProductForm, useProductPicker, useTaxonomyPage, useCategoriesTab, useBrandsTab, useCategoryForm, useBrandForm |
| **customers** | CustomerRow/FormModal, CustomerPicker (CustomerSearch, SelectedCustomerCard, WalkinCustomerFields, DuplicateCustomerNotice) | useCustomers, useCustomerSelection, useCustomerCombobox |
| **sales** | OrdersToolbar, OrdersTable/Row (fila clickable, columnas ordenables), OrderSummaryPanel, OrderDetailModal, ReserveOrderModal, ReservationTag, ChannelsTable, ChannelFormModal, FlowTable, StatusLabelModal | useOrders, useOrderBuilder, useOrderActions, useOrderDetail, usePaginatedOrders, useReserveOrder, useReservationExpiry, useChannels, useFlowTable |
| **billing** | BillingToolbar, InvoicesTable, PendingOrdersTable, InvoiceEmitModal (StockCheck), InvoicePreviewModal | useBilling, useInvoiceEmit, useInvoicePreview |
| **quotes** | QuotesToolbar, QuoteRow, QuoteSummaryPanel, QuotePreviewModal | useQuotes, useQuoteBuilder, useQuotePreview |
| **promotions** | OffersToolbar, OfferRow, OfferPanel, OfferProductList | useOffers, useOfferBuilder, useOfferPriceResolver |
| **interactions** | ReviewCard, ReviewsToolbar, Stars | useReviewModeration |
| **shared (destacados)** | ListToolbar, LiveSearch, SegmentedTabs, BackLink, Calendar, DatePicker, Breadcrumb (solo Topbar), DataTable (ordenable), ExtraChargesEditor, LineItemsEditor, ConfirmDialog (motivo opcional) | useCalendar, useAnchoredPopover, usePageMeta, useExtraCharges, useLineItems, usePagination |
| **dashboard · settings** | KpiGrid, StockHealthPanel, QuickLinks · SettingsHubCard, IdentityForm/Fields/Preview | useDashboardMetrics · useSettingsHub, useSettingsPageMeta, useIdentityForm, useStoreSettings |

Los modales se abren desde el store global (`modal.store`); las confirmaciones usan el `ConfirmDialog` global (admite motivo obligatorio).

---

## 10. Persistencia y migraciones

| Store (`localStorage`) | Versión | Último cambio |
|---|---|---|
| `access` | v5 | Acción `canReserveOrders` (se otorga a quien ya gestionaba pedidos) · v4: accesos por usuario; Super Administrador = Administrador de Sistema (el dueño pasa a Gerencia; se agrega `sistemas@` si no hay superadmin activo) |
| `catalog` | v4 | Marcas como entidad (derivadas de las marcas escritas en productos) |
| `sales` | v4 | Vigencia de reserva (`reservedUntil`; los reservados reciben 3 días) · v3: cargos extra; `deletedOrders` y `statusLabels` por defecto al hidratar |
| `quotes` | v1 | Cargos extra |
| `promotions` | v1 | Campañas por categoría → ofertas **pausadas** con los productos de la categoría |
| `interactions` | — | Store nuevo (comentarios) |

Regla: nunca descartar datos guardados; completar con valores por defecto y documentar el cambio en el comentario del store.

---

## 11. Cómo respetar las 150 líneas

- **Tarjetas grandes** → `Media`, `Body`, `Footer`.
- **Tablas** → `DataTable` + filas (`*Row.tsx`).
- **Formularios** → `useXForm.ts` (lógica), `XFields.tsx` (campos), `XFormModal.tsx` / `XForm.tsx` (contenedor).
- **Listas repetitivas** (nav, KPI, hub, vistas de Accesos) → `config.ts` + `.map()`.

Conservar los prefijos de fase al crear archivos. Si un pipeline supera seis archivos, crear otro pipeline paralelo y coordinar su entrada desde la raíz, respetando las excepciones documentadas.

---

## 12. Verificación

1. Desde admin/: `pnpm exec tsc -b --force --pretty false`, `pnpm lint` y `pnpm build` deben terminar sin errores. Se conserva el aviso previo de Vite por el tamaño del bundle.
2. Ejecutar `node --test --test-isolation=none tests/traceability.test.mjs`: siete comprobaciones, sin instalar librerías ni modificar scripts del package.json. Repetir al mover/renombrar fases o cambiar el helper.
3. Mantener ≤ 150 líneas por `.tsx`; los límites se aplican a los archivos numerados de todos los pipelines. La instrumentación existente mantiene sus IDs, componentes y puntos de aplicación.
4. En un build con `VITE_UI_TRACEABILITY=true`, inspeccionar `[data-ui-id],[data-ui-component],[data-ui-source]`: cada nodo instrumentado tiene los tres atributos y su ruta source existe. En un build con `false`, ese selector debe devolver cero nodos, también con modales y portales abiertos.
5. Auditoría 2026-11-12: 23 escenarios en Chrome con `true` y los mismos 23 con `false` (46 en total), con perfil temporal y datos demo. Incluyen login, los diez dominios, formularios nuevos, accesos de usuario, detalle de producto, galería en portal y calendario en portal. Sin excepciones JavaScript; cero nodos con metadata en el build desactivado.
6. Se comparó cada archivo de src/ con el cierre de la migración: solo cambiaron las 139 rutas de metadata y comentarios del helper; estilos, JSX, IDs, nombres de componentes, lógica, mocks y esquemas persistidos permanecen intactos. La hoja CSS generada conserva el mismo SHA-256. El JS cambia por las rutas source actualizadas.
7. Para cambios futuros de negocio, probar los esquemas persistidos y los flujos afectados: pedido con cargos → reservar → facturar → anular → vencer → eliminar; ofertas; correlativo; RBAC; alta de cliente. Esta auditoría de trazabilidad no reejecuta ni sustituye una regresión completa de esos flujos.

---

## 13. Pendientes conocidos

- **Integración API pendiente:** el Front Office no envía aún comentarios al admin (contrato en `store/src/features/catalog/lib/reviews.api.ts`); respaldo y restablecimiento están desactivados con Ajustes › Mantenimiento.
- **Bundle principal ≈ 741 kB** (aviso de Vite > 500 kB): candidato a carga diferida de rutas (`React.lazy`) por feature.
- **Reservas en el Front Office:** el ocultamiento por disponible 0 está documentado pero no conectado (falta la API); el vencimiento lo hace el navegador (en producción: tarea del servidor).
- **Sello DTE simulado** en facturación (integración con Hacienda pendiente).
- Ofertas: sin descuento distinto por producto ni borradores.
- **Datos de ejemplo con fechas fijas** (nov-2026): cuando el reloj pase las fechas de reserva de los pedidos demo, el barrido los devolverá a Registrado al cargar (comportamiento esperado).
- Pruebas automatizadas de trazabilidad en `tests/traceability.test.mjs`; la regresión completa de negocio sigue sin suite automatizada. No se añadieron dependencias ni un framework de pruebas.
- No hay vista para consultar o restaurar pedidos eliminados (los datos se conservan en `deletedOrders`).
