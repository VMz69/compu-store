# Blueprint · Back Office `/admin` — CompuStore SV

> **Objetivo:** prototipo funcional con datos dummy (inventario, pedidos, facturación, CRM, ofertas, moderación) con trazabilidad desactivable.
> **Stack:** React 19 · Vite 8 · TS 7 (`tsc`) + TS 6 (tooling) · Tailwind v4 · React Router 7 · Zustand 5 · jsPDF
> **Fuente visual:** `mocksUI-base/compustore_sv_back_office.html` · **Gemelo:** [`store/arch-fronOffice.md`](../store/arch-fronOffice.md)
> **Última auditoría:** 2026-11-10 — `tsc`, `eslint src` y `vite build` sin errores; migraciones de datos verificadas (§10).

---

## 0. Especificación común (store + admin)

| Aspecto | Convención |
|---|---|
| Arquitectura | DOMA por features: `app/ → features/ → shared/` (nunca al revés) |
| API de un feature | Solo `features/<x>/index.ts`; dentro del feature, imports relativos |
| Anatomía | `index.ts · types.ts · store.ts · hooks/ · lib/ · mocks/ · config/ · components/ · pages/` |
| Vista | `.tsx` ≤ 150 líneas (ESLint `max-lines`), sin estado ni cálculos |
| Lógica | hooks (vista) · `lib/` (funciones puras) · `store.ts` (Zustand) |
| Datos | Mocks tipados en `features/<x>/mocks/`; el feature los expone por su `index.ts` |
| Trazabilidad | `data-ui-id/component/source`, kill-switch `VITE_UI_TRACEABILITY` |
| Alias | `@/*` → `src/*` |

---

## 1. Reglas

1. **Máximo 150 líneas por `.tsx`** (ESLint lo bloquea); páginas < 60.
2. **La vista no lleva lógica.** Estado, cálculos y validaciones en hooks, `lib/` o stores (incluidas suscripciones: p. ej. `useStatusMeta`).
3. **Mocking-first.** Las acciones simulan latencia (`delay()`) y exponen `isLoading`; los envíos con varios pasos usan un candado local (`saving`) contra dobles clics.
4. **Permisos** se validan en los hooks de acciones (`ensurePermission`); la vista solo oculta o deshabilita botones. Mensajes de rechazo en términos de **permiso**, no de rol (§4).
5. **Grafo acíclico:** `access` es la base; `catalog → access`; `customers → access`; `sales → catalog, customers`; `billing`, `quotes`, `promotions`, `interactions`, `settings` en la cima. Cuando la dependencia iría "hacia abajo" se usa un **puerto** (§7).
6. **Clases Tailwind completas**, nunca concatenadas (`bg-${x}-50` no se genera en v4). Importante en v4: sufijo `!` (`hover:text-red-500!`).
7. **Reglas de negocio = funciones puras** que devuelven `null` o el motivo del bloqueo (`editBlockedReason`, `deleteBlockedReason`, `categoryDeleteBlock`…). La vista las usa para deshabilitar con tooltip y el hook/store las revalida.
8. **Documentos con snapshot:** pedidos, cotizaciones y facturas copian precios, cliente y emisor al emitirse; editar catálogo, clientes o ajustes no altera lo emitido.
9. **Nada se borra si tiene historial:** se bloquea con motivo y se ofrece la alternativa (desactivar, reasignar, anular primero) o se usa **eliminación lógica** (pedidos).
10. **Cambios de esquema persistido** suben `version` del store y traen `migrate` (§10).

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

## 3. Capa de trazabilidad

```ts
const t = tracer('ProductCard', 'src/features/catalog/components/grid/ProductCard.tsx')
<article {...t(`catalog.card.${p.id}`)}>…</article>
```

- `tracer(component, source)` fija ambos una vez por archivo; delega en `uiMeta` (mismo contrato que `/store`).
- **Ids:** `feature.zona.elemento[.idDinámico]` (ej. `sales.table.status.ORD-2026-001`).
- `source` debe coincidir con la ruta real; al mover un archivo, actualízalo.
- Primitivas de `shared/ui` reciben la metadata por props (`{...t(...)}` desde quien las usa).
- Retiro total: borrar `src/ui-traceability/` y sus imports (`grep -rn "ui-traceability" src`).

