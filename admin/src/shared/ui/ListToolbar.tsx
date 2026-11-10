import type { ReactNode } from 'react'
import { tracer } from '@/ui-traceability'

const t = tracer('ListToolbar', 'src/shared/ui/ListToolbar.tsx')

interface ListToolbarProps {
  /** Regreso discreto (`BackLink`) en la fila superior, antes de la ubicación. */
  back?: ReactNode
  /**
   * Ubicación dentro de la vista (ej. ['Ofertas', 'Vigentes']). Se muestra en esta barra,
   * no en la Topbar: la Topbar conserva solo el título de la vista.
   */
  context?: string[]
  /** Selector de área (`SegmentedTabs`), si la vista tiene áreas. */
  tabs?: ReactNode
  /** Filtros adicionales (selects), a la izquierda junto a las áreas. */
  filters?: ReactNode
  /** Información o controles auxiliares (conteo, vista cuadrícula/tabla, acción en lote). */
  aside?: ReactNode
  /** Buscador en tiempo real (`LiveSearch`): SIEMPRE a la derecha. */
  search: ReactNode
  /** Acción principal de la vista: al final de la fila (el buscador queda justo antes). */
  action?: ReactNode
  /** Id de trazabilidad de la barra (ej. "sales.toolbar"). */
  traceId: string
}

/**
 * Barra superior de TODAS las vistas de listado (misma disposición y orden):
 *
 *   ‹ Volver · Vista › Área                               (fila superior, opcional)
 *   [Áreas] [Filtros] ·········· [Auxiliar] [Buscador] [Acción principal]
 *
 * El buscador siempre va a la derecha: es el último elemento de la fila, salvo que
 * exista una acción principal, que entonces cierra la fila. En pantallas angostas el
 * grupo derecho baja a su propia fila y el buscador ocupa el ancho disponible.
 */
export function ListToolbar({ back, context, tabs, filters, aside, search, action, traceId }: ListToolbarProps) {
  return (
    <div
      className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex flex-wrap items-center gap-x-3 gap-y-2"
      {...t(traceId)}
    >
      {(back || (context && context.length > 0)) && (
        <div className="basis-full flex items-center gap-3">
          {back}
          {context && context.length > 0 && (
            <nav aria-label="Ubicación" className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400" {...t(`${traceId}.context`)}>
              {context.map((label, i) => (
                <span key={label} className="flex items-center gap-1.5">
                  {i > 0 && <i className="fa-solid fa-chevron-right text-[8px]" aria-hidden="true" />}
                  <span className={i === context.length - 1 ? 'text-slate-600 dark:text-slate-300' : undefined} aria-current={i === context.length - 1 ? 'location' : undefined}>
                    {label}
                  </span>
                </span>
              ))}
            </nav>
          )}
        </div>
      )}
      {(tabs || filters) && (
        <div className="flex flex-wrap items-center gap-2 max-w-full min-w-0">
          {tabs && <div className="max-w-full min-w-0">{tabs}</div>}
          {filters}
        </div>
      )}
      <div className="ml-auto flex items-center gap-2 w-full sm:w-auto min-w-0">
        {aside && <div className="flex items-center gap-2 shrink-0">{aside}</div>}
        <div className="flex-1 sm:flex-none min-w-0">{search}</div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
    </div>
  )
}
