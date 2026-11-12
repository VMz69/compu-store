# Reestructuración FLOA de store

Fecha: 2026-11-11 (America/El_Salvador). Rama: `refactor/floa-store`.
Base: `c518624`. Alcance: exclusivamente `store/src/` y este reporte.
Fuente arquitectónica leída completa: `/home/vmz/Descargas/Copia de arq.md`.

## Línea base

| Comprobación | Comando desde store/ | Resultado |
| --- | --- | --- |
| Instalación inicial sin conexión | `pnpm install --frozen-lockfile --ignore-scripts --offline` | Falló: faltaba `deep-is` en la caché; sin cambios al lockfile |
| Instalación | `pnpm install --frozen-lockfile --ignore-scripts` | OK, salida 0; versiones fijadas; se omiten scripts de instalación |
| Typecheck | `pnpm exec tsc -b --force` | OK, salida 0 |
| Lint | `pnpm lint` | OK, salida 0, sin advertencias |
| Build | `pnpm build` | OK, salida 0; 182 módulos; JS 438.60 kB; CSS 84.50 kB |
| Tests | No hay script test ni archivos test/spec | No aplicable; no se agregan dependencias |

La caché creada por el intento offline se trasladó a `/tmp`; no se conserva
ningún archivo de instalación en la raíz del monorepo.

## Decisiones conservadoras y límites de FLOA

- Se preservan los 160 módulos TypeScript/TSX originales, main.tsx, el CSS,
  los 10 assets y los 50 inventarios HTML. No se elimina código sin uso.
- Cada uno de los 37 pipelines contiene 3–5 fases y un director `00-`
  (4–6 archivos en total), sin subcarpetas. Los prefijos describen agrupación
  e integración de procesos; no cambian el orden de ejecución de React.
- Los directores nuevos solo reexportan módulos. Las cinco APIs públicas de
  features se mueven a directores raíz para conservar sus contratos y símbolos.
  `main.tsx` conserva su nombre y solo cambia imports.
- **Excepción de aislamiento:** el código existente comparte estado, UI, modelos
  y operaciones entre dominios. Se conservan esas dependencias, canalizando
  accesos externos a través de directores; no se importan fases internas de otro
  pipeline. Esto no equivale a aislamiento absoluto ni permite borrar un dominio
  sin afectar a sus consumidores. Introducir un bus EDA, inyección, redundancia,
  circuit breakers o fallbacks alteraría lógica y queda fuera de este trabajo.
- **Excepción de orquestación interna:** las fases que ya se llamaban directamente
  conservan sus imports dentro del pipeline. Reemplazarlos por el director crearía
  ciclos de barrels o exigiría cambiar la composición/JSX. No se añade esa capa.
- Los modelos compartidos y la trazabilidad permanecen en la raíz de src, como
  núcleo neutral; no se duplican ni se asignan a un dominio que produzca ciclos.
- Recursos estáticos y documentación histórica son colecciones de soporte,
  no pipelines; por eso no tienen director TS ni límite de 4–6 archivos.
- Se conservan literalmente `SOURCE`, `SOURCE_SELECT`, comentarios, JSX, clases,
  metadatos `data-ui-*`, textos y datos mock. Las rutas históricas en esos valores
  pueden consultarse en este mapa. La regla del blueprint DOMA anterior de
  actualizar SOURCE cede ante la prohibición explícita de modificar la UI.
  Los `00Tree.html` también conservan su contenido histórico sin regenerarse.
- No se modifica configuración Vite/TypeScript, public/, index.html, manifiesto,
  lockfile, dependencias, admin/ ni api/. Los documentos DOMA anteriores permanecen
  como referencia histórica; este mapa describe la topología nueva.

## Protocolo por paso

Antes de mover se registra este mapa. Cada fila de la tabla final corresponde
a un commit independiente. Cada paso usa `git mv`, ajusta solo specifiers de
import/export y añade, cuando corresponde, un director de reexportación.
Se ejecutan typecheck forzado y build antes de confirmar. Si fallan se restaura
inmediatamente el commit anterior con `git reset --hard`; se registra la causa.
Una auditoría adicional compara cada archivo con la base ignorando únicamente
sus rutas de import/export. Assets, CSS, HTML y mocks conservan su contenido.

## Mapa completo: ruta actual → ruta nueva

Todas las rutas siguientes son relativas a `store/src/`.
`main.tsx → main.tsx` (solo imports).

### 00-integracion-y-modelos

| Ruta actual | Ruta nueva |
| --- | --- |
| `App.tsx` | `00-director-aplicacion.tsx` |
| `app/router.tsx` | `01-rutas.tsx` |
| `app/lib/route.service.ts` | `02-vista-inicial.ts` |
| `index.css` | `00-estilos-globales.css` |
| `shared/types/index.ts` | `00-director-modelos.ts` |
| `shared/types/product.types.ts` | `03-modelos-producto.ts` |
| `ui-traceability/index.ts` | `04-trazabilidad-ui.ts` |
| `features/cart/index.ts` | `00-director-carrito.ts` |
| `features/catalog/index.ts` | `00-director-catalogo.ts` |
| `features/home/index.ts` | `00-director-inicio.ts` |
| `features/info/index.ts` | `00-director-informacion.ts` |
| `features/search/index.ts` | `00-director-busqueda.ts` |

### 01-pipeline-identidad-tienda

