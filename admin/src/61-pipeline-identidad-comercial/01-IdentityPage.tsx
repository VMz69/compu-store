import { BackLink, PageContainer } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import { IdentityForm } from './02-IdentityForm'
import { useSettingsPageMeta } from '../60-pipeline-administracion-negocio/04-useSettingsPageMeta'

const t = tracer('IdentityPage', 'src/61-pipeline-identidad-comercial/01-IdentityPage.tsx')

export function IdentityPage() {
  useSettingsPageMeta('Identidad del emisor')
  return (
    <PageContainer {...t('settings.identity-page')}>
      <BackLink to="/ajustes" label="Ajustes" {...t('settings.back')} />
      <IdentityForm />
    </PageContainer>
  )
}
