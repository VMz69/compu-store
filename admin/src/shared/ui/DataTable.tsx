import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/shared/lib/cn'

export interface TableHeader {
  label: string
  /** Padding horizontal y alineación del encabezado (por defecto "px-3"). */
  className?: string
}

interface DataTableProps extends HTMLAttributes<HTMLDivElement> {
  headers: TableHeader[]
  /** Variante compacta (panel del tablero) sin marco propio. */
  dense?: boolean
  children: ReactNode
}

/** Tabla declarativa: encabezados por configuración y filas como componentes hijos. */
export function DataTable({ headers, dense = false, className, children, ...rest }: DataTableProps) {
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
            {headers.map((header) => (
              <th
                key={header.label}
                scope="col"
                className={cn(dense ? 'py-2.5' : 'py-3', header.className ?? 'px-3')}
              >
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">{children}</tbody>
      </table>
    </div>
  )
}
