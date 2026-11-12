import { cn } from '@/83-pipeline-recursos-publicos/02-cn'
import { IconButton, Switch } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { BrandsTabApi } from './03-useBrandsTab'

const t = tracer('BrandRow', 'src/28-pipeline-marcas-productos/04-BrandRow.tsx')

type BrandItem = BrandsTabApi['items'][number]

/** Fila de marca: identidad, uso, sitio, estado (activa) y acciones. */
export function BrandRow({ item, api }: { item: BrandItem; api: BrandsTabApi }) {
  const { brand: b, productCount, deleteBlock } = item
  const host = b.website.replace(/^https?:\/\/(www\.)?/i, '').replace(/\/$/, '')

  return (
    <tr className={cn('hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors', !b.active && 'opacity-60')} {...t(`catalog.brand.${b.id}`)}>
      <td className="py-3 px-4">
        <div className="flex items-center gap-3">
          <span className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-[11px] font-black text-slate-600 dark:text-slate-300 shrink-0" aria-hidden="true">
            {b.name.slice(0, 2).toUpperCase()}
          </span>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 dark:text-slate-100">{b.name}</p>
            <p className="text-[10px] text-slate-400 truncate max-w-xs">{b.description || <span className="font-mono">/{b.slug}</span>}</p>
          </div>
        </div>
      </td>
      <td className="py-3 px-3 text-right">
        {productCount > 0 ? (
          <button type="button" className="font-bold text-brand hover:underline tabular-nums" onClick={() => api.showProducts(b)} title={`Ver productos ${b.name}`} {...t(`catalog.brand.show.${b.id}`)}>
            {productCount}
          </button>
        ) : (
          <span className="text-slate-400 tabular-nums">0</span>
        )}
      </td>
      <td className="py-3 px-3">
        {host ? (
          <a href={b.website} target="_blank" rel="noreferrer" className="text-[11px] text-slate-500 hover:text-brand hover:underline" {...t(`catalog.brand.website.${b.id}`)}>
            {host} <i className="fa-solid fa-arrow-up-right-from-square text-[9px]" aria-hidden="true" />
          </a>
        ) : (
          <span className="text-[11px] text-slate-400">—</span>
        )}
      </td>
      <td className="py-3 px-3">
        <div className="flex items-center gap-2">
          <Switch checked={b.active} label={b.active ? `Desactivar ${b.name}` : `Activar ${b.name}`} disabled={!api.canEdit} onChange={() => api.toggle(b)} {...t(`catalog.brand.toggle.${b.id}`)} />
          <span className={cn('text-[11px] font-bold', b.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400')}>{b.active ? 'Activa' : 'Inactiva'}</span>
        </div>
      </td>
      <td className="py-3 px-4">
        <div className="flex items-center justify-end gap-0.5">
          {api.canEdit && (
            <IconButton icon="fa-solid fa-pen" label={`Editar ${b.name}`} tone="plain" sizeClass="w-7 h-7" onClick={() => api.edit(b)} {...t(`catalog.brand.edit.${b.id}`)} />
          )}
          {api.canDelete && (
            <IconButton
              icon="fa-solid fa-trash-can"
              label={deleteBlock ? `No se puede eliminar: ${deleteBlock}` : `Eliminar ${b.name}`}
              tone="plain"
              sizeClass="w-7 h-7"
              className={deleteBlock ? 'opacity-40' : 'hover:text-red-500! hover:bg-red-50! dark:hover:bg-red-950/40!'}
              aria-disabled={Boolean(deleteBlock)}
              onClick={() => api.remove(b, deleteBlock)}
              {...t(`catalog.brand.delete.${b.id}`)}
            />
          )}
        </div>
      </td>
    </tr>
  )
}