---

## 4. Acceso: RBAC por vistas

| Concepto | Definición |
|---|---|
| **Catálogo de vistas** | `access/config/views.config.ts` (`VIEW_CATALOG`): id, etiqueta, ícono y **acciones** (permisos) de cada vista. Única fuente para el sidebar (`app/nav.config.ts`) y para la pantalla de Accesos. |
| **Accesos del usuario** | `User.access = { views, permissions }`. Una acción solo vale si su vista está habilitada (`normalizeAccess`). La vista de inicio es la primera habilitada en el orden del menú. |
| **Rol** | Solo **plantilla** inicial + etiqueta del puesto (`roles.mock.ts`). Al crear un usuario o cambiarle el rol, sus accesos se copian de la plantilla (`templateAccess`). |
| **Rol efectivo** | `effectiveRole(user)` = datos del rol + vistas/permisos del usuario. Todo el sistema sigue leyendo `role.allowedViews` y `role[permiso]` (`useSession`, `getCurrentRole`, `ensurePermission`). |
| **Super Administrador** | = **Administrador de Sistema** (`sistemas@`). Acceso total siempre; sus accesos no se editan. Debe existir al menos uno activo (`userRules.ts`). El dueño (`propietario@`) usa la plantilla Gerencia. |
| **Salvaguardas** | Nadie edita sus propios accesos; mínimo una vista; editar requiere `canManageUsers` (si no, la pantalla queda en solo lectura). |

Permisos por vista: Productos (`canCreateProduct`, `canEditProduct`, `canDeleteProduct`, `canUpdateStock`, `canToggleVisibility`) · Pedidos (`canChangeOrderStatus`, `canDeleteOrders`) · Facturación (`canInvoice`) · Clientes (`canManageCustomers`, `canDeleteCustomers`) · Categorías y marcas (`canManageTaxonomy`) · Ofertas (`canManageOffers`) · Cotizaciones (`canManageQuotes`) · Comentarios (`canModerateReviews`) · Ajustes (`canManageUsers`, `canEditSettings`). Tablero: solo consulta.

---

## 5. Topología

```txt
src/
├── main.tsx · App.tsx           RouterProvider
├── ui-traceability/             uiMeta + tracer
├── app/                         ensamblaje
│   ├── router.tsx · nav.config.ts (desde VIEW_CATALOG) · RootLayout · Overlays · ModalHost
│   ├── guards/                  RequireAuth · RequireView · HomeRedirect
│   ├── hooks/                   useNavItems · useLayout (sidebar, topbar, atajos)
│   └── layout/                  AdminLayout · sidebar/ (nav, perfil, cerrar sesión) · topbar/ (tema, atajo Ajustes)
├── shared/                      sin lógica de negocio
│   ├── ui/                      primitivas (Button, Modal, DataTable ordenable, ExtraChargesEditor, LineItemsEditor…)
│   ├── hooks/                   useFormState · useLineItems · useExtraCharges · usePagination · useConfirmDialog…
│   ├── store/                   toast · confirm (con motivo opcional) · modal · layout
│   ├── lib/                     pricing · charges · sort · date · text (foldText) · pdf · storage · demoData…
│   └── config/store.config.ts   identidad comercial de fábrica
└── features/
    ├── access/       login, sesión, usuarios, plantillas de rol, accesos por vista
    ├── catalog/      productos, categorías y marcas, inventario, puerto de precio vigente
    ├── customers/    directorio, buscador de clientes, alta desde pedidos
    ├── sales/        pedidos (CRUD + eliminación lógica), cargos extra, canales, flujo
    ├── billing/      facturación DTE y PDF (líneas de producto y de servicio)
    ├── quotes/       cotizaciones, cargos extra, PDF, conversión a pedido
    ├── promotions/   ofertas con vigencia y análisis de margen
    ├── interactions/ moderación de comentarios del Front Office
    ├── dashboard/
    └── settings/     hub, canales y flujo, usuarios/accesos, identidad del emisor
```

