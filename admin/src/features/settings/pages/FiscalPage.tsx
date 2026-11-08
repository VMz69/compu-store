import { PageContainer } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { FiscalCards } from '../components/FiscalCards'
import { SettingsSubHeader } from '../components/SettingsSubHeader'
import { TaxpayerCard } from '../components/TaxpayerCard'
import { useStoreSettings } from '../hooks/useStoreSettings'

const t = tracer('FiscalPage', 'src/features/settings/pages/FiscalPage.tsx')

export function FiscalPage() {
  const settings = useStoreSettings()

  return (
    <PageContainer {...t('settings.fiscal-page')}>
      <SettingsSubHeader
        section="Parámetros Fiscales & Moneda"
        title="Parámetros Fiscales & Normativa Tributaria"
        icon="fa-solid fa-scale-balanced text-emerald-500"
      />
      <FiscalCards currency={settings.currency} />
      <TaxpayerCard settings={settings} />
    </PageContainer>
  )
}
