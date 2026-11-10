import { BackLink, PageContainer } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { IdentityForm } from '../components/IdentityForm'
import { useSettingsPageMeta } from '../hooks/useSettingsPageMeta'

const t = tracer('IdentityPage', 'src/features/settings/pages/IdentityPage.tsx')

export function IdentityPage() {
  useSettingsPageMeta('Identidad del emisor')
  return (
    <PageContainer {...t('settings.identity-page')}>
      <BackLink to="/ajustes" label="Ajustes" {...t('settings.back')} />
      <IdentityForm />
    </PageContainer>
  )
}
