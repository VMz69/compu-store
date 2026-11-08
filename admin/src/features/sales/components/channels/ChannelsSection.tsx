import { CardTitle } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { ChannelsApi } from '../../hooks/useChannels'
import { ChannelCard } from './ChannelCard'

const t = tracer('ChannelsSection', 'src/features/sales/components/channels/ChannelsSection.tsx')

/** Sección "Canales Omnicanal de Venta" de Ajustes › Canales & Transiciones. */
export function ChannelsSection({ channels }: { channels: ChannelsApi }) {
  const { items, activeCount, totalCount, canEdit, toggle, openEdit } = channels

  return (
    <section className="space-y-3" {...t('settings.channels')}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
        <div>
          <CardTitle className="flex items-center gap-2">
            <i className="fa-solid fa-store text-emerald-500" aria-hidden="true" /> Canales Omnicanal de Venta
          </CardTitle>
          <p className="text-[11px] text-slate-400">
            Canales habilitados para la captura de pedidos y análisis de facturación en tiempo real.
          </p>
        </div>
        <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400">
          {activeCount} de {totalCount} canales activos
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {items.map(({ channel, orderCount, revenue }) => (
          <ChannelCard
            key={channel.id}
            channel={channel}
            orderCount={orderCount}
            revenue={revenue}
            canEdit={canEdit}
            onToggle={toggle}
            onEdit={openEdit}
          />
        ))}
      </div>
    </section>
  )
}
