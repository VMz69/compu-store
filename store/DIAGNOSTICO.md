# Diagnóstico del proyecto CompuStore SV (Front-Office)

> Documento generado tras la auditoría final de diseño, arquitectura y accesibilidad.
> Versión del front-office: `0.0.0` (pre-producción). Stack: React 19 + TypeScript 6 + Tailwind 4 + Vite 8 + Zustand 5.

---

## 1. Resumen ejecutivo

El front-office es una SPA de comercio electrónico orientada a catálogo de
tecnología. Cumple las reglas de arquitectura DOMA (Domain-Oriented
Micro-Architecture): **ningún `.tsx` supera las 150 líneas** y **ninguna página
supera las 100 líneas**; la lógica vive en hooks, stores y servicios puros. La
trazabilidad UI (`data-ui-*`) está aplicada de forma consistente a contenedores
principales e interactivos.

La auditoría final no encontró errores de consola ni overflow horizontal en 8
viewports × 12 rutas (320 → 1440 px). Los hallazgos se corrigieron en la misma
iteración: header móvil, tooltip de favoritos, toasts, accesibilidad y
centralización del tema.

---

## 2. Stack y topología

| Capa | Tecnología | Carpeta |
|---|---|---|
| UI / render | React 19, Tailwind 4 | `src/components`, `src/pages` |
| Routing | React Router 7 (HashRouter) | `src/App.tsx` |
| Estado global | Zustand 5 (con `persist`) | `src/store` |
| Lógica de vista | Custom Hooks | `src/hooks` |
| Lógica pura | Servicios sin React | `src/services` |
| Datos estáticos | Módulos tipados | `src/data` (barrel `@/data`) |
| Tipos | TypeScript strict-ish | `src/types` |
| Trazabilidad | `uiMeta` | `src/ui-traceability` |

**Conteo actual:** 12 páginas, 60 componentes, 30 hooks, 5 servicios, 6 stores,
74 archivos `.tsx`, 53 `.ts`. Bundle minificado: ~403 KB JS / 65 KB CSS (gzip:
117 KB / 11 KB). Salida total `dist`: ~680 KB.

---

## 3. Cumplimiento de reglas DOMA

| Regla | Estado | Evidencia |
|---|---|---|
| `.tsx` sin estado/lógica | ✅ | Solo `CartItem` tenía `lineTotal` inline → movido a `cart.service.getLineTotal`. |
| Archivos ≤ 150 líneas | ✅ | Máximo actual: `ReviewForm.tsx` (148), `MobileMenu.tsx` (141), `Navbar.tsx` (132). |
| Páginas ≤ 100 líneas | ✅ | Máxima: `ProductDetail.tsx` (89). |
| `uiMeta` en interactivos/contenedores | ✅ | 74 archivos con `uiMeta`; kill switch `VITE_UI_TRACEABILITY`. |
| Default en `#/` | ✅ | `normalizeInitialView` limpia `?view=expediente`; `index → Home`. |
| Favoritos solo corazón en header | ✅ | `Header.tsx` muestra corazón + badge + tooltip. |
| Sin overflow iPad/Surface | ✅ | Auditoría 8 viewports × 12 rutas sin hallazgos. |
| Menú móvil 3 secciones | ✅ | Categorías, Información, Ofertas. Sin Inicio/Ver Categorías/Ver Marcas/Toggle. |
| Bloqueo de scroll + fondo oscuro | ✅ | `useMobileMenuOverlay` + `MobileMenuBackdrop` (z-30). |
| Categorías escalables | ✅ | Grid 2 cols móvil / 3 desde `sm`. |
| `Agregar al Carrito` móvil | ✅ | `sm:flex-1` + `shrink-0`, 48 px de alto. |
| Búsqueda se retrae al bajar | ✅ | `useMobileSearchCollapse` (wheel/touch). |
| Tema por sistema + manual | ✅ | `useUIStore` + `useTheme` con `matchMedia` en vivo. |

---

## 4. Hallazgos de la auditoría y correcciones aplicadas

### 4.1 Overflow horizontal a 320 px (corregido)
- **Causa:** la fila de acciones del header ocupaba 196 px y el logo 121 px sobre un
  contenedor de 273 px.
