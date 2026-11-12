import { BackLink, PageContainer } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import { BackupCard } from '../components/BackupCard'
import { ResetCard } from '../components/ResetCard'
import { useSettingsPageMeta } from '../hooks/useSettingsPageMeta'
import { useMaintenance } from '../hooks/useMaintenance'

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
