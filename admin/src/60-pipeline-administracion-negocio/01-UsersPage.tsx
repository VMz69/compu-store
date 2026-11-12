import { UsersSection } from '@/00-director-acceso'
import { tracer } from '@/00-trazabilidad'
import { useSettingsPageMeta } from './04-useSettingsPageMeta'

const t = tracer('UsersPage', 'src/60-pipeline-administracion-negocio/01-UsersPage.tsx')

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
