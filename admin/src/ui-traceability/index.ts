// admin/src/ui-traceability/index.ts

/**
 * Trazabilidad UI (regla DOMA).
 *
 * Todo elemento interactivo o contenedor principal declara un `id` estable, el
 * componente que lo renderiza y su archivo fuente. Esas marcas permiten auditar
 * la interfaz desde herramientas externas sin acoplarse a clases de Tailwind.
 *
 * Contrato idéntico a `store/src/ui-traceability` para que ambas apps emitan
 * los mismos atributos (`data-ui-id`, `data-ui-component`, `data-ui-source`).
 *
 * Kill switch: definir `VITE_UI_TRACEABILITY=false` desactiva la inyección.
 * No se usa `import.meta.env.PROD` de forma automática para no perder la
 * trazabilidad en builds de QA/staging.
 */
export interface UiMeta {
  id: string
  component: string
  source: string
}

const isTraceabilityEnabled = import.meta.env.VITE_UI_TRACEABILITY !== 'false'

export const uiMeta = (meta: UiMeta): Record<string, string> => {
  if (!isTraceabilityEnabled) return {}

  return {
    'data-ui-id': meta.id,
    'data-ui-component': meta.component,
    'data-ui-source': meta.source,
  }
}

/**
 * Atajo por archivo: fija `component` y `source` una sola vez y devuelve una
 * función que solo recibe el `id`. Internamente delega en `uiMeta`, por lo que
 * respeta el mismo kill switch.
 *
 * @example
 * const t = tracer('ProductCard', 'src/features/catalog/components/grid/ProductCard.tsx')
 * <article {...t(`catalog.card.${p.id}`)} />
 */
export const tracer =
  (component: string, source: string) =>
  (id: string): Record<string, string> =>
    uiMeta({ id, component, source })