| Ruta actual | Ruta nueva |
| --- | --- |
| `shared/config/store.config.ts` | `01-pipeline-identidad-tienda/01-identidad.config.ts` |
| `shared/lib/formatters.ts` | `01-pipeline-identidad-tienda/02-formatos-comerciales.ts` |
| `shared/lib/whatsapp.ts` | `01-pipeline-identidad-tienda/03-enlaces-whatsapp.ts` |
| `shared/ui/Logo.tsx` | `01-pipeline-identidad-tienda/04-logo.tsx` |

Nuevo: `01-pipeline-identidad-tienda/00-director-identidad-tienda.ts` (solo reexportaciones).

### 02-pipeline-preferencias-interfaz

| Ruta actual | Ruta nueva |
| --- | --- |
| `shared/store/ui.store.ts` | `02-pipeline-preferencias-interfaz/01-preferencias.store.ts` |
| `shared/hooks/useTheme.ts` | `02-pipeline-preferencias-interfaz/02-tema.ts` |
| `shared/hooks/useClickOutside.ts` | `02-pipeline-preferencias-interfaz/03-clic-exterior.ts` |
| `app/hooks/useLayoutInsets.ts` | `02-pipeline-preferencias-interfaz/04-espacio-para-compra.ts` |
| `app/layout/FloatingWhatsApp.tsx` | `02-pipeline-preferencias-interfaz/05-asistente-whatsapp.tsx` |

Nuevo: `02-pipeline-preferencias-interfaz/00-director-preferencias-interfaz.ts` (solo reexportaciones).

### 03-pipeline-notificaciones

| Ruta actual | Ruta nueva |
| --- | --- |
| `shared/store/toast.store.ts` | `03-pipeline-notificaciones/01-notificaciones.store.ts` |
| `shared/hooks/useToasts.ts` | `03-pipeline-notificaciones/02-notificaciones.ts` |
| `shared/ui/Toast.tsx` | `03-pipeline-notificaciones/03-aviso.tsx` |
| `app/layout/ToastContainer.tsx` | `03-pipeline-notificaciones/04-contenedor-avisos.tsx` |

Nuevo: `03-pipeline-notificaciones/00-director-notificaciones.ts` (solo reexportaciones).

### 04-pipeline-presentacion-secciones

| Ruta actual | Ruta nueva |
| --- | --- |
| `shared/ui/Breadcrumbs.tsx` | `04-pipeline-presentacion-secciones/01-ruta-navegacion.tsx` |
| `shared/ui/PageBanner.tsx` | `04-pipeline-presentacion-secciones/02-banner-pagina.tsx` |
| `shared/ui/SectionHeading.tsx` | `04-pipeline-presentacion-secciones/03-titulo-seccion.tsx` |
| `shared/ui/EmptyState.tsx` | `04-pipeline-presentacion-secciones/04-estado-vacio.tsx` |

Nuevo: `04-pipeline-presentacion-secciones/00-director-presentacion-secciones.ts` (solo reexportaciones).

### 05-pipeline-controles-compra

| Ruta actual | Ruta nueva |
| --- | --- |
| `shared/ui/Badge.tsx` | `05-pipeline-controles-compra/01-etiqueta.tsx` |
| `shared/ui/Button.tsx` | `05-pipeline-controles-compra/02-boton.tsx` |
| `shared/ui/Select.tsx` | `05-pipeline-controles-compra/03-selector.tsx` |
| `shared/ui/QuantitySelector.tsx` | `05-pipeline-controles-compra/04-cantidad.tsx` |
| `shared/ui/ConfirmDialog.tsx` | `05-pipeline-controles-compra/05-confirmacion.tsx` |

Nuevo: `05-pipeline-controles-compra/00-director-controles-compra.ts` (solo reexportaciones).

### 06-pipeline-datos-mock

| Ruta actual | Ruta nueva |
| --- | --- |
| `features/catalog/mocks/categories.mock.ts` | `06-pipeline-datos-mock/01-categorias.mock.ts` |
| `features/catalog/mocks/brands.mock.ts` | `06-pipeline-datos-mock/02-marcas.mock.ts` |
| `features/catalog/mocks/products.mock.ts` | `06-pipeline-datos-mock/03-productos.mock.ts` |
| `features/catalog/mocks/reviews.mock.ts` | `06-pipeline-datos-mock/04-resenas.mock.ts` |
| `features/home/mocks/promotions.mock.ts` | `06-pipeline-datos-mock/05-promociones.mock.ts` |

Nuevo: `06-pipeline-datos-mock/00-director-datos-mock.ts` (solo reexportaciones).

### 07-pipeline-estado-carrito

| Ruta actual | Ruta nueva |
| --- | --- |
| `features/cart/types.ts` | `07-pipeline-estado-carrito/01-modelos-carrito.ts` |
| `features/cart/lib/cart.service.ts` | `07-pipeline-estado-carrito/02-calculos-carrito.ts` |
| `features/cart/store.ts` | `07-pipeline-estado-carrito/03-carrito.store.ts` |
| `features/cart/hooks/useCart.ts` | `07-pipeline-estado-carrito/04-acciones-carrito.ts` |

Nuevo: `07-pipeline-estado-carrito/00-director-estado-carrito.ts` (solo reexportaciones).

### 08-pipeline-vista-carrito

| Ruta actual | Ruta nueva |
| --- | --- |
| `features/cart/components/CartWidget.tsx` | `08-pipeline-vista-carrito/01-indicador-carrito.tsx` |
| `features/cart/components/CartItem.tsx` | `08-pipeline-vista-carrito/02-linea-carrito.tsx` |
| `features/cart/hooks/useCartView.ts` | `08-pipeline-vista-carrito/03-estado-vista-carrito.ts` |
| `features/cart/pages/CartView.tsx` | `08-pipeline-vista-carrito/04-vista-carrito.tsx` |

