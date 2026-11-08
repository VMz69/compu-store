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
│   ├── nav.config.ts            enlaces del footer
│   ├── hooks/                   header, navbar, overlay móvil, scroll
│   ├── lib/route.service.ts     normaliza la vista inicial
│   └── layout/                  MainLayout · header/ · navbar/ · footer/ · ToastContainer · FloatingWhatsApp
├── shared/                      sin lógica de negocio
│   ├── ui/                      Button, Badge, Select, Breadcrumbs, EmptyState, Logo, Toast…
│   ├── hooks/                   useTheme · useToasts · useClickOutside
│   ├── store/                   ui.store (overlays, tema) · toast.store
│   ├── lib/                     formatters · whatsapp (enlace genérico)
│   ├── config/store.config.ts   identidad comercial
│   └── types/                   modelo del catálogo (Product, Category, Brand, Review…)
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
| **catalog** | `grid/` ProductCard (+Media, Info, Actions), ProductGrid · `detail/` Gallery (+Thumbs, Lightbox), Info (+Actions), BuyBox, Tabs, RelatedList · `reviews/` ReviewCard, ReviewForm, RatingSummary · `browse/` CategoryCard, BrandCard · FilterBar | useFilters, useCatalogStats, useProductDetail, useProductGallery, useShareProduct, useFavorites · `filters` / `favorites` / `reviews.store` |
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
