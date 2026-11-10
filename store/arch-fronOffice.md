# Blueprint · Front Office `/store` — CompuStore SV

> **Objetivo:** vitrina pública (catálogo, carrito, favoritos, contacto) con checkout por WhatsApp.
> **Stack:** React 19 · Vite 8 · TS 6 · Tailwind v4 · React Router 7 (HashRouter) · Zustand 5
> **Gemelo:** [`admin/arch-backOffice.md`](../admin/arch-backOffice.md) — misma arquitectura y reglas.

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

1. **Máximo 150 líneas por `.tsx`** (ESLint lo bloquea); páginas ≤ 100.
2. **La vista no lleva lógica.** Estado, efectos y cálculos van en hooks, `lib/` o stores.
3. **Grafo acíclico de features:** `cart ← catalog ← home / search`; `info` es independiente.
4. **`shared/` no conoce el negocio:** no importa de `features/` ni de `app/`.
5. **Clases Tailwind completas;** las condicionales largas se extraen a `*.styles.ts`.
6. **Persistencia versionada:** `compustore_sv_cart_v4`, `compustore_sv_favorites_v2`, `compustore_sv_theme`.

---

## 2. Capa de trazabilidad

```tsx
import { uiMeta } from '@/ui-traceability'
const SOURCE = 'src/features/catalog/components/grid/ProductCard.tsx'
<article {...uiMeta({ id: `producto.card.${p.id}`, component: 'ProductCard', source: SOURCE })} />
```

- `source` **debe** coincidir con la ruta real del archivo: al mover un archivo, actualízalo.
- Los `id` son contrato estable (no dependen de la carpeta). **Uso funcional:** `useSearchLock` y
  `useMobileMenuOverlay` consultan `[data-ui-id="layout.sticky-header"]` y `layout.search.dropdown`.
- Listas: ids dinámicos (`lista.item.${id}`). Nunca en componentes de terceros (envolver en `<span>`).

---

## 3. Topología

```txt
src/
├── main.tsx · App.tsx           HashRouter → AppRoutes
├── ui-traceability/             uiMeta + kill-switch
├── app/                         ensamblaje
│   ├── router.tsx               rutas
│   ├── nav.config.ts            enlaces del footer · `INFO_LINKS` (Nosotros/Contacto de la navbar)
│   ├── hooks/                   header, navbar, overlay móvil, scroll, insets del layout
│   ├── lib/route.service.ts     normaliza la vista inicial
│   └── layout/                  MainLayout · header/ (TopBar, Header) · navbar/ · footer/ · ToastContainer · FloatingWhatsApp
├── shared/                      sin lógica de negocio
│   ├── ui/                      Button, Badge, Select, Breadcrumbs, EmptyState, Logo, Toast…
│   ├── hooks/                   useTheme · useToasts · useClickOutside
│   ├── store/                   ui.store (panel Explorar, menú móvil, barra de compra móvil, tema) · toast.store
│   ├── lib/                     formatters · whatsapp (enlace genérico)
│   ├── config/store.config.ts   identidad comercial
│   └── types/                   modelo del catálogo (Product + `images?` de galería, Category, Brand, Review…)
└── features/
    ├── catalog/                 productos, categorías, marcas, ofertas, detalle, reseñas, favoritos
    ├── cart/                    carrito, checkout WhatsApp, CartWidget
    ├── search/                  buscador del header + resultados
    ├── home/                    portada (hero, pilares, vitrinas)
    └── info/                    nosotros y contacto
```

> `shared/types` es el *shared kernel*: `Product` lo usan `catalog`, `cart` y `search`, y ubicarlo en
> un feature crearía un ciclo `catalog ↔ cart`.

---

## 4. Directorio de vistas

| Ruta (`#/…`) | Página | Feature |
|---|---|---|
| `/` | Home | home |
| `/categories` | CatalogHub | catalog |
| `/category/:slug` | CategoryView | catalog |
| `/brands` | BrandsView | catalog |
| `/brand/:slug` | BrandDetail | catalog |
| `/product/:id` | ProductDetail | catalog |
| `/offers` | OffersView | catalog |
| `/favorites` | FavoritesView | catalog |
| `/cart` | CartView | cart |
| `/search` | SearchView | search |
| `/about` · `/contact` | AboutView · ContactView | info |
| `*` | → `/` | app |

---