Nuevo: `08-pipeline-vista-carrito/00-director-vista-carrito.ts` (solo reexportaciones).

### 09-pipeline-checkout-whatsapp

| Ruta actual | Ruta nueva |
| --- | --- |
| `features/cart/lib/whatsapp.ts` | `09-pipeline-checkout-whatsapp/01-pedido-whatsapp.ts` |
| `features/cart/components/CheckoutForm.tsx` | `09-pipeline-checkout-whatsapp/02-formulario-pedido.tsx` |
| `features/cart/components/CartSummary.tsx` | `09-pipeline-checkout-whatsapp/03-resumen-pedido.tsx` |

Nuevo: `09-pipeline-checkout-whatsapp/00-director-checkout-whatsapp.ts` (solo reexportaciones).

### 10-pipeline-consulta-catalogo

| Ruta actual | Ruta nueva |
| --- | --- |
| `features/catalog/lib/catalog.service.ts` | `10-pipeline-consulta-catalogo/01-consultas-productos.ts` |
| `features/catalog/config/sort.config.ts` | `10-pipeline-consulta-catalogo/02-ordenacion.config.ts` |
| `features/catalog/filters.store.ts` | `10-pipeline-consulta-catalogo/03-filtros.store.ts` |
| `features/catalog/hooks/useFilters.ts` | `10-pipeline-consulta-catalogo/04-aplicar-filtros.ts` |
| `features/catalog/components/FilterBar.tsx` | `10-pipeline-consulta-catalogo/05-barra-filtros.tsx` |

Nuevo: `10-pipeline-consulta-catalogo/00-director-consulta-catalogo.ts` (solo reexportaciones).

### 11-pipeline-categorias

| Ruta actual | Ruta nueva |
| --- | --- |
| `features/catalog/hooks/useCatalogStats.ts` | `11-pipeline-categorias/01-estadisticas-catalogo.ts` |
| `features/catalog/hooks/useCatalogHub.ts` | `11-pipeline-categorias/02-estado-categorias.ts` |
| `features/catalog/components/browse/CategoryCard.tsx` | `11-pipeline-categorias/03-tarjeta-categoria.tsx` |
| `features/catalog/pages/CatalogHub.tsx` | `11-pipeline-categorias/04-vista-categorias.tsx` |

Nuevo: `11-pipeline-categorias/00-director-categorias.ts` (solo reexportaciones).

### 12-pipeline-marcas

| Ruta actual | Ruta nueva |
| --- | --- |
| `features/catalog/hooks/useBrandsPage.ts` | `12-pipeline-marcas/01-estado-marcas.ts` |
| `features/catalog/components/browse/BrandCard.tsx` | `12-pipeline-marcas/02-tarjeta-marca.tsx` |
| `features/catalog/pages/BrandsView.tsx` | `12-pipeline-marcas/03-vista-marcas.tsx` |

Nuevo: `12-pipeline-marcas/00-director-marcas.ts` (solo reexportaciones).

### 13-pipeline-seleccion-catalogo

| Ruta actual | Ruta nueva |
| --- | --- |
| `features/catalog/hooks/useCategoryView.ts` | `13-pipeline-seleccion-catalogo/01-seleccion-categoria.ts` |
| `features/catalog/hooks/useBrandView.ts` | `13-pipeline-seleccion-catalogo/02-seleccion-marca.ts` |
| `features/catalog/hooks/useOffersView.ts` | `13-pipeline-seleccion-catalogo/03-seleccion-ofertas.ts` |

Nuevo: `13-pipeline-seleccion-catalogo/00-director-seleccion-catalogo.ts` (solo reexportaciones).

### 14-pipeline-listados-catalogo

| Ruta actual | Ruta nueva |
| --- | --- |
| `features/catalog/pages/CategoryView.tsx` | `14-pipeline-listados-catalogo/01-productos-categoria.tsx` |
| `features/catalog/pages/BrandDetail.tsx` | `14-pipeline-listados-catalogo/02-productos-marca.tsx` |
| `features/catalog/pages/OffersView.tsx` | `14-pipeline-listados-catalogo/03-productos-oferta.tsx` |
| `features/catalog/hooks/useFavoritesView.ts` | `14-pipeline-listados-catalogo/04-estado-lista-favoritos.ts` |
| `features/catalog/pages/FavoritesView.tsx` | `14-pipeline-listados-catalogo/05-productos-favoritos.tsx` |

Nuevo: `14-pipeline-listados-catalogo/00-director-listados-catalogo.ts` (solo reexportaciones).

### 15-pipeline-preferencias-producto

| Ruta actual | Ruta nueva |
| --- | --- |
| `features/catalog/favorites.store.ts` | `15-pipeline-preferencias-producto/01-favoritos.store.ts` |
| `features/catalog/hooks/useFavorites.ts` | `15-pipeline-preferencias-producto/02-acciones-favoritos.ts` |
| `features/catalog/hooks/useShareProduct.ts` | `15-pipeline-preferencias-producto/03-compartir-producto.ts` |

Nuevo: `15-pipeline-preferencias-producto/00-director-preferencias-producto.ts` (solo reexportaciones).

### 16-pipeline-presentacion-producto

