import { ChannelsSection, PipelineSection, useChannels } from '@/features/sales'
import { Button, PageContainer } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { SettingsSubHeader } from '../components/SettingsSubHeader'

const t = tracer('ChannelsPage', 'src/features/settings/pages/ChannelsPage.tsx')

/** Ajustes › Canales de venta & pipeline operativo de pedidos. */
export function ChannelsPage() {
  const channels = useChannels()

  return (
    <PageContainer spacing="space-y-6" {...t('settings.channels-page')}>
      <SettingsSubHeader
        section="Canales & Transiciones Operativas"
        title="Canales de Venta & Pipeline Operativo de Pedidos"
        icon="fa-solid fa-diagram-project text-brand"
        action={
          channels.canEdit && (
            <Button icon="fa-solid fa-plus" onClick={channels.openCreate} {...t('settings.channels.create')}>
              Añadir Canal
            </Button>
          )
        }
      />
      <ChannelsSection channels={channels} />
      <PipelineSection />
    </PageContainer>
  )
}