## 5. Inventario de componentes

| Feature | Componentes | Hooks / estado |
|---|---|---|
| **app** (layout) | `header/` TopBar, Header · `navbar/` Navbar, ExploreMenu (+Panel), MobileMenu (+Catalog, Info), MobileMenuBackdrop · `footer/` · FloatingWhatsApp, ToastContainer | useNavbar, useHeaderState, useMobileMenuOverlay, useMobileSearchCollapse, useLayoutInsets, useScrollToTop |
| **catalog** | `grid/` ProductCard (+Media, Info, Actions), ProductGrid · `detail/` Gallery (+Thumbs, Lightbox), Info (+Actions), BuyBox, MobileBar, Tabs, RelatedList · `reviews/` ReviewCard, ReviewForm, RatingSummary · `browse/` CategoryCard, BrandCard · FilterBar | useFilters, useCatalogStats, useProductDetail, useProductTabs, useProductGallery, useShareProduct, useMobileActionBar, useFavorites, useFavoritesView · `filters` / `favorites` / `reviews.store` |
| **cart** | CartItem, CartSummary, CheckoutForm, CartWidget | useCart, useCartView · `store.ts` |
| **search** | SearchInput, SearchDropdown, SearchResultItem | useSearchInput, useSearchSuggestions, useSearchDropdown, useSearchLock |
| **home** | HeroSlider, TrustPillars, CategoryTile, BrandTile | useHomeData, useHeroSlider |
| **info** | ContactForm, ContactInfoCards, ContactMap | useContactForm |

---

## 6. Cómo respetar las 150 líneas

- **Tarjetas grandes** → partes `Media`, `Info`, `Actions`.
- **Listas** → extraer la fila (`SearchResultItem`) y su estado derivado a un hook.
- **Formularios** → `useXForm.ts` (lógica) + `XForm.tsx` (campos).
- **Contenido repetitivo** (footer, pilares, orden) → `config/*.config.ts` + `.map()`.
- **Mensajes de WhatsApp** → `features/<x>/lib/whatsapp.ts` sobre `shared/lib/whatsapp`.

---

## 7. Layout y responsive

**Contenedor.** Todo el ancho sale del token `--container-app` (`index.css`, 1600 px) → clase `max-w-app`,
usada por TopBar, Header, Navbar, `main` y Footer. Gutter común: `px-4 sm:px-6 lg:px-8 2xl:px-10`.
Para cambiar el ancho de la app se edita solo el token.

**Mobile-first denso.** El valor base es el de móvil (compacto) y `sm:` restaura el espaciado amplio;
tablet y desktop no dependen de los valores base. Pautas en móvil: separación entre secciones
`space-y-4…8`, tarjetas `p-3/p-4` con `rounded-2xl`, títulos de sección `text-xl`. El gutter lateral
(16 px) no se reduce; las zonas táctiles se mantienen ≥ 40 px salvo los iconos del header (ver abajo).

**Header.** Logo `h-11` (móvil y `sm`) → `md:h-14`, con `max-w-full` para encogerse sin deformarse en
pantallas muy estrechas (320 px). Iconos de tema, favoritos y carrito: 32 px en móvil → `sm:` 40 px (por
debajo de 44 px recomendados; no reducir más). Buscador desktop `max-w-3xl 2xl:max-w-4xl`; su desplegable
hereda el ancho (`left-0 right-0`) y en desktop llega a `max-h-[26rem]`. El botón ✕ de limpiar se ubica a la
izquierda de «Buscar» por variante (`clearClass`).

**Grillas de producto.** `ProductGrid` por defecto: `2 → md:3 → lg:4 → 2xl:5` columnas. Las vitrinas con
cantidad fija (portada: 4 ítems) fijan `lg:4` vía `gridClassName` para no dejar huecos. En móvil,
`ProductCard` oculta el chip de categoría y la descripción.

**Navegación.**

| Zona | Contenido |
|---|---|
| TopBar (≥ lg) | ubicación · WhatsApp · horario |
| Navbar (≥ lg) | izquierda: **Explorar** (panel: categorías + marcas, cada una con «Ver todas») · accesos rápidos a categorías (≥ xl, activo = subrayado) · **Ofertas** (píldora destacada: degradado ámbar en claro, sutil en oscuro) — derecha: **Nosotros · Contacto** (`INFO_LINKS` en `nav.config.ts`) |
| Menú móvil (< lg) | Ofertas → Categorías → Marcas → Información (Nosotros, Contacto, WhatsApp + horario) |