| Ruta actual | Ruta nueva |
| --- | --- |
| `features/catalog/components/grid/ProductCardMedia.tsx` | `16-pipeline-presentacion-producto/01-imagen-tarjeta.tsx` |
| `features/catalog/components/grid/ProductCardInfo.tsx` | `16-pipeline-presentacion-producto/02-informacion-tarjeta.tsx` |
| `features/catalog/components/grid/ProductCardActions.tsx` | `16-pipeline-presentacion-producto/03-acciones-tarjeta.tsx` |

Nuevo: `16-pipeline-presentacion-producto/00-director-presentacion-producto.ts` (solo reexportaciones).

### 17-pipeline-vitrina-productos

| Ruta actual | Ruta nueva |
| --- | --- |
| `features/catalog/hooks/useProductCard.ts` | `17-pipeline-vitrina-productos/01-estado-tarjeta.ts` |
| `features/catalog/components/grid/ProductCard.tsx` | `17-pipeline-vitrina-productos/02-tarjeta-producto.tsx` |
| `features/catalog/components/grid/ProductGrid.tsx` | `17-pipeline-vitrina-productos/03-grilla-productos.tsx` |
| `features/catalog/components/detail/RelatedList.tsx` | `17-pipeline-vitrina-productos/04-productos-relacionados.tsx` |

Nuevo: `17-pipeline-vitrina-productos/00-director-vitrina-productos.ts` (solo reexportaciones).

### 18-pipeline-galeria-producto

| Ruta actual | Ruta nueva |
| --- | --- |
| `features/catalog/hooks/useProductGallery.ts` | `18-pipeline-galeria-producto/01-estado-galeria.ts` |
| `features/catalog/components/detail/ProductGalleryThumbs.tsx` | `18-pipeline-galeria-producto/02-miniaturas.tsx` |
| `features/catalog/components/detail/ProductLightbox.tsx` | `18-pipeline-galeria-producto/03-visor-imagenes.tsx` |
| `features/catalog/components/detail/ProductGallery.tsx` | `18-pipeline-galeria-producto/04-galeria.tsx` |

Nuevo: `18-pipeline-galeria-producto/00-director-galeria-producto.ts` (solo reexportaciones).

### 19-pipeline-calificaciones

| Ruta actual | Ruta nueva |
| --- | --- |
| `features/catalog/hooks/useHelpfulReview.ts` | `19-pipeline-calificaciones/01-valorar-resena.ts` |
| `shared/ui/RatingStars.tsx` | `19-pipeline-calificaciones/02-estrellas.tsx` |
| `features/catalog/components/reviews/RatingSummary.tsx` | `19-pipeline-calificaciones/03-resumen-calificaciones.tsx` |
| `features/catalog/components/reviews/ReviewCard.tsx` | `19-pipeline-calificaciones/04-tarjeta-resena.tsx` |

Nuevo: `19-pipeline-calificaciones/00-director-calificaciones.ts` (solo reexportaciones).

### 20-pipeline-estado-resenas

| Ruta actual | Ruta nueva |
| --- | --- |
| `features/catalog/lib/reviews.api.ts` | `20-pipeline-estado-resenas/01-contrato-resenas.ts` |
| `features/catalog/reviews.store.ts` | `20-pipeline-estado-resenas/02-resenas.store.ts` |
| `features/catalog/hooks/useProductReviews.ts` | `20-pipeline-estado-resenas/03-resenas-producto.ts` |
| `features/catalog/hooks/useReviewForm.ts` | `20-pipeline-estado-resenas/04-estado-formulario-resena.ts` |

Nuevo: `20-pipeline-estado-resenas/00-director-estado-resenas.ts` (solo reexportaciones).

### 21-pipeline-publicacion-resenas

| Ruta actual | Ruta nueva |
| --- | --- |
| `features/catalog/components/reviews/ReviewPendingNotice.tsx` | `21-pipeline-publicacion-resenas/01-aviso-moderacion.tsx` |
| `features/catalog/components/reviews/ReviewForm.tsx` | `21-pipeline-publicacion-resenas/02-formulario-resena.tsx` |
| `features/catalog/components/reviews/ProductReviewsTab.tsx` | `21-pipeline-publicacion-resenas/03-panel-resenas.tsx` |

Nuevo: `21-pipeline-publicacion-resenas/00-director-publicacion-resenas.ts` (solo reexportaciones).

### 22-pipeline-informacion-producto

| Ruta actual | Ruta nueva |
| --- | --- |
| `features/catalog/hooks/useProductTabs.ts` | `22-pipeline-informacion-producto/01-estado-pestanas.ts` |
| `features/catalog/components/detail/ProductOverviewTab.tsx` | `22-pipeline-informacion-producto/02-descripcion-producto.tsx` |
| `features/catalog/components/detail/ProductSpecsTab.tsx` | `22-pipeline-informacion-producto/03-especificaciones-producto.tsx` |
| `features/catalog/components/detail/ProductTabs.tsx` | `22-pipeline-informacion-producto/04-pestanas-producto.tsx` |

Nuevo: `22-pipeline-informacion-producto/00-director-informacion-producto.ts` (solo reexportaciones).

### 23-pipeline-oferta-producto

| Ruta actual | Ruta nueva |
| --- | --- |
| `features/catalog/components/detail/ProductTrustChips.tsx` | `23-pipeline-oferta-producto/01-garantias-producto.tsx` |
| `features/catalog/components/detail/ProductInfoActions.tsx` | `23-pipeline-oferta-producto/02-acciones-informacion.tsx` |
| `features/catalog/components/detail/ProductInfo.tsx` | `23-pipeline-oferta-producto/03-informacion-comercial.tsx` |
| `features/catalog/components/detail/ProductBuyBox.tsx` | `23-pipeline-oferta-producto/04-ficha-compra.tsx` |

