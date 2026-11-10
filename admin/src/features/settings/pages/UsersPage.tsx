import { UsersSection } from '@/features/access'
import { tracer } from '@/ui-traceability'
import { useSettingsPageMeta } from '../hooks/useSettingsPageMeta'

const t = tracer('UsersPage', 'src/features/settings/pages/UsersPage.tsx')

/**
 * Ajustes › Usuarios y Roles.
 * Cuentas del equipo (CRUD + contraseñas) y acceso a los permisos de cada usuario.
 * Las piezas viven en el feature `access`; esta página solo las compone.
 */
export function UsersPage() {
  useSettingsPageMeta('Usuarios y accesos')
  return (
    <div className="flex flex-col h-full animate-fade-in" {...t('settings.users-page')}>
      <UsersSection />
    </div>
  )
}
