// store/src/04-trazabilidad-ui.ts

/**
 * Trazabilidad UI: núcleo transversal de la arquitectura FLOA.
 *
 * Todo elemento interactivo o contenedor principal declara un `id` estable, el
 * componente que lo renderiza y su archivo fuente. Esas marcas permiten auditar
 * la interfaz desde herramientas externas sin acoplarse a clases de Tailwind.
 *
 * Kill switch: definir `VITE_UI_TRACEABILITY=false` desactiva la inyección.
 * Los selectores funcionales del DOM son independientes de estos metadatos.
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