---

## 6. Directorio de vistas

Acceso: cada usuario ve las vistas habilitadas en sus Accesos (§4). Columna "Plantillas": roles cuya plantilla incluye la vista.

| Ruta | Página | Feature | Plantillas |
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

- **Navegación:** Ajustes no está en el sidebar; tiene atajo en la topbar junto al tema (`placement: 'topbar'` en `nav.config.ts`). Cerrar sesión pide confirmación.
- **Redirección:** `/` y las vistas no permitidas llevan a la primera vista habilitada del usuario.
- **Desactivadas:** `ajustes/parametros` y `ajustes/mantenimiento` (código conservado, sin ruta ni tarjeta). Motivo y reactivación: `src/features/settings/ESCALABILIDAD.md`.

---

## 7. Puertos entre features (inversión de dependencias)

| Puerto (declara) | Implementa | Para qué |
|---|---|---|
| `customers/lib/statsPort.ts` (`provideCustomerStats`) | `sales` | Métricas de compra por cliente sin que Clientes importe Pedidos |
| `catalog/lib/pricePort.ts` (`provideEffectivePrice`, `useEffectivePrice`) | `promotions` | **Precio vigente** (con oferta) para el selector de productos, Pedidos y Cotizaciones |
| `shared/lib/demoData.ts` (`registerDemoData`) | stores (quotes, interactions…) | Respaldo y restablecimiento sin que Ajustes importe cada feature |

El proveedor se registra en el `index.ts` del feature que implementa; sin proveedor, el puerto devuelve un valor neutro.

---

## 8. Flujos y reglas de negocio

| Flujo | Reglas clave | Dónde |
|---|---|---|
| **Pedidos** | Registrar → Confirmar (reserva stock) → Facturar (descuenta) → Entregar · Cancelar antes de facturar. Editables y eliminables solo **sin factura**. Eliminación **lógica** (`deletedOrders` + motivo); el id nunca se reutiliza. Forma de pago: Efectivo/Transferencia (valores retirados se conservan como "(anterior)"). | `sales/lib/orderFlow.ts`, `store.ts` |
| **Cliente en pedido** | Buscador accesible; "Cliente nuevo" se da de alta en el directorio al registrar (valida DUI/NIT, teléfono duplicado → "Usar este cliente"). Cotizaciones mantienen "cliente ocasional". | `customers/hooks/useCustomerSelection.ts` |
| **Cargos extra** | Envío, instalación… (concepto + monto, máx. 6, ≤ $2 000). Suman al total; pasan de cotización a pedido y a factura como líneas **Servicio** que **nunca mueven inventario**. | `shared/lib/charges.ts`, `billing/lib/invoice.service.ts` |
| **Ofertas** | Capa de precio (no modifica `Product.price`). % o monto fijo, vigencia por fechas + pausa. **Bloquea** precio bajo costo; advierte margen < 5 %; sin solapamientos por producto. | `promotions/lib/offerPricing.ts` |
| **Categorías y marcas** | Nombres únicos (sin tildes/mayúsculas); slug fijo; no se elimina con productos; renombrar marca actualiza sus productos; marca inactiva no se ofrece en productos nuevos. | `catalog/lib/taxonomy.ts` |
| **Canales y flujo** | Canal con pedidos no se elimina (se desactiva); renombrar actualiza pedidos. Del flujo solo se editan nombre y descripción; transiciones y efectos son fijos. | `sales/lib/order.service.ts`, `orderFlow.ts` |
| **Comentarios** | Pendiente → Publicado / Rechazado (motivo interno) · Eliminar. Señales de posible spam. | `interactions/lib/reviews.service.ts` |
| **Identidad del emisor** | Datos de encabezado y bloque DTE (razón social, NIT, NRC, giro, establecimiento) validados; IVA no editable; aplica a documentos futuros. | `settings/lib/identity.ts` |

