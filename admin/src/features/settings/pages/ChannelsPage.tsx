import { ChannelsTable, FlowTable, useChannels, useFlowTable } from '@/features/sales'
import { Button, PageContainer } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { SettingsSubHeader } from '../components/SettingsSubHeader'

const t = tracer('ChannelsPage', 'src/features/settings/pages/ChannelsPage.tsx')

const SECTION_TITLE = 'text-sm font-black text-slate-800 dark:text-slate-100'
const SECTION_HINT = 'text-[11px] text-slate-400'

/** Ajustes › Canales y flujo: dos tablas simples (canales de venta y estados del pedido). */
export function ChannelsPage() {
  const channels = useChannels()
  const flow = useFlowTable()

  return (
    <PageContainer spacing="space-y-6" {...t('settings.channels-page')}>
      <SettingsSubHeader section="Canales y flujo" title="Canales de venta y flujo de pedidos" icon="fa-solid fa-diagram-project text-brand" />

      <section className="space-y-3" {...t('settings.channels')}>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h4 className={SECTION_TITLE}>Canales de venta</h4>
            <p className={SECTION_HINT}>{channels.activeCount} de {channels.items.length} activos · por dónde llegan los pedidos.</p>
          </div>
          {channels.canEdit && (
            <Button icon="fa-solid fa-plus" onClick={channels.openCreate} {...t('settings.channels.create')}>Nuevo canal</Button>
          )}
        </div>
        <ChannelsTable api={channels} />
      </section>

      <section className="space-y-3" {...t('settings.flow')}>
        <div>
          <h4 className={SECTION_TITLE}>Flujo de pedidos</h4>
          <p className={SECTION_HINT}>Estados por los que pasa un pedido. Puedes editar su nombre y descripción; el orden y las reglas son fijos.</p>
        </div>
        <FlowTable api={flow} />
      </section>
    </PageContainer>
  )
}