Nuevo: `23-pipeline-oferta-producto/00-director-oferta-producto.ts` (solo reexportaciones).

### 24-pipeline-compra-producto

| Ruta actual | Ruta nueva |
| --- | --- |
| `features/catalog/lib/reservations.api.ts` | `24-pipeline-compra-producto/01-disponibilidad-producto.ts` |
| `features/catalog/lib/whatsapp.ts` | `24-pipeline-compra-producto/02-consulta-whatsapp.ts` |
| `features/catalog/hooks/useMobileActionBar.ts` | `24-pipeline-compra-producto/03-estado-compra-movil.ts` |
| `features/catalog/components/detail/ProductMobileBar.tsx` | `24-pipeline-compra-producto/04-barra-compra-movil.tsx` |

Nuevo: `24-pipeline-compra-producto/00-director-compra-producto.ts` (solo reexportaciones).

### 25-pipeline-detalle-producto

| Ruta actual | Ruta nueva |
| --- | --- |
| `features/catalog/hooks/useProductDetail.ts` | `25-pipeline-detalle-producto/01-estado-detalle.ts` |
| `features/catalog/components/detail/ProductDetailHeader.tsx` | `25-pipeline-detalle-producto/02-cabecera-producto.tsx` |
| `features/catalog/pages/ProductDetail.tsx` | `25-pipeline-detalle-producto/03-vista-producto.tsx` |

Nuevo: `25-pipeline-detalle-producto/00-director-detalle-producto.ts` (solo reexportaciones).

### 26-pipeline-presentacion-portada

| Ruta actual | Ruta nueva |
| --- | --- |
| `features/home/config/trustPillars.config.ts` | `26-pipeline-presentacion-portada/01-pilares-confianza.config.ts` |
| `features/home/hooks/useHeroSlider.ts` | `26-pipeline-presentacion-portada/02-estado-promociones.ts` |
| `features/home/components/HeroSlider.tsx` | `26-pipeline-presentacion-portada/03-carrusel-promociones.tsx` |
| `features/home/components/TrustPillars.tsx` | `26-pipeline-presentacion-portada/04-pilares-confianza.tsx` |

Nuevo: `26-pipeline-presentacion-portada/00-director-presentacion-portada.ts` (solo reexportaciones).

### 27-pipeline-inicio

| Ruta actual | Ruta nueva |
| --- | --- |
| `features/home/hooks/useHomeData.ts` | `27-pipeline-inicio/01-datos-inicio.ts` |
| `features/home/components/CategoryTile.tsx` | `27-pipeline-inicio/02-acceso-categoria.tsx` |
| `features/home/components/BrandTile.tsx` | `27-pipeline-inicio/03-acceso-marca.tsx` |
| `features/home/pages/Home.tsx` | `27-pipeline-inicio/04-vista-inicio.tsx` |

Nuevo: `27-pipeline-inicio/00-director-inicio.ts` (solo reexportaciones).

### 28-pipeline-consulta-contacto

| Ruta actual | Ruta nueva |
| --- | --- |
| `features/info/config/contact.config.ts` | `28-pipeline-consulta-contacto/01-asuntos-contacto.config.ts` |
| `features/info/lib/whatsapp.ts` | `28-pipeline-consulta-contacto/02-contacto-whatsapp.ts` |
| `features/info/hooks/useContactForm.ts` | `28-pipeline-consulta-contacto/03-estado-contacto.ts` |
| `features/info/components/ContactForm.tsx` | `28-pipeline-consulta-contacto/04-formulario-contacto.tsx` |

Nuevo: `28-pipeline-consulta-contacto/00-director-consulta-contacto.ts` (solo reexportaciones).

### 29-pipeline-informacion-tienda

| Ruta actual | Ruta nueva |
| --- | --- |
| `features/info/components/ContactInfoCards.tsx` | `29-pipeline-informacion-tienda/01-canales-contacto.tsx` |
| `features/info/components/ContactMap.tsx` | `29-pipeline-informacion-tienda/02-mapa-tienda.tsx` |
| `features/info/pages/ContactView.tsx` | `29-pipeline-informacion-tienda/03-vista-contacto.tsx` |
| `features/info/pages/AboutView.tsx` | `29-pipeline-informacion-tienda/04-vista-nosotros.tsx` |

Nuevo: `29-pipeline-informacion-tienda/00-director-informacion-tienda.ts` (solo reexportaciones).

### 30-pipeline-sugerencias-busqueda

| Ruta actual | Ruta nueva |
| --- | --- |
| `features/search/hooks/useSearchResultItem.ts` | `30-pipeline-sugerencias-busqueda/01-acciones-resultado.ts` |
| `features/search/components/SearchResultItem.tsx` | `30-pipeline-sugerencias-busqueda/02-resultado-sugerido.tsx` |
| `features/search/components/SearchDropdown.tsx` | `30-pipeline-sugerencias-busqueda/03-lista-sugerencias.tsx` |

Nuevo: `30-pipeline-sugerencias-busqueda/00-director-sugerencias-busqueda.ts` (solo reexportaciones).

### 31-pipeline-captura-busqueda

