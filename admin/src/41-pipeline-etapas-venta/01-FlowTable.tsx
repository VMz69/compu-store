import { DataTable, IconButton, type TableHeader } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { FlowTableApi } from './03-useFlowTable'
import { OrderStatusBadge } from '../39-pipeline-transiciones-pedidos/04-OrderStatusBadge'

const t = tracer('FlowTable', 'src/41-pipeline-etapas-venta/01-FlowTable.tsx')

const HEADERS: TableHeader[] = [
  { label: 'Paso', className: 'px-4 w-14' },
  { label: 'Estado' },
  { label: 'Descripción' },
  { label: 'Puede pasar a' },
  { label: 'Pedidos', className: 'px-3 text-right' },
  { label: 'Editar', className: 'px-4 text-right' },
]

/** Flujo de pedidos: estados en orden con sus transiciones (fijas) y textos editables. */
export function FlowTable({ api }: { api: FlowTableApi }) {
  return (
    <DataTable headers={HEADERS} {...t('settings.flow.table')}>
      {api.rows.map(({ status: s, count, nextNames }) => (
        <tr key={s.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors" {...t(`settings.flow.${s.id}`)}>
          <td className="py-3 px-4 font-black text-slate-400 tabular-nums">{s.step || '—'}</td>
          <td className="py-3 px-3 whitespace-nowrap"><OrderStatusBadge status={s.id} /></td>
          <td className="py-3 px-3 text-[11px] text-slate-500 dark:text-slate-400 max-w-md">{s.description}</td>
          <td className="py-3 px-3 text-[11px] text-slate-600 dark:text-slate-300">
            {nextNames.length ? nextNames.join(' · ') : <span className="text-slate-400">Final</span>}
          </td>
          <td className="py-3 px-3 text-right font-bold tabular-nums text-slate-700 dark:text-slate-200">{count}</td>
          <td className="py-3 px-4 text-right">
            {api.canEdit && (
              <IconButton icon="fa-solid fa-pen" label={`Editar ${s.name}`} tone="plain" sizeClass="w-7 h-7" onClick={() => api.edit(s.id)} {...t(`settings.flow.edit.${s.id}`)} />
            )}
          </td>
        </tr>
      ))}
    </DataTable>
  )
}
