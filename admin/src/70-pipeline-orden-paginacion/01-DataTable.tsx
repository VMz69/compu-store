import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/83-pipeline-recursos-publicos/02-cn'
import type { SortState } from '@/82-pipeline-calculo-importes/03-sort'
import { SortHeaderButton } from './02-SortHeaderButton'

export interface TableHeader {
  label: string
  /** Padding horizontal y alineación del encabezado (por defecto "px-3"). */
  className?: string
  /** Si existe, el encabezado es ordenable por esta clave. */
  sortKey?: string
  /** Encabezado alineado a la derecha (columnas numéricas): el indicador va a la izquierda. */
  alignEnd?: boolean
}

interface DataTableProps extends HTMLAttributes<HTMLDivElement> {
  headers: TableHeader[]
  /** Variante compacta (panel del tablero) sin marco propio. */
  dense?: boolean
  /** Orden actual (para marcar la columna activa) y acción al pulsar un encabezado ordenable. */
  sort?: SortState
  onSort?: (key: string) => void
  /** Prefijo de trazabilidad para los botones de orden (ej. "sales.table.sort"). */
  sortTraceId?: string
  children: ReactNode
}

/** Tabla declarativa: encabezados por configuración y filas como componentes hijos. */
export function DataTable({ headers, dense = false, sort, onSort, sortTraceId, className, children, ...rest }: DataTableProps) {
  return (
    <div
      className={cn(
        'overflow-x-auto',
        !dense &&
          'bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm',
        className,
      )}
      {...rest}
    >
      <table className="w-full text-left border-collapse text-xs">
        <thead
          className={cn(
            'text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase border-b border-slate-100 dark:border-slate-800',
            dense ? 'bg-slate-50/50 dark:bg-slate-800/30' : 'bg-slate-50 dark:bg-slate-800/40',
          )}
        >
          <tr>
            {headers.map((header) => {
              const sortable = Boolean(header.sortKey && onSort)
              const active = sortable && sort?.key === header.sortKey
              return (
                <th
                  key={header.label}
                  scope="col"
                  aria-sort={active ? (sort?.dir === 'asc' ? 'ascending' : 'descending') : sortable ? 'none' : undefined}
                  className={cn(dense ? 'py-2.5' : 'py-3', header.className ?? 'px-3')}
                >
                  {sortable && header.sortKey && onSort ? (
                    <SortHeaderButton
                      label={header.label}
                      dir={active ? sort?.dir : undefined}
                      alignEnd={header.alignEnd}
                      onClick={() => onSort(header.sortKey as string)}
                      traceId={sortTraceId ? `${sortTraceId}.${header.sortKey}` : undefined}
                    />
                  ) : (
                    header.label
                  )}
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">{children}</tbody>
      </table>
    </div>
  )
}