| Ruta actual | Ruta nueva |
| --- | --- |
| `features/search/hooks/useSearchInput.ts` | `31-pipeline-captura-busqueda/01-estado-busqueda.ts` |
| `features/search/hooks/useSearchLock.ts` | `31-pipeline-captura-busqueda/02-bloqueo-scroll.ts` |
| `features/search/hooks/useSearchDropdown.ts` | `31-pipeline-captura-busqueda/03-estado-desplegable.ts` |
| `features/search/components/searchInput.styles.ts` | `31-pipeline-captura-busqueda/04-buscador.styles.ts` |
| `features/search/components/SearchInput.tsx` | `31-pipeline-captura-busqueda/05-buscador.tsx` |

Nuevo: `31-pipeline-captura-busqueda/00-director-captura-busqueda.ts` (solo reexportaciones).

### 32-pipeline-resultados-busqueda

| Ruta actual | Ruta nueva |
| --- | --- |
| `features/search/hooks/useSearchSuggestions.ts` | `32-pipeline-resultados-busqueda/01-seleccion-sugerencias.ts` |
| `features/search/hooks/useSearchView.ts` | `32-pipeline-resultados-busqueda/02-estado-resultados.ts` |
| `features/search/pages/SearchView.tsx` | `32-pipeline-resultados-busqueda/03-vista-resultados.tsx` |

Nuevo: `32-pipeline-resultados-busqueda/00-director-resultados-busqueda.ts` (solo reexportaciones).

### 33-pipeline-cabecera-tienda

| Ruta actual | Ruta nueva |
| --- | --- |
| `app/hooks/useHeaderState.ts` | `33-pipeline-cabecera-tienda/01-estado-cabecera.ts` |
| `app/hooks/useMobileSearchCollapse.ts` | `33-pipeline-cabecera-tienda/02-buscador-al-desplazar.ts` |
| `app/layout/header/ThemeToggle.tsx` | `33-pipeline-cabecera-tienda/03-selector-tema.tsx` |
| `app/layout/header/TopBar.tsx` | `33-pipeline-cabecera-tienda/04-barra-informacion.tsx` |
| `app/layout/header/Header.tsx` | `33-pipeline-cabecera-tienda/05-cabecera.tsx` |

Nuevo: `33-pipeline-cabecera-tienda/00-director-cabecera-tienda.ts` (solo reexportaciones).

### 34-pipeline-menu-movil

| Ruta actual | Ruta nueva |
| --- | --- |
| `app/layout/navbar/navbar.styles.ts` | `34-pipeline-menu-movil/01-navegacion.styles.ts` |
| `app/layout/navbar/MobileMenuCatalog.tsx` | `34-pipeline-menu-movil/02-catalogo-movil.tsx` |
| `app/layout/navbar/MobileMenuInfo.tsx` | `34-pipeline-menu-movil/03-informacion-movil.tsx` |
| `app/layout/navbar/MobileMenu.tsx` | `34-pipeline-menu-movil/04-menu-movil.tsx` |

Nuevo: `34-pipeline-menu-movil/00-director-menu-movil.ts` (solo reexportaciones).

### 35-pipeline-navegacion-tienda

| Ruta actual | Ruta nueva |
| --- | --- |
| `app/nav.config.ts` | `35-pipeline-navegacion-tienda/01-enlaces-navegacion.config.ts` |
| `app/hooks/useNavbar.ts` | `35-pipeline-navegacion-tienda/02-estado-navegacion.ts` |
| `app/layout/navbar/ExploreMenuPanel.tsx` | `35-pipeline-navegacion-tienda/03-panel-explorar.tsx` |
| `app/layout/navbar/ExploreMenu.tsx` | `35-pipeline-navegacion-tienda/04-menu-explorar.tsx` |
| `app/layout/navbar/Navbar.tsx` | `35-pipeline-navegacion-tienda/05-barra-navegacion.tsx` |

Nuevo: `35-pipeline-navegacion-tienda/00-director-navegacion-tienda.ts` (solo reexportaciones).

### 36-pipeline-pie-tienda

| Ruta actual | Ruta nueva |
| --- | --- |
| `app/layout/footer/FooterBrand.tsx` | `36-pipeline-pie-tienda/01-identidad-pie.tsx` |
| `app/layout/footer/FooterLinks.tsx` | `36-pipeline-pie-tienda/02-enlaces-pie.tsx` |
| `app/layout/footer/FooterSocial.tsx` | `36-pipeline-pie-tienda/03-redes-sociales.tsx` |
| `app/layout/footer/FooterStoreInfo.tsx` | `36-pipeline-pie-tienda/04-informacion-pie.tsx` |
| `app/layout/footer/Footer.tsx` | `36-pipeline-pie-tienda/05-pie-tienda.tsx` |

Nuevo: `36-pipeline-pie-tienda/00-director-pie-tienda.ts` (solo reexportaciones).

### 37-pipeline-layout-tienda

| Ruta actual | Ruta nueva |
| --- | --- |
| `app/hooks/useScrollToTop.ts` | `37-pipeline-layout-tienda/01-restaurar-desplazamiento.ts` |
| `app/hooks/useMobileMenuOverlay.ts` | `37-pipeline-layout-tienda/02-estado-overlay-movil.ts` |
| `app/layout/navbar/MobileMenuBackdrop.tsx` | `37-pipeline-layout-tienda/03-fondo-menu-movil.tsx` |
| `app/layout/MainLayout.tsx` | `37-pipeline-layout-tienda/04-layout-principal.tsx` |

Nuevo: `37-pipeline-layout-tienda/00-director-layout-tienda.ts` (solo reexportaciones).

### 00-recursos-estaticos

