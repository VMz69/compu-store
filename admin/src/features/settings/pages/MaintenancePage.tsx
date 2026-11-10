import { PageContainer } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { BackupCard } from '../components/BackupCard'
import { ResetCard } from '../components/ResetCard'
import { SettingsSubHeader } from '../components/SettingsSubHeader'
import { useMaintenance } from '../hooks/useMaintenance'

const t = tracer('MaintenancePage', 'src/features/settings/pages/MaintenancePage.tsx')

/**
 * ⚠️ DESACTIVADA: sin ruta, sin tarjeta en el hub y sin exportación pública.
 * Se conserva como oportunidad de escalabilidad futura (ver settings/ESCALABILIDAD.md).
 */
export function MaintenancePage() {
  const { summary, canEdit, exportBackup, promptReset } = useMaintenance()

  return (
    <PageContainer {...t('settings.maintenance-page')}>
      <SettingsSubHeader
        section="Mantenimiento & Respaldos"
        title="Mantenimiento del Sistema & Gobernanza de Datos"
        icon="fa-solid fa-database text-amber-500"
      />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5" {...t('settings.maintenance')}>
        <BackupCard summary={summary} onExport={exportBackup} />
        <ResetCard canEdit={canEdit} onReset={promptReset} />
      </div>
    </PageContainer>
  )
}