«Inicio» no figura en la navegación: el logo y el breadcrumb cumplen esa función. Los overlays se cierran al
cambiar de ruta, con click fuera y con `Esc` (`useNavbar`).

**Detalle de producto (`/product/:id`).**

| Ancho | Distribución |
|---|---|
| ≥ xl | tarjeta (galería con miniaturas verticales \| info) + BuyBox lateral, **ambas a igual altura** (`items-stretch`): la galería llena el alto y el bloque de garantías de BuyBox se ancla al fondo, así las bases quedan alineadas |
| lg | tarjeta (galería sobre info) + BuyBox `sticky` |
| < lg | apilado; las acciones de compra viven solo en `ProductMobileBar` (fija inferior) y BuyBox queda como ficha (stock, cantidad, vendedor, garantías) |

- Precio: se muestra **una sola vez por breakpoint** — ≥ lg en `ProductBuyBox` (monto · `-%` · «Antes» · ahorro en verde); < lg junto al título en `ProductInfo`. Compartir y favorito van en la fila del título.
- Galería: miniaturas, contador, visor a pantalla completa (`ProductLightbox`: flechas, miniaturas, `Esc`, bloqueo de
  scroll); al cerrar, el foco vuelve a la foto que lo abrió.
- Pestañas: `useProductTabs(id)` vuelve a «Descripción General» al cambiar de producto (el estado vive en `ui.store`).
- Compartir: copia la URL al portapapeles (con respaldo para contextos no seguros) y confirma con toast.
- `ProductMobileBar` activa `isMobileActionBarVisible` (`useMobileActionBar`): `MainLayout` reserva espacio
  inferior y oculta `FloatingWhatsApp` bajo `lg` (`useLayoutInsets`). No se monta si el producto está agotado.

**Elementos fijos.** Los overlays `fixed` montados dentro de una página (`ProductLightbox`, `ProductMobileBar`)
se renderizan con `createPortal` en `document.body`, porque la animación de entrada de `main`
(`.view-container`, `transform`) desplazaría su posición.

| Capa | z-index |
|---|---|
| Barra de compra móvil · WhatsApp flotante | `z-20` (bajo los fondos de overlay) |
| Fondos de menú móvil y buscador móvil | `z-30` |
| Header sticky | `z-40` |
| Menús, `ConfirmDialog`, toasts | `z-50` |
| Visor de fotos | `z-[70]` |

Con la barra móvil activa, `ToastContainer` (`aboveActionBar`) sube a `calc(6.5rem + safe-area)` bajo `lg`.
Las acciones destructivas (vaciar carrito / favoritos) siempre pasan por `ConfirmDialog` + toast.

---

## 8. Calidad y auditoría

**Antes de entregar:** `pnpm lint` · `pnpm build` (incluye `tsc -b`) · ningún `.tsx` > 150 líneas ni página > 100 ·
`SOURCE` de cada archivo = su ruta real.

**Auditoría 2026-11-09** (estática + prueba de humo en Chrome headless):

- Sin errores de TypeScript/ESLint; sin imports sin resolver; ningún feature importa a otro saltándose su
  `index.ts`; `shared/` no importa de `features/` ni `app/`; sin ids `data-ui-id` estáticos duplicados.
- 18 rutas (incluidas las de «no encontrado» y la redirección `*`) cargan sin errores de consola ni excepciones;
  sin scroll horizontal en móvil.
- Corregido: barra móvil por encima del fondo de los overlays (`z-30` → `z-20`) · pestaña de detalle arrastrada
  entre productos · foco perdido al cerrar el visor · toasts solapados con la barra móvil en dispositivos con
  safe-area.

**Pendientes conocidos (no bloqueantes):**

- `shared/ui/Badge` y `shared/ui/Button` no se usan todavía (primitivas del design system).
- Assets sin uso en `src/assets/` (`hero.png`, `react.svg`, `vite.svg`, `icono-bg*.png`, `logo-bgWhite.png`,
  `logo-fullBlue.png`); no entran al bundle porque no se importan.
- `ProductLightbox` devuelve el foco pero no lo atrapa dentro del diálogo (sin *focus trap*).
- Las imágenes de producto son de placehold.co (mocks): requieren conexión.