| Ruta actual | Ruta nueva |
| --- | --- |
| `assets/hero.png` | `00-recursos-estaticos/01-hero.png` |
| `assets/logo/icono-bgBlack.png` | `00-recursos-estaticos/02-icono-bgBlack.png` |
| `assets/logo/icono-bgWhite.png` | `00-recursos-estaticos/03-icono-bgWhite.png` |
| `assets/logo/icono.png` | `00-recursos-estaticos/04-icono.png` |
| `assets/logo/logo-bgBlack.png` | `00-recursos-estaticos/05-logo-bgBlack.png` |
| `assets/logo/logo-bgWhite.png` | `00-recursos-estaticos/06-logo-bgWhite.png` |
| `assets/logo/logo-fullBlue.png` | `00-recursos-estaticos/07-logo-fullBlue.png` |
| `assets/logo/logo-horizontal.png` | `00-recursos-estaticos/08-logo-horizontal.png` |
| `assets/react.svg` | `00-recursos-estaticos/09-react.svg` |
| `assets/vite.svg` | `00-recursos-estaticos/10-vite.svg` |

### 00-documentacion-historica

| Ruta actual | Ruta nueva |
| --- | --- |
| `app/00Tree.html` | `00-documentacion-historica/01-arbol-app.html` |
| `app/hooks/00Tree.html` | `00-documentacion-historica/02-arbol-app-hooks.html` |
| `app/layout/00Tree.html` | `00-documentacion-historica/03-arbol-app-layout.html` |
| `app/layout/footer/00Tree.html` | `00-documentacion-historica/04-arbol-app-layout-footer.html` |
| `app/layout/header/00Tree.html` | `00-documentacion-historica/05-arbol-app-layout-header.html` |
| `app/layout/navbar/00Tree.html` | `00-documentacion-historica/06-arbol-app-layout-navbar.html` |
| `app/lib/00Tree.html` | `00-documentacion-historica/07-arbol-app-lib.html` |
| `assets/00Tree.html` | `00-documentacion-historica/08-arbol-assets.html` |
| `assets/logo/00Tree.html` | `00-documentacion-historica/09-arbol-assets-logo.html` |
| `features/00Tree.html` | `00-documentacion-historica/10-arbol-features.html` |
| `features/cart/00Tree.html` | `00-documentacion-historica/11-arbol-features-cart.html` |
| `features/cart/components/00Tree.html` | `00-documentacion-historica/12-arbol-features-cart-components.html` |
| `features/cart/hooks/00Tree.html` | `00-documentacion-historica/13-arbol-features-cart-hooks.html` |
| `features/cart/lib/00Tree.html` | `00-documentacion-historica/14-arbol-features-cart-lib.html` |
| `features/cart/pages/00Tree.html` | `00-documentacion-historica/15-arbol-features-cart-pages.html` |
| `features/catalog/00Tree.html` | `00-documentacion-historica/16-arbol-features-catalog.html` |
| `features/catalog/components/00Tree.html` | `00-documentacion-historica/17-arbol-features-catalog-components.html` |
| `features/catalog/components/browse/00Tree.html` | `00-documentacion-historica/18-arbol-features-catalog-components-browse.html` |
| `features/catalog/components/detail/00Tree.html` | `00-documentacion-historica/19-arbol-features-catalog-components-detail.html` |
| `features/catalog/components/grid/00Tree.html` | `00-documentacion-historica/20-arbol-features-catalog-components-grid.html` |
| `features/catalog/components/reviews/00Tree.html` | `00-documentacion-historica/21-arbol-features-catalog-components-reviews.html` |
| `features/catalog/config/00Tree.html` | `00-documentacion-historica/22-arbol-features-catalog-config.html` |
| `features/catalog/hooks/00Tree.html` | `00-documentacion-historica/23-arbol-features-catalog-hooks.html` |
| `features/catalog/lib/00Tree.html` | `00-documentacion-historica/24-arbol-features-catalog-lib.html` |
| `features/catalog/mocks/00Tree.html` | `00-documentacion-historica/25-arbol-features-catalog-mocks.html` |
| `features/catalog/pages/00Tree.html` | `00-documentacion-historica/26-arbol-features-catalog-pages.html` |
| `features/home/00Tree.html` | `00-documentacion-historica/27-arbol-features-home.html` |
| `features/home/components/00Tree.html` | `00-documentacion-historica/28-arbol-features-home-components.html` |
| `features/home/config/00Tree.html` | `00-documentacion-historica/29-arbol-features-home-config.html` |
| `features/home/hooks/00Tree.html` | `00-documentacion-historica/30-arbol-features-home-hooks.html` |
| `features/home/mocks/00Tree.html` | `00-documentacion-historica/31-arbol-features-home-mocks.html` |
| `features/home/pages/00Tree.html` | `00-documentacion-historica/32-arbol-features-home-pages.html` |
| `features/info/00Tree.html` | `00-documentacion-historica/33-arbol-features-info.html` |
| `features/info/components/00Tree.html` | `00-documentacion-historica/34-arbol-features-info-components.html` |
| `features/info/config/00Tree.html` | `00-documentacion-historica/35-arbol-features-info-config.html` |
| `features/info/hooks/00Tree.html` | `00-documentacion-historica/36-arbol-features-info-hooks.html` |
| `features/info/lib/00Tree.html` | `00-documentacion-historica/37-arbol-features-info-lib.html` |
| `features/info/pages/00Tree.html` | `00-documentacion-historica/38-arbol-features-info-pages.html` |
| `features/search/00Tree.html` | `00-documentacion-historica/39-arbol-features-search.html` |
| `features/search/components/00Tree.html` | `00-documentacion-historica/40-arbol-features-search-components.html` |
| `features/search/hooks/00Tree.html` | `00-documentacion-historica/41-arbol-features-search-hooks.html` |
| `features/search/pages/00Tree.html` | `00-documentacion-historica/42-arbol-features-search-pages.html` |
| `shared/00Tree.html` | `00-documentacion-historica/43-arbol-shared.html` |
| `shared/config/00Tree.html` | `00-documentacion-historica/44-arbol-shared-config.html` |
| `shared/hooks/00Tree.html` | `00-documentacion-historica/45-arbol-shared-hooks.html` |
| `shared/lib/00Tree.html` | `00-documentacion-historica/46-arbol-shared-lib.html` |
| `shared/store/00Tree.html` | `00-documentacion-historica/47-arbol-shared-store.html` |
| `shared/types/00Tree.html` | `00-documentacion-historica/48-arbol-shared-types.html` |
| `shared/ui/00Tree.html` | `00-documentacion-historica/49-arbol-shared-ui.html` |
| `ui-traceability/00Tree.html` | `00-documentacion-historica/50-arbol-ui-traceability.html` |

