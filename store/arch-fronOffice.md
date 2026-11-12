# Especificación general · Front Office `/store` — CompuStore SV

> **Objetivo:** vitrina pública de tecnología con catálogo, carrito, favoritos,
> reseñas, búsqueda y contacto; checkout por WhatsApp.
> **Stack:** React 19 · TypeScript 6 · Vite 8 · Tailwind CSS 4 · React Router 7
> (HashRouter) · Zustand 5.
> **Arquitectura vigente:** FLOA conservadora. Actualización: 2026-11-12.

Esta especificación describe el frontend store. El [back office](../admin/arch-backOffice.md)
tiene su propia especificación y queda fuera del alcance de esta revisión.
El [mapa de refactorización](REFACTOR_MAP.md) conserva las equivalencias de rutas,
los commits y las decisiones de la migración desde DOMA.

## 0. Contrato del frontend

- Se mantienen las pantallas, navegación, estilos, contratos de componentes,
  nombres de símbolos y datos dummy existentes.
- Vite conserva su estructura estándar fuera de src: index.html, public/,
  package.json, pnpm-lock.yaml, tsconfig y vite.config no se reorganizan.
- `@/*` resuelve `src/*` tanto en TypeScript como en Vite.
- La persistencia mantiene `compustore_sv_cart_v4`,
  `compustore_sv_favorites_v2` y `compustore_sv_theme`.
- No se introduce un bus de eventos, una capa de API nueva, circuit breakers
  ni fallbacks nuevos durante esta migración. Los mocks siguen siendo la fuente
  de datos existente; los contratos de disponibilidad y reseñas se conservan.

## 1. Reglas FLOA y límites de la adaptación

1. Los procesos de negocio viven en carpetas `01-pipeline-*` a `37-pipeline-*`,
   sin subcarpetas. Cada pipeline tiene 4–6 archivos contando el director.
2. El director `00-director-<nombre>.ts` es la interfaz pública del pipeline.
   Los directores añadidos solo reexportan las fases existentes.
3. Carpetas y fases tienen prefijos numéricos. Los prefijos hacen navegable el
   proceso en el IDE; el flujo efectivo de React y sus efectos se conserva.
4. Un consumidor externo importa el director del pipeline, nunca una fase interna.
   Las fases de un mismo pipeline conservan sus imports relativos existentes.
5. Los cinco directores raíz de negocio conservan las APIs públicas anteriores
   de catálogo, carrito, búsqueda, inicio e información. Los modelos y la
   trazabilidad son núcleo transversal, sin dependencia de un dominio concreto.
6. La adaptación conserva dependencias entre dominios compartidos, a través de
   directores, y las llamadas internas previas. Por tanto no implementa aislamiento
   absoluto: eliminar un pipeline puede afectar a sus consumidores. Resolver ese
   acoplamiento exigiría otra tarea con cambios de composición o lógica.
7. Si un pipeline necesita superar seis archivos, se propone un proceso paralelo;
   no se profundiza el árbol ni se mezcla esa decisión con cambios funcionales.
8. Los recursos estáticos y los inventarios históricos son colecciones de soporte,
   no pipelines; no necesitan director TypeScript ni el límite de seis archivos.

La topología DOMA `app/features/shared` y los imports `features/*/index.ts`
pertenecen a la estructura anterior. Se conserva la separación de presentación,
hooks, estado y cálculos, sin recrear esas carpetas dentro de los pipelines.

## 2. Topología completa y arranque

Árbol completo de los 276 archivos versionados de `store/`, verificado
el 2026-11-12. Incluye los 258 archivos de `src/`, los 37 pipelines con
sus directores y fases, los recursos, los inventarios históricos, la
configuración de Vite, los archivos públicos y las pruebas.

