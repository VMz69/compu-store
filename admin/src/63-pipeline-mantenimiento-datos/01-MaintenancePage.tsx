import { BackLink, PageContainer } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import { BackupCard } from './04-BackupCard'
import { ResetCard } from './05-ResetCard'
import { useSettingsPageMeta } from '../60-pipeline-administracion-negocio/04-useSettingsPageMeta'
import { useMaintenance } from './00-director-mantenimiento-datos'

const t = tracer('MaintenancePage', 'src/features/settings/pages/MaintenancePage.tsx')

/**
 * ⚠️ DESACTIVADA: sin ruta, sin tarjeta en el hub y sin exportación pública.
 * Se conserva como oportunidad de escalabilidad futura (ver settings/ESCALABILIDAD.md).
 */
export function MaintenancePage() {
  useSettingsPageMeta('Mantenimiento y respaldos')
  const { summary, canEdit, exportBackup, promptReset } = useMaintenance()

  return (
    <PageContainer {...t('settings.maintenance-page')}>
      <BackLink to="/ajustes" label="Ajustes" {...t('settings.back')} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" {...t('settings.maintenance')}>
        <BackupCard summary={summary} onExport={exportBackup} />
        <ResetCard canEdit={canEdit} onReset={promptReset} />
      </div>
    </PageContainer>
  )
}
