# Blueprint Topológico y Arquitectónico: Front-Office (`/store/`)

Este blueprint define la arquitectura del Front-Office (Vitrina Pública) sobre tu base de **React + Vite + TypeScript + Tailwind CSS**. Se aplican rigurosamente los principios **SRP (Single Responsibility Principle)** y **Desacoplamiento**, garantizando que **ningún archivo supere las 150 líneas de código**. Para lograrlo, la lógica de negocio se aísla en *Custom Hooks*, *Services* (funciones puras) y *Stores* (Zustand), dejando los componentes de React como simples renderizadores (Presentational Components).

---

## 1. Topología de Directorios (`/store/src/`)

```text
store/
├── package.json
├── vite.config.ts
├── tailwind.config.js
└── src/
    ├── main.tsx                  # Punto de entrada de React (Router Provider)
    ├── App.tsx                   # Layout raíz y configuración de Rutas (< 50 líneas)
    ├── index.css                 # Directivas Tailwind y variables CSS base
    │
    ├── types/                    # Interfaces de TypeScript compartidas
    │   ├── index.ts              # Exportador central
    │   ├── product.types.ts      # Product, Category, Brand
    │   └── cart.types.ts         # CartItem, CheckoutState
    │
    ├── data/                     # JSON / Mock Data (Fase actual)
    │   ├── storeConfig.ts        # Info del negocio
    │   └── dummyProducts.ts      # Inventario simulado
    │
    ├── store/                    # Estado Global (Zustand) - Separado por Dominio
    │   ├── useCartStore.ts       # Lógica pura del carrito (< 100 líneas)
    │   ├── useUIStore.ts         # Estado de menús, modales, theme oscuro
    │   └── useFavStore.ts        # Persistencia de favoritos
    │
    ├── services/                 # Funciones puras (Sin React, 100% testeables)
    │   ├── catalog.service.ts    # Filtrado, ordenamiento de productos
    │   ├── cart.service.ts       # Cálculos matemáticos de subtotales/impuestos
    │   ├── whatsapp.service.ts   # Generación de URLs y mensajes para WhatsApp
    │   └── formatters.ts         # Formateo de moneda y fechas
    │
    ├── hooks/                    # Lógica de componentes extraída (SRP)
    │   ├── useFilters.ts         # Orquesta el filtrado de catálogo
    │   ├── useProductTabs.ts     # Controla las pestañas de ProductDetail
    │   └── useTheme.ts           # Interfaz para cambiar dark/light mode
    │
    ├── components/               # Máxima modularización (< 150 líneas por archivo)
    │   ├── ui/                   # Átomos (Componentes genéricos reutilizables)
    │   │   ├── Button.tsx
    │   │   ├── Badge.tsx
    │   │   ├── Select.tsx
    │   │   └── Toast.tsx
    │   │
    │   ├── layout/               # Esqueleto estructural estático
    │   │   ├── MainLayout.tsx    # Wrapper que junta Header, Main y Footer
    │   │   ├── Header.tsx        # Solo orquesta Navbar y acciones
    │   │   ├── Navbar.tsx        # Enlaces de navegación principal
    │   │   ├── MobileMenu.tsx    # Drawer móvil (aislado para no saturar Header)
    │   │   └── Footer.tsx
    │   │
    │   ├── product/              # Dominio: Productos
    │   │   ├── ProductCard.tsx   # Tarjeta modular (Botones delegados a UI)
    │   │   ├── ProductGrid.tsx   # Mapeador de grillas
    │   │   ├── ProductTabs.tsx   # Componente de pestañas del detalle
    │   │   └── RelatedList.tsx   # Slider de sugerencias
    │   │
    │   └── cart/                 # Dominio: Carrito
    │       ├── CartItem.tsx      # Fila individual del carrito
    │       ├── CartSummary.tsx   # Caja de totales
    │       └── CheckoutForm.tsx  # Radio buttons de envío y nota
    │
    └── pages/                    # Vistas (Smart Components - Solo inyectan datos)
        ├── Home.tsx              # Index
        ├── CatalogHub.tsx        # Categorías generales / Marcas
        ├── CategoryView.tsx      # Listado de productos por departamento
        ├── ProductDetail.tsx     # Ensambla imágenes, info y pestañas
        ├── CartView.tsx          # Vista principal del carrito
        ├── OffersView.tsx        # Liquidaciones
        ├── AboutView.tsx         # Nosotros
        └── ContactView.tsx       # Formulario y ubicación
```

---

## 2. Inventario de Vistas (Pages)
*Regla de Arquitectura: Las páginas **NO** contienen lógica compleja ni estilos densos. Su única responsabilidad es llamar a los `hooks` o `stores`, y pasar props a los componentes de `/components`. Ninguna vista superará las 100 líneas.*