```txt
store/
├── .gitignore
├── DIAGNOSTICO.md
├── README.md
├── REFACTOR_MAP.md
├── agent-rules.md
├── arch-fronOffice.md
├── eslint.config.js
├── index.html
├── package.json
├── pnpm-lock.yaml
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
├── public/
│   ├── favicon.png
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── 00-director-aplicacion.tsx
│   ├── 00-director-busqueda.ts
│   ├── 00-director-carrito.ts
│   ├── 00-director-catalogo.ts
│   ├── 00-director-informacion.ts
│   ├── 00-director-inicio.ts
│   ├── 00-director-modelos.ts
│   ├── 00-estilos-globales.css
│   ├── 01-rutas.tsx
│   ├── 02-vista-inicial.ts
│   ├── 03-modelos-producto.ts
│   ├── 04-trazabilidad-ui.ts
│   ├── main.tsx
│   ├── 00-documentacion-historica/
│   │   ├── 01-arbol-app.html
│   │   ├── 02-arbol-app-hooks.html
│   │   ├── 03-arbol-app-layout.html
│   │   ├── 04-arbol-app-layout-footer.html
│   │   ├── 05-arbol-app-layout-header.html
│   │   ├── 06-arbol-app-layout-navbar.html
│   │   ├── 07-arbol-app-lib.html
│   │   ├── 08-arbol-assets.html
│   │   ├── 09-arbol-assets-logo.html
│   │   ├── 10-arbol-features.html
│   │   ├── 11-arbol-features-cart.html
│   │   ├── 12-arbol-features-cart-components.html
│   │   ├── 13-arbol-features-cart-hooks.html
│   │   ├── 14-arbol-features-cart-lib.html
│   │   ├── 15-arbol-features-cart-pages.html
│   │   ├── 16-arbol-features-catalog.html
│   │   ├── 17-arbol-features-catalog-components.html
│   │   ├── 18-arbol-features-catalog-components-browse.html
│   │   ├── 19-arbol-features-catalog-components-detail.html
│   │   ├── 20-arbol-features-catalog-components-grid.html
│   │   ├── 21-arbol-features-catalog-components-reviews.html
│   │   ├── 22-arbol-features-catalog-config.html
│   │   ├── 23-arbol-features-catalog-hooks.html
│   │   ├── 24-arbol-features-catalog-lib.html
│   │   ├── 25-arbol-features-catalog-mocks.html
│   │   ├── 26-arbol-features-catalog-pages.html
│   │   ├── 27-arbol-features-home.html
│   │   ├── 28-arbol-features-home-components.html
│   │   ├── 29-arbol-features-home-config.html
│   │   ├── 30-arbol-features-home-hooks.html
│   │   ├── 31-arbol-features-home-mocks.html
│   │   ├── 32-arbol-features-home-pages.html
│   │   ├── 33-arbol-features-info.html
│   │   ├── 34-arbol-features-info-components.html
│   │   ├── 35-arbol-features-info-config.html
│   │   ├── 36-arbol-features-info-hooks.html
│   │   ├── 37-arbol-features-info-lib.html
│   │   ├── 38-arbol-features-info-pages.html
│   │   ├── 39-arbol-features-search.html
│   │   ├── 40-arbol-features-search-components.html
│   │   ├── 41-arbol-features-search-hooks.html
│   │   ├── 42-arbol-features-search-pages.html
│   │   ├── 43-arbol-shared.html
│   │   ├── 44-arbol-shared-config.html
│   │   ├── 45-arbol-shared-hooks.html
│   │   ├── 46-arbol-shared-lib.html
│   │   ├── 47-arbol-shared-store.html
│   │   ├── 48-arbol-shared-types.html
│   │   ├── 49-arbol-shared-ui.html
│   │   └── 50-arbol-ui-traceability.html
│   ├── 00-recursos-estaticos/
│   │   ├── 01-hero.png
│   │   ├── 02-icono-bgBlack.png
│   │   ├── 03-icono-bgWhite.png
│   │   ├── 04-icono.png
│   │   ├── 05-logo-bgBlack.png
│   │   ├── 06-logo-bgWhite.png
│   │   ├── 07-logo-fullBlue.png
│   │   ├── 08-logo-horizontal.png
│   │   ├── 09-react.svg
│   │   └── 10-vite.svg
│   ├── 01-pipeline-identidad-tienda/
│   │   ├── 00-director-identidad-tienda.ts
│   │   ├── 01-identidad.config.ts
│   │   ├── 02-formatos-comerciales.ts
│   │   ├── 03-enlaces-whatsapp.ts
│   │   └── 04-logo.tsx
│   ├── 02-pipeline-preferencias-interfaz/
│   │   ├── 00-director-preferencias-interfaz.ts
│   │   ├── 01-preferencias.store.ts
│   │   ├── 02-tema.ts
│   │   ├── 03-clic-exterior.ts
│   │   ├── 04-espacio-para-compra.ts
│   │   └── 05-asistente-whatsapp.tsx
│   ├── 03-pipeline-notificaciones/
│   │   ├── 00-director-notificaciones.ts
│   │   ├── 01-notificaciones.store.ts
│   │   ├── 02-notificaciones.ts
│   │   ├── 03-aviso.tsx
│   │   └── 04-contenedor-avisos.tsx
│   ├── 04-pipeline-presentacion-secciones/
│   │   ├── 00-director-presentacion-secciones.ts
│   │   ├── 01-ruta-navegacion.tsx
│   │   ├── 02-banner-pagina.tsx
│   │   ├── 03-titulo-seccion.tsx
│   │   └── 04-estado-vacio.tsx
│   ├── 05-pipeline-controles-compra/
│   │   ├── 00-director-controles-compra.ts
│   │   ├── 01-etiqueta.tsx
│   │   ├── 02-boton.tsx
│   │   ├── 03-selector.tsx
│   │   ├── 04-cantidad.tsx
│   │   └── 05-confirmacion.tsx
│   ├── 06-pipeline-datos-mock/
│   │   ├── 00-director-datos-mock.ts
│   │   ├── 01-categorias.mock.ts
│   │   ├── 02-marcas.mock.ts
│   │   ├── 03-productos.mock.ts
│   │   ├── 04-resenas.mock.ts
│   │   └── 05-promociones.mock.ts
│   ├── 07-pipeline-estado-carrito/
│   │   ├── 00-director-estado-carrito.ts
│   │   ├── 01-modelos-carrito.ts
│   │   ├── 02-calculos-carrito.ts
│   │   ├── 03-carrito.store.ts
│   │   └── 04-acciones-carrito.ts
│   ├── 08-pipeline-vista-carrito/
│   │   ├── 00-director-vista-carrito.ts
│   │   ├── 01-indicador-carrito.tsx
│   │   ├── 02-linea-carrito.tsx
│   │   ├── 03-estado-vista-carrito.ts
│   │   └── 04-vista-carrito.tsx
│   ├── 09-pipeline-checkout-whatsapp/
│   │   ├── 00-director-checkout-whatsapp.ts
│   │   ├── 01-pedido-whatsapp.ts
│   │   ├── 02-formulario-pedido.tsx
│   │   └── 03-resumen-pedido.tsx
│   ├── 10-pipeline-consulta-catalogo/
│   │   ├── 00-director-consulta-catalogo.ts
│   │   ├── 01-consultas-productos.ts
│   │   ├── 02-ordenacion.config.ts
│   │   ├── 03-filtros.store.ts
│   │   ├── 04-aplicar-filtros.ts
│   │   └── 05-barra-filtros.tsx
│   ├── 11-pipeline-categorias/
│   │   ├── 00-director-categorias.ts
│   │   ├── 01-estadisticas-catalogo.ts
│   │   ├── 02-estado-categorias.ts
│   │   ├── 03-tarjeta-categoria.tsx
│   │   └── 04-vista-categorias.tsx
│   ├── 12-pipeline-marcas/
│   │   ├── 00-director-marcas.ts
│   │   ├── 01-estado-marcas.ts
│   │   ├── 02-tarjeta-marca.tsx
│   │   └── 03-vista-marcas.tsx
│   ├── 13-pipeline-seleccion-catalogo/
│   │   ├── 00-director-seleccion-catalogo.ts
│   │   ├── 01-seleccion-categoria.ts
│   │   ├── 02-seleccion-marca.ts
│   │   └── 03-seleccion-ofertas.ts
│   ├── 14-pipeline-listados-catalogo/
│   │   ├── 00-director-listados-catalogo.ts
│   │   ├── 01-productos-categoria.tsx
│   │   ├── 02-productos-marca.tsx
│   │   ├── 03-productos-oferta.tsx
│   │   ├── 04-estado-lista-favoritos.ts
│   │   └── 05-productos-favoritos.tsx
│   ├── 15-pipeline-preferencias-producto/
│   │   ├── 00-director-preferencias-producto.ts
│   │   ├── 01-favoritos.store.ts
│   │   ├── 02-acciones-favoritos.ts
│   │   └── 03-compartir-producto.ts
│   ├── 16-pipeline-presentacion-producto/
│   │   ├── 00-director-presentacion-producto.ts
│   │   ├── 01-imagen-tarjeta.tsx
│   │   ├── 02-informacion-tarjeta.tsx
│   │   └── 03-acciones-tarjeta.tsx
│   ├── 17-pipeline-vitrina-productos/
│   │   ├── 00-director-vitrina-productos.ts
│   │   ├── 01-estado-tarjeta.ts
│   │   ├── 02-tarjeta-producto.tsx
│   │   ├── 03-grilla-productos.tsx
│   │   └── 04-productos-relacionados.tsx
│   ├── 18-pipeline-galeria-producto/
│   │   ├── 00-director-galeria-producto.ts
│   │   ├── 01-estado-galeria.ts
│   │   ├── 02-miniaturas.tsx
│   │   ├── 03-visor-imagenes.tsx
│   │   └── 04-galeria.tsx
│   ├── 19-pipeline-calificaciones/
│   │   ├── 00-director-calificaciones.ts
│   │   ├── 01-valorar-resena.ts
│   │   ├── 02-estrellas.tsx
│   │   ├── 03-resumen-calificaciones.tsx
│   │   └── 04-tarjeta-resena.tsx
│   ├── 20-pipeline-estado-resenas/
│   │   ├── 00-director-estado-resenas.ts
│   │   ├── 01-contrato-resenas.ts
│   │   ├── 02-resenas.store.ts
│   │   ├── 03-resenas-producto.ts
│   │   └── 04-estado-formulario-resena.ts
│   ├── 21-pipeline-publicacion-resenas/
│   │   ├── 00-director-publicacion-resenas.ts
│   │   ├── 01-aviso-moderacion.tsx
│   │   ├── 02-formulario-resena.tsx
│   │   └── 03-panel-resenas.tsx
│   ├── 22-pipeline-informacion-producto/
│   │   ├── 00-director-informacion-producto.ts
│   │   ├── 01-estado-pestanas.ts
│   │   ├── 02-descripcion-producto.tsx
│   │   ├── 03-especificaciones-producto.tsx
│   │   └── 04-pestanas-producto.tsx
│   ├── 23-pipeline-oferta-producto/
│   │   ├── 00-director-oferta-producto.ts
│   │   ├── 01-garantias-producto.tsx
│   │   ├── 02-acciones-informacion.tsx
│   │   ├── 03-informacion-comercial.tsx
│   │   └── 04-ficha-compra.tsx
│   ├── 24-pipeline-compra-producto/
│   │   ├── 00-director-compra-producto.ts
│   │   ├── 01-disponibilidad-producto.ts
│   │   ├── 02-consulta-whatsapp.ts
│   │   ├── 03-estado-compra-movil.ts
│   │   └── 04-barra-compra-movil.tsx
│   ├── 25-pipeline-detalle-producto/
│   │   ├── 00-director-detalle-producto.ts
│   │   ├── 01-estado-detalle.ts
│   │   ├── 02-cabecera-producto.tsx
│   │   └── 03-vista-producto.tsx
│   ├── 26-pipeline-presentacion-portada/
│   │   ├── 00-director-presentacion-portada.ts
│   │   ├── 01-pilares-confianza.config.ts
│   │   ├── 02-estado-promociones.ts
│   │   ├── 03-carrusel-promociones.tsx
│   │   └── 04-pilares-confianza.tsx
│   ├── 27-pipeline-inicio/
│   │   ├── 00-director-inicio.ts
│   │   ├── 01-datos-inicio.ts
│   │   ├── 02-acceso-categoria.tsx
│   │   ├── 03-acceso-marca.tsx
│   │   └── 04-vista-inicio.tsx
│   ├── 28-pipeline-consulta-contacto/
│   │   ├── 00-director-consulta-contacto.ts
│   │   ├── 01-asuntos-contacto.config.ts
│   │   ├── 02-contacto-whatsapp.ts
│   │   ├── 03-estado-contacto.ts
│   │   └── 04-formulario-contacto.tsx
│   ├── 29-pipeline-informacion-tienda/
│   │   ├── 00-director-informacion-tienda.ts
│   │   ├── 01-canales-contacto.tsx
│   │   ├── 02-mapa-tienda.tsx
│   │   ├── 03-vista-contacto.tsx
│   │   └── 04-vista-nosotros.tsx
│   ├── 30-pipeline-sugerencias-busqueda/
│   │   ├── 00-director-sugerencias-busqueda.ts
│   │   ├── 01-acciones-resultado.ts
│   │   ├── 02-resultado-sugerido.tsx
│   │   └── 03-lista-sugerencias.tsx
│   ├── 31-pipeline-captura-busqueda/
│   │   ├── 00-director-captura-busqueda.ts
│   │   ├── 01-estado-busqueda.ts
│   │   ├── 02-bloqueo-scroll.ts
│   │   ├── 03-estado-desplegable.ts
│   │   ├── 04-buscador.styles.ts
│   │   └── 05-buscador.tsx
│   ├── 32-pipeline-resultados-busqueda/
│   │   ├── 00-director-resultados-busqueda.ts
│   │   ├── 01-seleccion-sugerencias.ts
│   │   ├── 02-estado-resultados.ts
│   │   └── 03-vista-resultados.tsx
│   ├── 33-pipeline-cabecera-tienda/
│   │   ├── 00-director-cabecera-tienda.ts
│   │   ├── 01-estado-cabecera.ts
│   │   ├── 02-buscador-al-desplazar.ts
│   │   ├── 03-selector-tema.tsx
│   │   ├── 04-barra-informacion.tsx
│   │   └── 05-cabecera.tsx
│   ├── 34-pipeline-menu-movil/
│   │   ├── 00-director-menu-movil.ts
│   │   ├── 01-navegacion.styles.ts
│   │   ├── 02-catalogo-movil.tsx
│   │   ├── 03-informacion-movil.tsx
│   │   └── 04-menu-movil.tsx
│   ├── 35-pipeline-navegacion-tienda/
│   │   ├── 00-director-navegacion-tienda.ts
│   │   ├── 01-enlaces-navegacion.config.ts
│   │   ├── 02-estado-navegacion.ts
│   │   ├── 03-panel-explorar.tsx
│   │   ├── 04-menu-explorar.tsx
│   │   └── 05-barra-navegacion.tsx
│   ├── 36-pipeline-pie-tienda/
│   │   ├── 00-director-pie-tienda.ts
│   │   ├── 01-identidad-pie.tsx
│   │   ├── 02-enlaces-pie.tsx
│   │   ├── 03-redes-sociales.tsx
│   │   ├── 04-informacion-pie.tsx
│   │   └── 05-pie-tienda.tsx
│   └── 37-pipeline-layout-tienda/
│       ├── 00-director-layout-tienda.ts
│       ├── 01-restaurar-desplazamiento.ts
│       ├── 02-estado-overlay-movil.ts
│       ├── 03-fondo-menu-movil.tsx
│       └── 04-layout-principal.tsx
└── tests/
    └── ui-traceability.test.mjs
```

