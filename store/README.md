# CompuStore SV — Front-Office

Tienda en línea de tecnología (catálogo, carrito y checkout por WhatsApp) para
CompuStore SV, Cojutepeque, El Salvador. SPA construida con React 19 + TypeScript
+ Tailwind 4 + Vite 8 + Zustand 5, siguiendo arquitectura DOMA.

## Scripts

```bash
pnpm install
pnpm dev       # servidor de desarrollo (Vite)
pnpm build     # tsc -b + vite build
pnpm lint      # ESLint
pnpm preview   # previsualización de dist/
```

## Estructura

```
src/
  app/              # router, layout (header, navbar, footer), hooks del shell
  features/
    catalog/        # productos, categorías, marcas, ofertas, detalle, reseñas, favoritos
    cart/           # carrito y checkout por WhatsApp
    search/         # buscador global y resultados
    home/           # portada
    info/           # nosotros y contacto
  shared/           # ui, hooks, store, lib, config, types (sin lógica de negocio)
  ui-traceability/  # uiMeta (data-ui-*)
```

Cada feature expone su API en `index.ts`; detalle en [`arch-fronOffice.md`](./arch-fronOffice.md).

## Convenciones clave

- `.tsx` no contiene estado/lógica de negocio (DOMA) y no supera 150 líneas (ESLint).
- Todo elemento interactivo o contenedor principal declara `uiMeta({ id, component, source })`.
- Trazabilidad desactivable con `VITE_UI_TRACEABILITY=false`.
- Tema: por defecto sigue `prefers-color-scheme`; el toggle persiste override manual.
- Ruta por defecto: `#/` (Home).

## Documentación

- Arquitectura: [`arch-fronOffice.md`](./arch-fronOffice.md)
- Reglas de desarrollo: [`agent-rules.md`](./agent-rules.md)
- **Diagnóstico y escalabilidad:** [`DIAGNOSTICO.md`](./DIAGNOSTICO.md)
