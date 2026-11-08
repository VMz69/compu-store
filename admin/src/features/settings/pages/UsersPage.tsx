import { RoleMatrix, ROLE_LIST, UsersSection } from '@/features/access'
import { PageContainer } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { SettingsSubHeader } from '../components/SettingsSubHeader'

const t = tracer('UsersPage', 'src/features/settings/pages/UsersPage.tsx')

/**
 * Ajustes › Usuarios y Roles.
 * Gestión de las cuentas del equipo (CRUD + contraseñas) y matriz de permisos.
 * Las piezas viven en el feature `access`; esta página solo las compone.
 */
export function UsersPage() {
  return (
    <PageContainer spacing="space-y-6" {...t('settings.users-page')}>
      <SettingsSubHeader
        section="Usuarios y Roles"
        title="Usuarios del Sistema & Control de Acceso"
        icon="fa-solid fa-users-gear text-purple-500"
      />
      <UsersSection />
      <RoleMatrix roles={ROLE_LIST} />
    </PageContainer>
  )
}