## Resultados de ejecución

| Paso | Movimientos | Typecheck | Build | Auditoría de integridad |
| --- | ---: | --- | --- | --- |
| `00-integracion-y-modelos` | 12 | OK (0) | OK (0) | OK (0) |


Incidente del verificador temporal: el primer intento de identidad-tienda fue
revertido inmediatamente a `9645e98` porque el auditor trató EndOfFileToken
como si fuera una sentencia de código. TypeScript y build no habían fallado.
Se corrigió únicamente el auditor externo en /tmp para comprobar las sentencias
del director, sin cambiar el plan ni código de aplicación. Se reintenta el mismo
paso; sus movimientos siguen siendo independientes y conservan el grafo original.

| `01-pipeline-identidad-tienda` | 4 | OK (0) | OK (0) | OK (0) |
| `02-pipeline-preferencias-interfaz` | 5 | OK (0) | OK (0) | OK (0) |
| `03-pipeline-notificaciones` | 4 | OK (0) | OK (0) | OK (0) |
| `04-pipeline-presentacion-secciones` | 4 | OK (0) | OK (0) | OK (0) |
| `05-pipeline-controles-compra` | 5 | OK (0) | OK (0) | OK (0) |
| `06-pipeline-datos-mock` | 5 | OK (0) | OK (0) | OK (0) |
| `07-pipeline-estado-carrito` | 4 | OK (0) | OK (0) | OK (0) |
| `08-pipeline-vista-carrito` | 4 | OK (0) | OK (0) | OK (0) |
| `09-pipeline-checkout-whatsapp` | 3 | OK (0) | OK (0) | OK (0) |
| `10-pipeline-consulta-catalogo` | 5 | OK (0) | OK (0) | OK (0) |
| `11-pipeline-categorias` | 4 | OK (0) | OK (0) | OK (0) |
| `12-pipeline-marcas` | 3 | OK (0) | OK (0) | OK (0) |
| `13-pipeline-seleccion-catalogo` | 3 | OK (0) | OK (0) | OK (0) |
| `14-pipeline-listados-catalogo` | 5 | OK (0) | OK (0) | OK (0) |
| `15-pipeline-preferencias-producto` | 3 | OK (0) | OK (0) | OK (0) |
| `16-pipeline-presentacion-producto` | 3 | OK (0) | OK (0) | OK (0) |
| `17-pipeline-vitrina-productos` | 4 | OK (0) | OK (0) | OK (0) |
| `18-pipeline-galeria-producto` | 4 | OK (0) | OK (0) | OK (0) |


Interrupción externa: el entorno terminó el proceso con SIGTERM durante
`19-pipeline-calificaciones` antes de completar el build. Se restauró inmediatamente
`0eb2f4c` con git reset --hard, sin conservar el paso incompleto.
Se reanuda por lotes más cortos, con los mismos movimientos y validaciones.

| `19-pipeline-calificaciones` | 4 | OK (0) | OK (0) | OK (0) |
| `20-pipeline-estado-resenas` | 4 | OK (0) | OK (0) | OK (0) |
| `21-pipeline-publicacion-resenas` | 3 | OK (0) | OK (0) | OK (0) |
| `22-pipeline-informacion-producto` | 4 | OK (0) | OK (0) | OK (0) |
| `23-pipeline-oferta-producto` | 4 | OK (0) | OK (0) | OK (0) |
| `24-pipeline-compra-producto` | 4 | OK (0) | OK (0) | OK (0) |
| `25-pipeline-detalle-producto` | 3 | OK (0) | OK (0) | OK (0) |
| `26-pipeline-presentacion-portada` | 4 | OK (0) | OK (0) | OK (0) |
| `27-pipeline-inicio` | 4 | OK (0) | OK (0) | OK (0) |
| `28-pipeline-consulta-contacto` | 4 | OK (0) | OK (0) | OK (0) |
| `29-pipeline-informacion-tienda` | 4 | OK (0) | OK (0) | OK (0) |
| `30-pipeline-sugerencias-busqueda` | 3 | OK (0) | OK (0) | OK (0) |
| `31-pipeline-captura-busqueda` | 5 | OK (0) | OK (0) | OK (0) |
| `32-pipeline-resultados-busqueda` | 3 | OK (0) | OK (0) | OK (0) |
| `33-pipeline-cabecera-tienda` | 5 | OK (0) | OK (0) | OK (0) |
| `34-pipeline-menu-movil` | 4 | OK (0) | OK (0) | OK (0) |