- **Acción:** acciones responsivas (`gap-1` → `sm:gap-4`, controles 36 → 40 px
  desde 400 px), logo con `min-w-0 flex-1` para que se encoja en pantallas muy
  pequeñas, y `overflow-x: clip` en `html`/`body` como red de seguridad.
- **Verificado:** 0 offenders en 320–1440 px.

### 4.2 Header sticky vs `overflow-x: clip`
- `overflow: hidden` rompe `position: sticky`; se usó `overflow-x: clip` (no establece
  contenedor de scroll). Verificado: `position: sticky`, `top: 0` al hacer scroll.

### 4.3 Accesibilidad (mejoras)
- `aria-label`/`aria-pressed` en `ThemeToggle` (ambas variantes).
- `aria-label` en `CartWidget`, favoritos, `ProductGallery` favorito, `ProductCardActions`
  agregar, y botones `+`/`−`/eliminar de `CartItem`.
- `aria-current="page"` en links de `Navbar` y `MobileMenu`.
- `role="region"` + `aria-label` en el menú móvil; `aria-live`/`role="status"` en el
  contenedor de toasts.
- `aria-hidden` + `tabindex="-1"` en los controles del buscador colapsado.
- Respeto a `prefers-reduced-motion` para animaciones y autoplay del hero.

### 4.4 Carrusel del hero (accesibilidad)
- Autoplay pausado en hover/foco y desactivado con `prefers-reduced-motion: reduce`.

### 4.6 Menú móvil: scroll y posición (corregido)
- **Scroll en el blur:** el scroll táctil del documento se bloquea con `position: fixed`
  en el body (única forma fiable en iOS), manteniendo el header visible y el menú
  anclado. Verificado: al arrastrar sobre el fondo oscuro el scroll no se mueve.
- **Menú visible al hacer scroll:** el bloqueo congela la página en su posición
  actual sin desplazarla, de modo que el menú se despliega donde se encuentra el
  scroll y no es necesario restaurar la posición al cerrar. Verificado: con scroll
  previo de 600 px, el header queda en `top: 0` y el menú aparece a `114 px`;
  el scroll se mantiene en 600 px durante la apertura y el cierre.

### 4.7 Navegación con scroll instantáneo al inicio (corregido)
- Al cambiar de ruta la vista se lleva al inicio sin animación (`behavior: 'instant'`),
  de modo que la nueva página se muestra desde arriba de inmediato. El menú móvil
  congela la página en su posición y la restaura al cerrar sin animación.

### 4.8 Búsqueda global con desplegable (añadido)
- Nuevo `SearchDropdown` + `useSearchSuggestions`: al escribir se muestra una lista
  flotante bajo el input con imagen, marca, título, precio, badge de oferta y
  botón de añadir al carrito. Clic en la fila navega al detalle; el botón de
  carrito actúa de forma independiente. El texto ya no filtra el área principal.
- Documentado y trazado con `uiMeta`.

### 4.9 Búsqueda móvil con overlay (añadido)
- El desplegable de búsqueda también funciona en móvil, con backdrop oscuro/blur,
  bloqueo de scroll y soporte claro/oscuro. El input suaviza el anillo de foco
  (`ring-brand/30`) para una apariencia más limpia.

---

## 5. Problemas arquitectónicos detectados

1. **Acoplamiento a datos estáticos.** `useFilters`, `useHomeData`, `useProductDetail`,
   `useCatalogStats`, `useFavoritesView` importan `products` directamente. Se
   centralizó el acceso en el barrel `@/data` para que la migración a API toque un
   solo punto, pero el acoplamiento sigue existiendo (ver sección 7).

2. **Fuente de verdad del tema en UI.** `useTheme` se invocaba desde `Header` vía
   `useHeaderState`. Se movió al shell (`MainLayout`) para que el tema no dependa
   de que el header esté montado y no se dupliquen listeners.

3. **Reseñas de fallback.** `useProductReviews` usa `DEFAULT_REVIEWS` para cualquier
   producto sin reseñas guardadas, por lo que todos los productos comparten las
   mismas opiniones. Aceptable para el mock, pero debe cambiarse a `[]` al integrar
   backend.

4. **Auto-avance del carrusel.** Ahora se pausa en interacción y respeta movimiento
   reducido.

5. **`useToastStore` sin cleanup.** El `setTimeout` de auto-dismiss no se cancela al
   desmontar; con StrictMode no causa efectos visibles, pero es una fuga menor.

