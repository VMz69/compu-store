import { cn } from '@/83-pipeline-recursos-publicos/02-cn'
import { DataTable, IconButton, Switch, type TableHeader } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { ChannelsApi } from './03-useChannels'

const t = tracer('ChannelsTable', 'src/40-pipeline-canales-venta/01-ChannelsTable.tsx')

const HEADERS: TableHeader[] = [
  { label: 'Canal', className: 'px-4' },
  { label: 'Descripción' },
  { label: 'Pedidos', className: 'px-3 text-right' },
  { label: 'Activo' },
  { label: 'Acciones', className: 'px-4 text-right' },
]

/** CRUD de canales de venta: una fila por canal. */
export function ChannelsTable({ api }: { api: ChannelsApi }) {
  return (
    <DataTable headers={HEADERS} {...t('settings.channels.table')}>
      {api.items.map(({ channel: c, orderCount, deleteBlock }) => (
        <tr key={c.id} className={cn('hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors', !c.active && 'opacity-60')} {...t(`settings.channel.${c.id}`)}>
          <td className="py-3 px-4">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0" aria-hidden="true">
                <i className={c.icon} />
              </span>
              <div className="min-w-0">
                <p className="font-bold text-slate-800 dark:text-slate-100">{c.name}</p>
                <p className="text-[10px] text-slate-400">{c.badge}</p>
              </div>
            </div>
          </td>
          <td className="py-3 px-3 text-[11px] text-slate-500 dark:text-slate-400 max-w-md">
            <span className="line-clamp-2">{c.description || '—'}</span>
          </td>
          <td className="py-3 px-3 text-right font-bold tabular-nums text-slate-700 dark:text-slate-200">{orderCount}</td>
          <td className="py-3 px-3">
            <Switch checked={c.active} label={c.active ? `Desactivar ${c.name}` : `Activar ${c.name}`} disabled={!api.canEdit} onChange={() => api.toggle(c)} {...t(`settings.channel.toggle.${c.id}`)} />
          </td>
          <td className="py-3 px-4">
            {api.canEdit && (
              <div className="flex items-center justify-end gap-0.5">
                <IconButton icon="fa-solid fa-pen" label={`Editar ${c.name}`} tone="plain" sizeClass="w-7 h-7" onClick={() => api.openEdit(c)} {...t(`settings.channel.edit.${c.id}`)} />
                <IconButton
                  icon="fa-solid fa-trash-can"
                  label={deleteBlock ? `No se puede eliminar: ${deleteBlock}` : `Eliminar ${c.name}`}
                  tone="plain"
                  sizeClass="w-7 h-7"
                  className={deleteBlock ? 'opacity-40' : 'hover:text-red-500! hover:bg-red-50! dark:hover:bg-red-950/40!'}
                  aria-disabled={Boolean(deleteBlock)}
                  onClick={() => api.remove(c, deleteBlock)}
                  {...t(`settings.channel.delete.${c.id}`)}
                />
              </div>
            )}
          </td>
        </tr>
      ))}
    </DataTable>
  )
}
