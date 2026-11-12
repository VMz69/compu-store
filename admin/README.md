# CompuStore SV — Back Office

Panel de administración (inventario, pedidos, facturación, clientes, cotizaciones,
ofertas y ajustes con control de acceso por roles). SPA con React 19 + TypeScript 7
+ Tailwind 4 + Vite 8 + Zustand 5, con topología FLOA de pipelines planos.

## Scripts

```bash
pnpm install
pnpm dev       # servidor de desarrollo (puerto 5174)
pnpm build     # tsc -b (TS 7) + vite build
pnpm lint      # ESLint (typescript-eslint sobre el alias TS 6)
pnpm preview   # previsualización de dist/
node --test --test-isolation=none tests/traceability.test.mjs
```

## Estructura

```
src/
  main.tsx                       # entrada de Vite
  00-orquestador-principal.tsx    # RouterProvider
  00-trazabilidad.ts             # uiMeta + tracer (data-ui-*) y kill switch
  00-director-*.ts               # API de dominios y contratos compartidos
  00-documentacion/              # documentos históricos conservados
  01-pipeline-rutas-protegidas/   # ejemplo; 88 pipelines al mismo nivel
    00-director-rutas-protegidas.ts
    01-router.tsx                # fases numeradas; 4–6 archivos por pipeline
    ...
```

## Variables (`.env`)

`VITE_UI_TRACEABILITY`, `VITE_STORE_URL`, `VITE_BASE_PATH`, `VITE_SHOW_DEMO_CREDENTIALS`.

La trazabilidad está activa por defecto. Solo `VITE_UI_TRACEABILITY=false` la
desactiva; reiniciar Vite o reconstruir el build para aplicar el cambio. Los
metadatos `source` señalan a las rutas FLOA actuales. Ver contrato y pruebas en
[`arch-backOffice.md`](./arch-backOffice.md#3-capa-de-trazabilidad-y-kill-switch).

## Documentación

- Arquitectura: [`arch-backOffice.md`](./arch-backOffice.md)
- Mapeo y excepciones de la migración: [`REFACTOR_MAP.md`](./REFACTOR_MAP.md)
- Reglas de desarrollo: [`agent-rules.md`](./agent-rules.md)
