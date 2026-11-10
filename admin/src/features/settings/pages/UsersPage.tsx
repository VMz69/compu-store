import { UsersSection } from '@/features/access'
import { PageContainer } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { SettingsSubHeader } from '../components/SettingsSubHeader'

const t = tracer('UsersPage', 'src/features/settings/pages/UsersPage.tsx')

/**
 * Ajustes › Usuarios y Roles.
 * Cuentas del equipo (CRUD + contraseñas) y acceso a los permisos de cada usuario.
 * Las piezas viven en el feature `access`; esta página solo las compone.
 */
export function UsersPage() {
  return (
    <PageContainer spacing="space-y-6" {...t('settings.users-page')}>
      <SettingsSubHeader
        section="Usuarios y Roles"
        title="Usuarios y accesos"
        icon="fa-solid fa-users-gear text-purple-500"
      />
      <UsersSection />
    </PageContainer>
  )
}
