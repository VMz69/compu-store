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
  components/   # UI presentacional (< 150 líneas)
  pages/        # Vistas (< 100 líneas)
  hooks/        # Lógica de vista (DOMA)
  services/     # Funciones puras
  store/        # Zustand
  data/         # Datos estáticos (barrel @/data)
  types/        # Tipos compartidos
  ui-traceability/  # uiMeta (data-ui-*)
```

## Convenciones clave

- `.tsx` no contiene estado/lógica de negocio (DOMA).
- Todo elemento interactivo o contenedor principal declara `uiMeta({ id, component, source })`.
- Trazabilidad desactivable con `VITE_UI_TRACEABILITY=false`.
- Tema: por defecto sigue `prefers-color-scheme`; el toggle persiste override manual.
- Ruta por defecto: `#/` (Home).

## Documentación

- Arquitectura original: [`arch-fronOffice.md`](./arch-fronOffice.md)
- Reglas de desarrollo: [`agent-rules.md`](./agent-rules.md)
- **Diagnóstico y escalabilidad:** [`DIAGNOSTICO.md`](./DIAGNOSTICO.md)