1. **`Home.tsx`**: Ensambla el Hero slider, pilares de confianza y vitrinas destacadas.
2. **`CatalogHub.tsx`**: Index visual para mostrar tarjetas grandes de Categorías o Marcas.
3. **`CategoryView.tsx`**: Recibe un parámetro de ruta (slug), usa `useFilters` y renderiza el `ProductGrid`.
4. **`ProductDetail.tsx`**: Vista compuesta. Renderiza galería de imágenes, bloque de compra, y el componente `ProductTabs` para descripción/specs.
5. **`CartView.tsx`**: Consumo directo de `useCartStore`. Renderiza lista de `CartItem` y `CartSummary`.
6. **`OffersView.tsx`**: Filtra productos con propiedad de descuento y renderiza `ProductGrid`.
7. **`FavoritesView.tsx`**: Consumo de `useFavStore` integrado con `ProductGrid`.
8. **`AboutView.tsx`**: Página estática descriptiva del negocio.
9. **`ContactView.tsx`**: Componente visual con mapa, horarios y redirección a `whatsapp.service`.

---

## 3. Inventario de Componentes (Altamente Desacoplados)
*Fragmentación extrema para cumplir la regla de <150 líneas y favorecer la reutilización.*

### Componentes UI (Átomos)
* **`Button.tsx`**: Recibe variantes (primary, secondary, danger) mediante Tailwind variants.
* **`Badge.tsx`**: Etiquetas de estado (Oferta, Agotado, Destacado).
* **`Select.tsx`**: Dropdown nativo estilizado para los filtros de ordenamiento.
* **`QuantitySelector.tsx`**: Botones `[-] [1] [+]` aislados. Dispara eventos `onChange`.

### Componentes de Layout
* **`MainLayout.tsx`**: Renderiza `<Header>`, `<main>{children}</main>` y `<Footer>`. Envuelve la SPA completa.
* **`Header.tsx`**: Contenedor.
* **`Navbar.tsx`**: Extraído del Header para separar la lógica de menús.
* **`SearchInput.tsx`**: Barra de búsqueda aislada, maneja su propio estado local y *debounce*.
* **`CartWidget.tsx`**: Icono del carrito con su burbuja flotante (badge) consumiendo `useCartStore`.

### Componentes de Dominio (Producto)
* **`ProductCard.tsx`**: Muestra imagen, título, precio, badge y botón agregar. No calcula stocks, solo recibe props `product`.
* **`ProductGrid.tsx`**: Recibe un array `Product[]`. Si está vacío, renderiza `<EmptyState>`. Si hay datos, itera `<ProductCard>`.
* **`ProductTabs.tsx`**: Maneja el estado local de navegación entre Descripción, Especificaciones Técnicas y Opiniones.

### Componentes de Dominio (Carrito)
* **`CartItem.tsx`**: Fila con imagen miniatura, título, precio unitario y control `QuantitySelector`.
* **`CartSummary.tsx`**: Recibe subtotales y renderiza el desglose financiero. Contiene el botón a WhatsApp.

---

## 4. Estrategia de Escalabilidad y Cumplimiento (< 150 líneas)

Para garantizar un mantenimiento ágil, se aplican los siguientes patrones estandarizados:

1. **Inversión de Dependencias en Estado (Zustand):** 
   En lugar de pasar props infinitos (Prop Drilling), los componentes leen directamente su fragmento de estado.
   ```typescript
   // useCartStore.ts (Solo lógica, < 100 líneas)
   export const useCartStore = create<CartState>((set) => ({
     items: [],
     addToCart: (product, qty) => set((state) => CartService.addItem(state.items, product, qty)),
     // ...
   }));
   ```

2. **Custom Hooks para Lógica de Vistas (SRP):**
   Cualquier lógica de `useEffect`, timeouts o manipulaciones complejas de arreglos salen del componente hacia un hook.
   ```typescript
   // En CategoryView.tsx, en lugar de 100 líneas de lógica de filtrado:
   const { filteredProducts, sortBy, setSortBy } = useFilters(categorySlug);
   return <ProductGrid products="{filteredProducts}"/>
   ```

3. **Delegación de Lógica Pura a `/services`:**
   Ni Zustand ni React deben calcular strings de WhatsApp ni totales matemáticos. Eso pertenece a funciones aisladas puras en `services/`, que además son 100% testeables en el futuro.
   ```typescript
   // whatsapp.service.ts
   export const generateCartMessage = (items: CartItem[], delivery: string): string => {
       // Lógica de mapeo a string...
   };
   ```

4. **Clases de Utilidad de Tailwind en Constantes:**
   Si los atributos `className` ocupan demasiadas líneas, se extraen a un objeto constante fuera del cuerpo del componente o se utiliza herramientas como `clsx` / `tailwind-merge` dentro del archivo de UI genérico (`Button.tsx`).