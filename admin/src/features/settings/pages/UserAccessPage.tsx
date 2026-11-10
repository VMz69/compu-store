import { useParams } from 'react-router-dom'
import { AccessSidebar, RoleBadge, UserAvatar, useUserAccess, ViewActionsPanel } from '@/features/access'
import { Button, Card, EmptyState, PageContainer } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { SettingsSubHeader } from '../components/SettingsSubHeader'

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
  const parent = { label: 'Usuarios', to: '/ajustes/usuarios' }

  if (!a.user || !a.role) {
    return (
      <PageContainer {...t('settings.access-page')}>
        <SettingsSubHeader section="Accesos" title="Accesos del usuario" icon="fa-solid fa-user-lock text-purple-500" parent={parent} />
        <EmptyState icon="fa-solid fa-user-slash" title="El usuario no existe o fue eliminado." action={<Button variant="outline" size="md" onClick={a.back} {...t('settings.access.not-found.back')}>Volver a usuarios</Button>} />
      </PageContainer>
    )
  }

  return (
    <PageContainer {...t('settings.access-page')}>
      <SettingsSubHeader section="Accesos" title={`Accesos de ${a.user.name}`} icon="fa-solid fa-user-lock text-purple-500" parent={parent} />

      <Card className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3" {...t('settings.access.summary')}>
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar name={a.user.name} avatar={a.user.avatar} className="w-10 h-10 rounded-xl" />
          <div className="min-w-0">
            <p className="text-sm font-black text-slate-800 dark:text-slate-100 truncate">{a.user.name}</p>
            <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
              <RoleBadge role={a.role} withIcon />
              <span>{a.summary.views} vistas · {a.summary.actions} acciones</span>
              {a.homeView && <span>· Inicio: <b>{a.homeView}</b></span>}
            </div>
          </div>
        </div>
        {!a.lockedReason && (
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="md" icon="fa-solid fa-rotate-left" onClick={a.resetToTemplate} title={`Volver a los accesos de la plantilla "${a.role.name}"`} {...t('settings.access.reset')}>Plantilla del rol</Button>
            {a.dirty && <Button variant="outline" size="md" onClick={a.discard} {...t('settings.access.discard')}>Descartar</Button>}
            <Button size="md" icon="fa-solid fa-floppy-disk" disabled={!a.dirty} isLoading={a.isLoading} onClick={a.save} {...t('settings.access.save')}>Guardar accesos</Button>
          </div>
        )}
      </Card>

      {a.lockedReason && (
        <p role="status" className="text-xs font-semibold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-500/10 border border-purple-200 dark:border-purple-500/30 rounded-xl px-4 py-3">
          <i className="fa-solid fa-lock mr-2" aria-hidden="true" />{a.lockedReason}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)] gap-5 items-start">
        <AccessSidebar a={a} />
        <ViewActionsPanel a={a} />
      </div>
    </PageContainer>
  )
}