`main.tsx` importa los estilos globales, normaliza la vista inicial y monta
StrictMode → HashRouter → App. El director de aplicación delega en `AppRoutes`
de `01-rutas.tsx`, que compone MainLayout y las páginas de negocio.

`00-director-modelos.ts` expone los modelos compartidos de
`03-modelos-producto.ts` (Product, Category, Brand, Review, filtros, etc.).
Los tipos específicos del carrito viven en el pipeline 07 y se exponen también
por `00-director-carrito.ts`. No se duplican modelos para eludir dependencias.

## 3. Catálogo de pipelines

Cada carpeta indicada es relativa a src. Su director se llama
`00-director-<sufijo-del-pipeline>.ts`; el total incluye ese director.
El [mapa completo](REFACTOR_MAP.md#mapa-completo-ruta-actual--ruta-nueva)
enumera cada archivo de fase con su nombre actual y anterior.

| Pipeline | Responsabilidad y componentes conservados | Archivos |
| --- | --- | ---: |
| `01-pipeline-identidad-tienda` | Identidad comercial, formatos monetarios, enlaces WhatsApp y Logo | 5 |
| `02-pipeline-preferencias-interfaz` | Estado de interfaz, tema, clic exterior, insets y WhatsApp flotante | 6 |
| `03-pipeline-notificaciones` | Store de avisos, useToasts, Toast y ToastContainer | 5 |
| `04-pipeline-presentacion-secciones` | Breadcrumbs, PageBanner, SectionHeading y EmptyState | 5 |
| `05-pipeline-controles-compra` | Badge, Button, Select, QuantitySelector y ConfirmDialog | 6 |
| `06-pipeline-datos-mock` | Categorías, marcas, productos, reseñas y promociones dummy | 6 |
| `07-pipeline-estado-carrito` | Tipos, cálculos, store persistido y acciones del carrito | 5 |
| `08-pipeline-vista-carrito` | CartWidget, CartItem, useCartView y CartView | 5 |
| `09-pipeline-checkout-whatsapp` | Mensaje WhatsApp, CheckoutForm y CartSummary | 4 |
| `10-pipeline-consulta-catalogo` | Consultas, ordenación, estado de filtros y FilterBar | 6 |
| `11-pipeline-categorias` | Estadísticas, estado, tarjeta y vista de categorías | 5 |
| `12-pipeline-marcas` | Estado, tarjeta y vista de marcas | 4 |
| `13-pipeline-seleccion-catalogo` | Selección de categoría, marca y ofertas | 4 |
| `14-pipeline-listados-catalogo` | Listados de categoría, marca, ofertas y favoritos | 6 |
| `15-pipeline-preferencias-producto` | Store/acciones de favoritos y compartir producto | 4 |
| `16-pipeline-presentacion-producto` | Imagen, información y acciones de las tarjetas | 4 |
| `17-pipeline-vitrina-productos` | Estado de tarjeta, ProductCard, ProductGrid y relacionados | 5 |
| `18-pipeline-galeria-producto` | Estado de galería, miniaturas, lightbox y ProductGallery | 5 |
| `19-pipeline-calificaciones` | Valorar utilidad, estrellas, resumen y tarjeta de reseña | 5 |
| `20-pipeline-estado-resenas` | Contrato, store, consulta y formulario lógico de reseñas | 5 |
| `21-pipeline-publicacion-resenas` | Aviso de moderación, ReviewForm y panel de reseñas | 4 |
| `22-pipeline-informacion-producto` | Estado de pestañas, descripción, especificaciones y ProductTabs | 5 |
| `23-pipeline-oferta-producto` | Garantías, acciones, información comercial y ProductBuyBox | 5 |
| `24-pipeline-compra-producto` | Disponibilidad, consulta WhatsApp y compra móvil | 5 |
| `25-pipeline-detalle-producto` | Estado, cabecera y vista de detalle de producto | 4 |
| `26-pipeline-presentacion-portada` | Configuración de confianza, estado/carrusel y TrustPillars | 5 |
| `27-pipeline-inicio` | Datos de inicio, accesos a categorías/marcas y Home | 5 |
| `28-pipeline-consulta-contacto` | Asuntos, URL WhatsApp, estado y formulario de contacto | 5 |
| `29-pipeline-informacion-tienda` | Canales, mapa, ContactView y AboutView | 5 |
| `30-pipeline-sugerencias-busqueda` | Acciones por resultado, SearchResultItem y SearchDropdown | 4 |
| `31-pipeline-captura-busqueda` | Estado, bloqueo de scroll, desplegable, estilos y SearchInput | 6 |
| `32-pipeline-resultados-busqueda` | Selección de sugerencias, estado y SearchView | 4 |
| `33-pipeline-cabecera-tienda` | Estado de cabecera, colapso de búsqueda, tema, TopBar y Header | 6 |
| `34-pipeline-menu-movil` | Estilos y secciones de catálogo/información del menú móvil | 5 |
| `35-pipeline-navegacion-tienda` | Enlaces, estado, panel Explorar y Navbar | 6 |
| `36-pipeline-pie-tienda` | Marca, enlaces, redes, información y Footer | 6 |
| `37-pipeline-layout-tienda` | Scroll, overlay móvil, backdrop y MainLayout | 5 |

Los cinco módulos dummy están en `06-pipeline-datos-mock`, con un único
director de reexportación. Se conservan literalmente sus datos, incluidos
placeholders de imágenes, stock, precios, promociones y reseñas de muestra.

## 4. Contratos de integración

| Entrada raíz | Contrato |
| --- | --- |
| `00-director-catalogo.ts` | Páginas de catálogo, ProductGrid, FilterBar, filtros, estadísticas, favoritos, consultas y products |
| `00-director-carrito.ts` | CartView, CartWidget, useCart, useCartStore, getAvailableStock y tipos del carrito |
| `00-director-busqueda.ts` | SearchInput, useSearchInput, useSearchSuggestions y SearchView |
| `00-director-inicio.ts` | Home |
| `00-director-informacion.ts` | AboutView y ContactView |
| `00-director-modelos.ts` | Tipos compartidos del catálogo |
| `04-trazabilidad-ui.ts` | uiMeta y UiMeta; sin imports de pipelines |

Ejemplo de acceso entre pipelines:

```tsx
import { ProductGrid } from '@/17-pipeline-vitrina-productos/00-director-vitrina-productos'
import { uiMeta } from '@/04-trazabilidad-ui'
```

Dentro del pipeline de vitrina, `ProductGrid` puede importar
`./02-tarjeta-producto`. Desde otro pipeline se usa el director. Un director
no agrega estado ni lógica y no se importa desde sus propias fases si eso
crearía una dependencia circular.

## 5. Trazabilidad UI y kill switch

El núcleo único es `src/04-trazabilidad-ui.ts`. `uiMeta` es una función sin
efectos de DOM: devuelve tres atributos cuando la trazabilidad está activa
y un objeto vacío cuando está apagada. Todos los consumidores usan ese núcleo.

| Atributo | Contrato |
| --- | --- |
| `data-ui-id` | ID estable de negocio, independiente de las carpetas; las listas incorporan el ID del dato |
| `data-ui-component` | Nombre del componente existente; no cambia al renombrar archivos |
| `data-ui-source` | Ruta real y actual relativa a store, empezando por src/ |

```tsx
import { uiMeta } from '@/04-trazabilidad-ui'

const SOURCE = 'src/17-pipeline-vitrina-productos/02-tarjeta-producto.tsx'
<article {...uiMeta({ id: `producto.card.${p.id}`, component: 'ProductCard', source: SOURCE })} />
```

Al mover un archivo se actualiza su SOURCE, sin cambiar IDs ni nombres de
componentes. La revisión posterior a FLOA actualizó 79 rutas en 78 archivos,
incluido SOURCE_SELECT, que identifica la implementación actual de Select.
Las primitivas que reciben metadatos por props los propagan al elemento nativo;
las capas de arranque no necesitan inventar un elemento DOM para ser trazables.
Los portales de la galería y de compra móvil utilizan el mismo núcleo.

Los IDs permiten encontrar instancias; un producto presente en varias vitrinas
puede conservar su mismo ID de negocio. No se usan como IDs HTML globales ni
se presupone que document.querySelector devuelva todas sus instancias.
Nunca se inyectan props de trazabilidad en un componente de terceros que no
las soporte; se utiliza un contenedor o una primitiva propia que las propague.

### Configuración exacta

| Valor de VITE_UI_TRACEABILITY | Resultado |
| --- | --- |
| No definido | Activa, en desarrollo y producción |
| `true` | Activa |
| `false` (literal en minúsculas) | Desactivada: no se renderiza ningún atributo data-ui-* |
| Cualquier otro valor | Se conserva el contrato existente: activa |

Vite sustituye la variable al arrancar dev o compilar. Es necesario reiniciar
el servidor de desarrollo o reconstruir la aplicación después de cambiarla.
`pnpm preview` sirve la build existente; cambiar la variable solo al ejecutar
preview no modifica esa build. PROD no apaga automáticamente la trazabilidad.

```sh
# Activa explícitamente, incluso si un .env la desactiva
VITE_UI_TRACEABILITY=true pnpm dev

# Desactiva en desarrollo
VITE_UI_TRACEABILITY=false pnpm dev

# Build con trazabilidad desactivada
VITE_UI_TRACEABILITY=false pnpm build
pnpm preview

# Restaura una build con trazabilidad activa
VITE_UI_TRACEABILITY=true pnpm build
```

El interruptor controla la inyección de metadatos en el DOM. No cambia
accesibilidad, formularios, navegación, stores ni datos de negocio.

### Independencia de los selectores funcionales

Ningún código funcional consulta data-ui-*, ni accede a dataset.uiId,
dataset.uiComponent o dataset.uiSource. Esos atributos son observabilidad.

| Elemento funcional | Selector independiente del kill switch | Consumidor |
| --- | --- | --- |
| Cabecera sticky | `#store-sticky-header` | useSearchLock y useMobileMenuOverlay |
| Desplegable de búsqueda | `[data-search-dropdown]` | useSearchLock: permite scroll dentro del desplegable |
| Menú móvil | `#mobile-menu` | useMobileMenuOverlay y aria-controls del botón |

Estos marcadores siguen presentes con el kill switch apagado. El menú y el
buscador móvil mantienen cabecera fija, bloqueo del fondo, scroll dentro del
overlay y restauración de estilos/posición al cerrar. No contienen rutas de
código ni nombres de componente. Los data-ui-id previos se conservan cuando
la trazabilidad está activa.

Comprobación en la consola del navegador para una build desactivada:

```js
document.querySelectorAll('[data-ui-id], [data-ui-component], [data-ui-source]').length
// 0, también después de abrir overlays o portales
```

## 6. Directorio de vistas

Rutas atendidas por HashRouter; las rutas siguientes van después de `#/`.

| Ruta | Página | Implementación relativa a src |
| --- | --- | --- |
| `/` | Home | `27-pipeline-inicio/04-vista-inicio.tsx` |
| `/categories` | CatalogHub | `11-pipeline-categorias/04-vista-categorias.tsx` |
| `/category/:slug` | CategoryView | `14-pipeline-listados-catalogo/01-productos-categoria.tsx` |
| `/brands` | BrandsView | `12-pipeline-marcas/03-vista-marcas.tsx` |
| `/brand/:slug` | BrandDetail | `14-pipeline-listados-catalogo/02-productos-marca.tsx` |
| `/product/:id` | ProductDetail | `25-pipeline-detalle-producto/03-vista-producto.tsx` |
| `/offers` | OffersView | `14-pipeline-listados-catalogo/03-productos-oferta.tsx` |
| `/favorites` | FavoritesView | `14-pipeline-listados-catalogo/05-productos-favoritos.tsx` |
| `/cart` | CartView | `08-pipeline-vista-carrito/04-vista-carrito.tsx` |
| `/search` | SearchView | `32-pipeline-resultados-busqueda/03-vista-resultados.tsx` |
| `/about` | AboutView | `29-pipeline-informacion-tienda/04-vista-nosotros.tsx` |
| `/contact` | ContactView | `29-pipeline-informacion-tienda/03-vista-contacto.tsx` |
| `*` | Redirección a `/` | `01-rutas.tsx` |

## 7. Presentación, lógica y mantenimiento

- Todo .tsx permanece en un máximo de 150 líneas, validado por ESLint;
  las páginas existentes se mantienen en un máximo de 100 líneas.
- Se conserva la separación entre vistas, hooks de estado/efectos, stores y
  cálculos/URLs. La migración de carpetas no reescribe esa composición.
- Las tarjetas conservan sus partes de imagen, información y acciones.
  Los formularios conservan sus hooks, validaciones y mensajes existentes.
- Las clases Tailwind se mantienen completas; los estilos calculados de
  navegación y buscador permanecen en sus fases .styles.ts.
- El checkout de carrito y las consultas de producto/contacto construyen URLs
  WhatsApp sobre la fase genérica de enlaces del pipeline de identidad.
- Una corrección futura de datos mock, persistencia, reservas, reseñas o UX
  requiere su propio alcance y validación; no se mezcla con movimientos de archivos.

## 8. Layout y responsive

**Contenedor.** Todo el ancho sale del token `--container-app` (`src/00-estilos-globales.css`, 1600 px) → clase `max-w-app`,
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
| Navbar (≥ lg) | izquierda: **Explorar** (panel: categorías + marcas, cada una con «Ver todas») · accesos rápidos a categorías (≥ xl, activo = subrayado) · **Ofertas** (píldora destacada: degradado ámbar en claro, sutil en oscuro) — derecha: **Nosotros · Contacto** (`INFO_LINKS` en `35-pipeline-navegacion-tienda/01-enlaces-navegacion.config.ts`) |
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
- Pestañas: `useProductTabs(id)` vuelve a «Descripción General» al cambiar de producto (el estado vive en `02-pipeline-preferencias-interfaz/01-preferencias.store.ts`).
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

## 9. Calidad y comprobaciones repetibles

Desde store/:

```sh
pnpm exec tsc -b --force
pnpm lint
node --test tests/ui-traceability.test.mjs
pnpm build
```

Las pruebas de trazabilidad usan node:test y TypeScript ya instalado; no se
añaden dependencias ni se modifica package.json. Cubren once casos: valores
del kill switch en desarrollo/producción, pureza de uiMeta, vigencia de SOURCE,
import único del núcleo y prohibición de usar data-ui-* como selector funcional
o de inyectarlo fuera del helper. Pueden verse individualmente con
`node tests/ui-traceability.test.mjs`.

### Auditoría 2026-11-11

- Typecheck, lint, pruebas y build correctos.
- Las 79 rutas de origen apuntan a la estructura FLOA; los IDs y nombres de
  componentes se conservan. Solo el núcleo emite atributos data-ui-*.
- Se compilaron tres variantes: variable ausente, true y false.
  La variante predeterminada y true producen la misma build; false elimina
  todos los atributos de trazabilidad observados, incluidos los portales.
- Chrome comparó cada variante contra la build anterior a esta adecuación:
  18 rutas en escritorio (1440 px) y móvil (390 px), 36 snapshots de DOM y
  cuatro capturas por variante. El DOM coincide al excluir los metadatos y
  los dos nuevos marcadores funcionales; las capturas coinciden byte por byte.
- Nueve flujos mantienen resultados y persistencia: añadir a carrito/favoritos,
  cantidad/envío, cancelar/confirmar vaciado, galería/reseñas, tema, búsqueda,
  menú móvil con scroll/Escape, búsqueda móvil con scroll/Escape y cierre
  automático del menú al pasar al breakpoint de escritorio.
- Se comprobó cabecera fija, bloqueo del fondo, eventos táctiles permitidos
  dentro de los overlays, restauración de estilos y scroll; cero excepciones
  ni errores de consola JavaScript con el kill switch activo o apagado.
- El CSS compilado y los cinco módulos dummy conservan su contenido.
  En la comparación de navegador se bloquearon las peticiones HTTPS externas
  (placeholders, fuentes, iconos y mapa) y se usaron movimiento reducido y
  tema inicial claro; la disponibilidad de esos servicios externos no se audita.

Los fixtures, perfiles, logs y capturas de esta auditoría están en
`/tmp/compustore-trace-*`; las pruebas de contrato permanecen en tests/.
El mapa de refactorización conserva por separado la evidencia de la migración
inicial y registra esta adecuación posterior autorizada de la trazabilidad.

## 10. Límites y pendientes conservados

- La separación FLOA es conservadora: persisten dependencias públicas entre
  dominios y llamadas internas entre fases. No se garantiza eliminar un
  pipeline sin afectar a sus consumidores ni se declara un bus EDA inexistente.
- Badge y Button del pipeline 05 siguen disponibles sin forzar su uso.
  Los recursos locales que ya estaban sin uso permanecen en 00-recursos-estaticos.
- Los inventarios de 00-documentacion-historica conservan el contenido original
  de los 00Tree.html; el mapa y esta especificación describen las rutas actuales.
- ProductLightbox devuelve el foco, pero no incorpora un focus trap nuevo.
- Los productos usan imágenes de placehold.co. Los datos y contratos dummy
  se conservan; sustituirlos por una API real exige una tarea independiente.

_Actualizar esta especificación al cambiar contratos, topología, trazabilidad o UX._
