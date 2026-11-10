import { PageContainer } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { FiscalCards } from '../components/FiscalCards'
import { SettingsSubHeader } from '../components/SettingsSubHeader'
import { TaxpayerCard } from '../components/TaxpayerCard'
import { useStoreSettings } from '../hooks/useStoreSettings'

const t = tracer('FiscalPage', 'src/features/settings/pages/FiscalPage.tsx')

/**
 * ⚠️ DESACTIVADA: sin ruta, sin tarjeta en el hub y sin exportación pública.
 * Se conserva como oportunidad de escalabilidad futura (ver settings/ESCALABILIDAD.md).
 */
export function FiscalPage() {
  const settings = useStoreSettings()

  return (
    <PageContainer {...t('settings.fiscal-page')}>
      <SettingsSubHeader
        section="Parámetros Fiscales & Moneda"
        title="Parámetros Fiscales & Normativa Tributaria"
        icon="fa-solid fa-scale-balanced text-emerald-500"
      />
      {/* Ancho completo: 3 tarjetas en una fila (xl) · 2 + contribuyente a lo ancho (md). */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start" {...t('settings.fiscal')}>
        <FiscalCards currency={settings.currency} />
        <TaxpayerCard settings={settings} />
      </div>
    </PageContainer>
  )
}
