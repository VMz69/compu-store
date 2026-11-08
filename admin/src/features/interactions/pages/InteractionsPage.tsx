import { EmptyState, PageContainer, PageHeader } from '@/shared/ui'
import { tracer } from '@/ui-traceability'

const t = tracer('InteractionsPage', 'src/features/interactions/pages/InteractionsPage.tsx')

/**
 * /interacciones · Vista reservada (pendiente de definir su flujo operativo).
 * Cuando se defina, seguir la anatomía de feature: types · mocks · store · hooks · components.
 */
export function InteractionsPage() {
  return (
    <PageContainer {...t('interactions')}>
      <PageHeader title="Interacciones" subtitle="Registro de interacciones con clientes." />
      <EmptyState
        icon="fa-solid fa-comments"
        title="Vista en construcción"
        hint="El flujo de interacciones se definirá próximamente."
        {...t('interactions.empty')}
      />
    </PageContainer>
  )
}