---

## 9. Inventario de componentes

| Feature | Componentes | Hooks |
|---|---|---|
| **access** | LoginCard, ChangePasswordScreen, UsersSection/UserRow, UserFormModal, ResetPasswordModal, AccessSidebar, ViewActionsPanel, RoleBadge | useSession, useLoginForm, useAccessActions, useUsersAdmin, useUserForm, useUserAccess |
| **catalog** | ProductToolbar, ProductGrid/Card, ProductTable, ProductFormModal (tabs), ProductDetailModal, ProductPicker, TaxonomyToolbar, CategoryCard, BrandsTable/Row, Category/BrandFormModal | useFilteredProducts, useProductForm, useProductPicker, useTaxonomyPage, useCategoriesTab, useBrandsTab, useCategoryForm, useBrandForm |
| **customers** | CustomerRow/FormModal, CustomerPicker (CustomerSearch, SelectedCustomerCard, WalkinCustomerFields, DuplicateCustomerNotice) | useCustomers, useCustomerSelection, useCustomerCombobox |
| **sales** | OrdersTable/Row (fila clickable, columnas ordenables), OrderSummaryPanel, OrderDetailModal, ChannelsTable, ChannelFormModal, FlowTable, StatusLabelModal | useOrders, useOrderBuilder, useOrderActions, useOrderDetail, usePaginatedOrders, useChannels, useFlowTable |
| **billing** | InvoicesTable, PendingOrdersTable, InvoiceEmitModal (StockCheck), InvoicePreviewModal | useBilling, useInvoiceEmit, useInvoicePreview |
| **quotes** | QuoteRow, QuoteSummaryPanel, QuotePreviewModal | useQuotes, useQuoteBuilder, useQuotePreview |
| **promotions** | OfferRow, OfferPanel, OfferProductList | useOffers, useOfferBuilder, useOfferPriceResolver |
| **interactions** | ReviewCard, ReviewsToolbar, Stars | useReviewModeration |
| **dashboard · settings** | KpiGrid, StockHealthPanel, QuickLinks · SettingsHubCard, SettingsSubHeader, IdentityForm/Fields/Preview | useDashboardMetrics · useSettingsHub, useIdentityForm, useStoreSettings |

Los modales se abren desde el store global (`modal.store`); las confirmaciones usan el `ConfirmDialog` global (admite motivo obligatorio).

---

## 10. Persistencia y migraciones

| Store (`localStorage`) | Versión | Último cambio |
|---|---|---|
| `access` | v4 | Accesos por usuario; Super Administrador = Administrador de Sistema (el dueño pasa a Gerencia; se agrega `sistemas@` si no hay superadmin activo) |
| `catalog` | v4 | Marcas como entidad (derivadas de las marcas escritas en productos) |
| `sales` | v3 | Cargos extra; `deletedOrders` y `statusLabels` se completan por defecto al hidratar |
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

---

## 12. Verificación

1. `pnpm lint` + `pnpm build` (incluye `tsc -b`) sin errores.
2. Ningún `.tsx` de `components/` o `pages/` supera 150 líneas.
3. Todo elemento interactivo activo lleva `{...t(...)}`.
4. Si cambia un esquema persistido: probar su `migrate` con datos de la versión anterior.
5. Revisión visual contra el demo (claro y oscuro).

---

## 13. Pendientes conocidos

- **API inexistente** (`/api` vacío): el Front Office no envía aún comentarios al admin (contrato en `store/src/features/catalog/lib/reviews.api.ts`); respaldo y restablecimiento están desactivados con Ajustes › Mantenimiento.
- **Bundle principal ≈ 720 kB** (aviso de Vite > 500 kB): candidato a carga diferida de rutas (`React.lazy`) por feature.
- **Sello DTE simulado** en facturación (integración con Hacienda pendiente).
- Ofertas: sin descuento distinto por producto ni borradores.
- No hay vista para consultar o restaurar pedidos eliminados (los datos se conservan en `deletedOrders`).