6. **`getLineTotal` duplicaba cálculo.** Se centralizó en `cart.service`.

---

## 6. Convenciones y buenas prácticas aplicadas

- **DOMA:** componentes = presentación; hooks = lógica de vista; services = funciones
  puras; stores = estado global.
- **Fuentes únicas:** `@/data` para catálogo/configuración, `@/services` para cálculos.
- **IDs de trazabilidad dinámicos** en listas (`.map`).
- **Persistencia versionada:** claves `compustore_sv_cart_v4`, `compustore_sv_favorites_v2`,
  `compustore_sv_theme`.
- **Accesibilidad móvil:** áreas táctiles ≥ 36–40 px, `aria-label` en iconos.
- **Responsive:** breakpoints Tailwind (`sm`, `md`, `lg`, `xl`) + `min-[400px]`.
- **Animaciones:** `prefers-reduced-motion`.

---

## 7. Potencial de escalabilidad

### 7.1 Listo para escalar (sin cambios grandes)
- **Servicios puros y testeables:** `catalog.service`, `cart.service`, `whatsapp.service`,
  `formatters` no dependen de React; pueden cubrirse con unit tests directamente.
- **Stores desacoplados:** Zustand permite añadir slices (inventario, auth, pedidos)
  sin reestructurar.
- **Barrel `@/data`:** único punto de entrada de datos; sustituir por un repositorio
  asíncrono es localizado.
- **Traceability kill switch:** permite desactivar metadatos en producción sin tocar
  componentes.
- **Tipado:** `Product`, `CartItem`, `DeliveryMethod`, etc. centralizados en `types`.

### 7.2 Trabajo necesario para producción
| Área | Acción | Esfuerzo |
|---|---|---|
| API / datos | Reemplazar `@/data` por llamadas async (React Query o SWR) con caché. | Medio |
| Auth / usuarios | Añadir store de sesión y rutas protegidas (favoritos, historial). | Medio |
| Backend de pedidos | Sustituir URL de WhatsApp por orden persistida + webhook. | Alto |
| SSR / SEO | Migrar Vite SPA a Next.js/Remix o prerender estático para SEO de productos. | Alto |
| Imágenes | Sustituir `placehold.co` por CDN real + `srcset`/lazy-loading. | Bajo |
| Tests | Agregar Vitest + Testing Library para services/hooks; Playwright para E2E. | Medio |
| i18n | Extraer strings a diccionarios (actualmente español hardcodeado). | Medio |
| Accesibilidad | Auditoría WCAG 2.2 completa (foco, contraste, screen reader). | Medio |
| Observabilidad | Error boundary global, Sentry, Web Vitals. | Bajo |
| Performance | Code splitting por ruta (`React.lazy`), virtualización de grids grandes. | Medio |

### 7.3 Riesgos a vigilar
- **HashRouter** no es ideal para SEO; migrar a BrowserRouter con fallback del servidor
  en producción.
- **Sin error boundary:** un error en un componente tira toda la SPA.
- **Sin rate limiting / validación server-side:** el checkout por WhatsApp asume
  disponibilidad; el stock real debe validarse en backend.
- **Reseñas mock compartidas** (ver 5.3).

---

## 8. Próximos pasos recomendados (priorizados)

1. Añadir `ErrorBoundary` global y página 404 amigable.
2. Integrar tests unitarios para `services/*` (Vitest).
3. Migrar datos a una API real detrás de `@/data` (o un repositorio).
4. Reemplazar `placehold.co` por assets reales y optimizar imágenes.
5. Activar `React.lazy` para rutas y medir bundle.
6. Auditoría WCAG 2.2 y soporte de teclado completo en menús dropdown.
7. Documentar convenciones de PR/commit (ya existe `agent-rules.md`).

---

## 9. Verificación final

- `pnpm build` ✅ (sin errores de TypeScript).
- `pnpm lint` ✅ (ESLint sin warnings).
- Auditoría responsive: 8 viewports × 12 rutas, 0 overflow horizontal.
- Flujo móvil: búsqueda se retrae/expande, menú de 3 secciones, bloqueo de scroll,
  backdrop oscuro.
- Tema: sigue al sistema por defecto y persiste override manual.
- TopBar: pill renombrada a **UBICACIÓN**; footer centrado.

---

_Documento mantenido por el equipo de front-office. Actualizar tras cada release._
