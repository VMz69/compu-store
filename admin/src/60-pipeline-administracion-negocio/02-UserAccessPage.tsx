import { useParams } from 'react-router-dom'
import { AccessSidebar, AccessSummaryBar, useUserAccess, ViewActionsPanel } from '@/00-director-acceso'
import { BackLink, Button, EmptyState, PageContainer } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import { useSettingsPageMeta } from './04-useSettingsPageMeta'

const t = tracer('UserAccessPage', 'src/features/settings/pages/UserAccessPage.tsx')

/**
 * Ajustes › Usuarios › Accesos · RBAC por vistas: a la izquierda su menú (vistas con
 * acceso), a la derecha las acciones de la vista seleccionada.
 */
export function UserAccessPage() {
  const { userId } = useParams<{ userId: string }>()
  // `key` por usuario: al pasar de un usuario a otro, el borrador se reinicia.
  return <UserAccessView key={userId} userId={Number(userId)} />
}

function UserAccessView({ userId }: { userId: number }) {
  const a = useUserAccess(userId)
  // El nombre del usuario ya está en su tarjeta: la Topbar no lo repite.
  useSettingsPageMeta('Accesos del usuario')

  if (!a.user || !a.role) {
    return (
      <PageContainer {...t('settings.access-page')}>
      <BackLink to="/ajustes/usuarios" label="Usuarios" {...t('settings.access.back')} />
        <BackLink to="/ajustes/usuarios" label="Usuarios" {...t('settings.access.back')} />
        <EmptyState icon="fa-solid fa-user-slash" title="El usuario no existe o fue eliminado." action={<Button variant="outline" size="md" onClick={a.back} {...t('settings.access.not-found.back')}>Volver a usuarios</Button>} />
      </PageContainer>
    )
  }

  return (
    <PageContainer {...t('settings.access-page')}>

      <AccessSummaryBar a={a} />

      <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-5 items-start">
        <AccessSidebar a={a} />
        <ViewActionsPanel a={a} />
      </div>
    </PageContainer>
  )
}
