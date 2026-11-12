import { BackLink, PageContainer } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import { FiscalCards } from './00-director-parametros-fiscales'
import { useSettingsPageMeta } from '../60-pipeline-administracion-negocio/04-useSettingsPageMeta'
import { TaxpayerCard } from './03-TaxpayerCard'
import { useStoreSettings } from '../62-pipeline-parametros-emisor/00-director-parametros-emisor'

const t = tracer('FiscalPage', 'src/features/settings/pages/FiscalPage.tsx')

/**
 * ⚠️ DESACTIVADA: sin ruta, sin tarjeta en el hub y sin exportación pública.
 * Se conserva como oportunidad de escalabilidad futura (ver settings/ESCALABILIDAD.md).
 */
export function FiscalPage() {
  useSettingsPageMeta('Parámetros fiscales y moneda')
  const settings = useStoreSettings()

  return (
    <PageContainer {...t('settings.fiscal-page')}>
      <BackLink to="/ajustes" label="Ajustes" {...t('settings.back')} />
      {/* Ancho completo: 3 tarjetas en una fila (xl) · 2 + contribuyente a lo ancho (md). */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 items-start" {...t('settings.fiscal')}>
        <FiscalCards currency={settings.currency} />
        <TaxpayerCard settings={settings} />
      </div>
    </PageContainer>
  )
}
