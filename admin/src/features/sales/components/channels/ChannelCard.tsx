import { cn } from '@/shared/lib/cn'
import { formatCurrency } from '@/shared/lib/currency'
import { tracer } from '@/ui-traceability'
import type { Channel } from '../../types'

const t = tracer('ChannelCard', 'src/features/sales/components/channels/ChannelCard.tsx')

interface ChannelCardProps {
  channel: Channel
  orderCount: number
  revenue: number
  canEdit: boolean
  onToggle: (channelId: string) => void
  onEdit: (channel: Channel) => void
}

export function ChannelCard({ channel: ch, orderCount, revenue, canEdit, onToggle, onEdit }: ChannelCardProps) {
  return (
    <div
      className={cn(
        'bg-white dark:bg-slate-900 rounded-xl border p-4 shadow-2xs flex flex-col justify-between gap-3 transition-all',
        ch.active
          ? 'border-slate-200 dark:border-slate-800'
          : 'border-dashed border-slate-300 dark:border-slate-700 opacity-60',
      )}
      {...t(`settings.channel.${ch.id}`)}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-lg text-slate-700 dark:text-slate-200 shrink-0">
          <i className={ch.icon} aria-hidden="true" />
        </div>
        <div className="min-w-0">
          <h5 className="font-bold text-xs text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
            {ch.name}
            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
              {ch.badge || 'Canal'}
            </span>
          </h5>
          <p className="text-[11px] text-slate-400 line-clamp-1">{ch.description}</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
        <div>
          <span className="text-[10px] text-slate-400 font-bold block">Órdenes Capturadas</span>
          <span className="font-bold text-slate-700 dark:text-slate-200">{orderCount} pedidos</span>
        </div>
        <div>
          <span className="text-[10px] text-slate-400 font-bold block">Facturación Liquidada</span>
          <span className="font-black text-emerald-600 dark:text-emerald-400">{formatCurrency(revenue)}</span>
        </div>
      </div>

      <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className={cn('w-2 h-2 rounded-full', ch.active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300 dark:bg-slate-600')} />
          <span className={cn('text-[10px] font-bold', ch.active ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400')}>
            {ch.active ? 'Activo en Nuevo Pedido' : 'Desactivado'}
          </span>
        </div>
        {canEdit && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              className="px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
              onClick={() => onEdit(ch)}
              {...t(`settings.channel.edit.${ch.id}`)}
            >
              <i className="fa-solid fa-pen text-[9px] mr-1" aria-hidden="true" />
              Editar
            </button>
            <button
              type="button"
              className={cn(
                'px-2.5 py-1 rounded-md text-[10px] font-bold transition-colors',
                ch.active
                  ? 'bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-950/40 dark:text-red-400'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400',
              )}
              onClick={() => onToggle(ch.id)}
              {...t(`settings.channel.toggle.${ch.id}`)}
            >
              {ch.active ? 'Desactivar' : 'Activar Canal'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
