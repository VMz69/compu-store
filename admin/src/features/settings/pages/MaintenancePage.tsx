import { PageContainer } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { BackupCard } from '../components/BackupCard'
import { ResetCard } from '../components/ResetCard'
import { SettingsSubHeader } from '../components/SettingsSubHeader'
import { useMaintenance } from '../hooks/useMaintenance'

const t = tracer('MaintenancePage', 'src/features/settings/pages/MaintenancePage.tsx')

export function MaintenancePage() {
  const { summary, canEdit, exportBackup, promptReset } = useMaintenance()

  return (
    <PageContainer {...t('settings.maintenance-page')}>
      <SettingsSubHeader
        section="Mantenimiento & Respaldos"
        title="Mantenimiento del Sistema & Gobernanza de Datos"
        icon="fa-solid fa-database text-amber-500"
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 max-w-4xl">
        <BackupCard summary={summary} onExport={exportBackup} />
        <ResetCard canEdit={canEdit} onReset={promptReset} />
      </div>
    </PageContainer>
  )
}
