# Blueprint · Back Office `/admin` — CompuStore SV

> **Objetivo:** prototipo funcional con datos dummy (inventario, pedidos, facturación, CRM) con trazabilidad desactivable.
> **Stack:** React 19 · Vite 8 · TS 7 (`tsc`) + TS 6 (tooling) · Tailwind v4 · React Router 7 · Zustand 5 · jsPDF
> **Fuente visual:** `mocksUI-base/compustore_sv_back_office.html` · **Gemelo:** [`store/arch-fronOffice.md`](../store/arch-fronOffice.md)

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
2. **La vista no lleva lógica.** Estado, cálculos y validaciones en hooks o stores.
3. **Mocking-first.** Las acciones simulan latencia (`delay()`) y exponen `isLoading`.
4. **Permisos** se validan en los hooks de acciones (`ensurePermission`); la vista solo oculta botones.
5. **Grafo acíclico:** `access` es la base; `catalog → access`; `sales → catalog`; `billing`, `quotes`, `settings` en la cima.
6. **Clases Tailwind completas**, nunca concatenadas (`bg-${x}-50` no se genera en v4).

---

## 2. Configuración

| Elemento | Valor |
|---|---|
| `vite.config.ts` | alias `@`, `port: 5174`, `base` desde `VITE_BASE_PATH`, copia `404.html` (SPA fallback) |
| `.env` | `VITE_UI_TRACEABILITY`, `VITE_STORE_URL`, `VITE_BASE_PATH`, `VITE_SHOW_DEMO_CREDENTIALS` |
| TypeScript | `typescript` = alias de `@typescript/typescript6` (lo exige typescript-eslint); `@typescript/native` = TS 7 (`tsc -b`) |
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
- Retiro total: borrar `src/ui-traceability/` y sus imports (`grep -rn "ui-traceability" src`).

---

## 4. Topología

```txt
src/
├── main.tsx · App.tsx           RouterProvider
├── ui-traceability/             uiMeta + tracer
├── app/                         ensamblaje
│   ├── router.tsx · nav.config.ts · RootLayout · Overlays · ModalHost
│   ├── guards/                  RequireAuth · RequireView · HomeRedirect
│   ├── hooks/ · pages/NotFoundPage
│   └── layout/                  AdminLayout · sidebar/ · topbar/
├── shared/                      sin lógica de negocio
│   ├── ui/                      primitivas (Button, Modal, DataTable, PdfPreviewModal…)
│   ├── hooks/ · store/          toast · confirm · modal · theme · layout
│   ├── lib/                     currency · date · pdf · storage · whatsapp · cn…
│   └── config/store.config.ts   identidad comercial
└── features/
    ├── access/      login, roles, sesión, usuarios
    ├── catalog/     productos, categorías, inventario
    ├── sales/       pedidos, canales, estados
    ├── billing/     facturación y PDF
    ├── customers/   clientes
    ├── quotes/      cotizaciones y PDF
    ├── promotions/  ofertas web
    ├── interactions/ · dashboard/ · settings/
```

---

## 5. Directorio de vistas

| Ruta | Página | Feature | Roles |
|---|---|---|---|
| `/login` | LoginPage | access | público |
| `/tablero` | DashboardPage | dashboard | super, gerencia, admin |
| `/productos` | ProductsPage | catalog | todos |
| `/pedidos` | OrdersPage | sales | todos |
| `/facturacion` | BillingPage | billing | super, gerencia, admin, caja |
| `/clientes` | CustomersPage | customers | todos |
| `/categorias` · `/ofertas` | CategoriesPage · PromotionsPage | catalog · promotions | super, gerencia, admin |
| `/cotizaciones` · `/nueva` | QuotesPage · NewQuotePage | quotes | super, gerencia, admin, servicio |
| `/interacciones` | InteractionsPage | interactions | super, gerencia, admin, servicio |
| `/ajustes` (+ `canales`, `usuarios`, `identidad`, `parametros`, `mantenimiento`) | SettingsPage y subpáginas | settings | super |
| `*` | NotFoundPage | app | — |

**Redirección por rol:** `/` y las vistas no permitidas llevan a `allowedViews[0]` (caja → `/pedidos`, servicio → `/interacciones`).

---

## 6. Inventario de componentes

| Feature | Componentes | Hooks |
|---|---|---|
| **access** | LoginCard, ChangePasswordScreen, UsersSection, UserFormModal, RoleMatrix, RoleBadge | useSession, useLoginForm, useAccessActions, useUsersAdmin |
| **catalog** | ProductToolbar, ProductGrid/Card, ProductTable, ProductFormModal (tabs), ProductDetailModal, CategoryCard/FormModal, StockBadge | useFilteredProducts, useInventoryMetrics, useProductActions, useProductForm |
| **sales** | OrdersTable, OrderStatusTabs/Badge/Select, OrderFormModal, OrderDetailModal, ChannelsSection, StatusPipeline | useOrders, useOrderActions, useOrderForm, usePipeline, useChannels |
| **billing** | InvoicesTable, PendingOrdersTable, InvoiceEmitModal, InvoicePreviewModal | useBilling, useInvoiceEmit, useInvoicePreview |
| **quotes** | QuoteRow, ProductPicker, QuoteItemsList, QuoteSummaryPanel, QuotePreviewModal | useQuotes, useQuoteBuilder, useQuotePreview |
| **customers · promotions** | CustomerRow/FormModal · PromotionCard, OfferFormModal | useCustomers · usePromotions |
| **dashboard · settings** | KpiGrid, StockHealthPanel, QuickLinks · SettingsHubCard, IdentityForm, FiscalCards, BackupCard | useDashboardMetrics · useStoreSettings, useMaintenance |

Los modales se abren desde el store global (`modal.store`); las confirmaciones usan el `ConfirmDialog` global.

---

## 7. Cómo respetar las 150 líneas

- **Tarjetas grandes** → `Media`, `Body`, `Footer`.
- **Tablas** → `DataTable` + filas (`*Row.tsx`).
- **Formularios** → `useXForm.ts` (lógica), `XFormFields.tsx` (campos), `XFormModal.tsx` (contenedor).
- **Listas repetitivas** (nav, KPI, hub de ajustes) → `config.ts` + `.map()`.

---

## 8. Verificación

`pnpm lint` + `pnpm build` en cada app, y revisión visual contra el demo.
