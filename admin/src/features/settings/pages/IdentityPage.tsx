import { PageContainer } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { IdentityForm } from '../components/IdentityForm'
import { SettingsSubHeader } from '../components/SettingsSubHeader'

const t = tracer('IdentityPage', 'src/features/settings/pages/IdentityPage.tsx')

export function IdentityPage() {
  return (
    <PageContainer {...t('settings.identity-page')}>
      <SettingsSubHeader
        section="Identidad Comercial"
        title="Identidad Comercial & Sucursal"
        icon="fa-solid fa-building text-brand"
      />
      <IdentityForm />
    </PageContainer>
  )
}
