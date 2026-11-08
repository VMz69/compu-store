# CompuStore SV — Back Office

Panel de administración (inventario, pedidos, facturación, clientes, cotizaciones,
ofertas y ajustes con control de acceso por roles). SPA con React 19 + TypeScript 7
+ Tailwind 4 + Vite 8 + Zustand 5, siguiendo arquitectura DOMA por features.

## Scripts

```bash
pnpm install
pnpm dev       # servidor de desarrollo (puerto 5174)
pnpm build     # tsc -b (TS 7) + vite build
pnpm lint      # ESLint (typescript-eslint sobre el alias TS 6)
pnpm preview   # previsualización de dist/
```

## Estructura

```
src/
  app/              # router, guards, layout (sidebar, topbar), overlays
  features/<x>/     # access, catalog, sales, billing, customers, quotes,
                    # promotions, interactions, dashboard, settings
  shared/           # ui, hooks, store, lib, config (sin lógica de negocio)
  ui-traceability/  # uiMeta + tracer (data-ui-*)
```

## Variables (`.env`)

`VITE_UI_TRACEABILITY`, `VITE_STORE_URL`, `VITE_BASE_PATH`, `VITE_SHOW_DEMO_CREDENTIALS`.

## Documentación

- Arquitectura: [`arch-backOffice.md`](./arch-backOffice.md)
- Reglas de desarrollo: [`agent-rules.md`](./agent-rules.md)
