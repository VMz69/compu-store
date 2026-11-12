import { formatDateTime } from '@/71-pipeline-seleccion-fechas/05-date'
import { Badge, IconButton, Switch } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { UserRowData, UsersAdminApi } from './02-useUsersAdmin'
import { RoleBadge } from './05-RoleBadge'
import { UserAvatar } from '../08-pipeline-edicion-usuarios/04-UserAvatar'

const t = tracer('UserRow', 'src/features/access/components/users/UserRow.tsx')

interface UserRowProps {
  row: UserRowData
  actions: Pick<UsersAdminApi, 'canManage' | 'openEdit' | 'openResetPassword' | 'toggleActive' | 'promptDelete' | 'openAccess'>
}

/** Fila de usuario. Las acciones bloqueadas por reglas se muestran deshabilitadas con su motivo. */
export function UserRow({ row, actions }: UserRowProps) {
  const { user, role, isCurrent, deleteBlock, deactivateBlock } = row

  return (
    <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors" {...t(`settings.users.row.${user.id}`)}>
      <td className="py-3 px-4">
        <div className="flex items-center gap-3 min-w-0">
          <UserAvatar name={user.name} avatar={user.avatar} />
          <div className="min-w-0">
            <p className="font-bold text-slate-800 dark:text-slate-100 flex items-center gap-1.5">
              <span className="truncate">{user.name}</span>
              {isCurrent && <Badge tone="brand" shape="full">Tú</Badge>}
            </p>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 truncate block">{user.email}</span>
          </div>
        </div>
      </td>
      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 whitespace-nowrap">{user.phone || '—'}</td>
      <td className="py-3 px-3">
        <div className="flex flex-col items-start gap-1">
          <RoleBadge role={role} withIcon />
          {row.customAccess && <span className="text-[10px] font-bold text-purple-600 dark:text-purple-300"><i className="fa-solid fa-sliders mr-1" aria-hidden="true" />Accesos personalizados</span>}
        </div>
      </td>
      <td className="py-3 px-3">
        <div className="flex flex-col items-start gap-1">
          <div className="flex items-center gap-2" title={deactivateBlock ?? undefined}>
            {actions.canManage && (
              <Switch
                checked={user.active}
                label={user.active ? 'Desactivar usuario' : 'Activar usuario'}
                disabled={Boolean(deactivateBlock)}
                onChange={() => actions.toggleActive(user)}
                {...t(`settings.users.toggle.${user.id}`)}
              />
            )}
            <span className={user.active ? 'text-[11px] font-bold text-emerald-600 dark:text-emerald-400' : 'text-[11px] font-bold text-slate-400'}>
              {user.active ? 'Activo' : 'Inactivo'}
            </span>
          </div>
          {user.mustChangePassword && (
            <Badge tone="warning" icon="fa-solid fa-key">Cambio de contraseña pendiente</Badge>
          )}
        </div>
      </td>
      <td className="py-3 px-3 text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
        {user.lastLoginAt ? formatDateTime(user.lastLoginAt) : 'Nunca'}
      </td>
      {actions.canManage && (
        <td className="py-3 px-4">
          <div className="flex items-center justify-end gap-1.5">
            <IconButton icon="fa-solid fa-user-lock" label="Accesos (vistas y acciones)" tone="brand" onClick={() => actions.openAccess(user)} {...t(`settings.users.access.${user.id}`)} />
            <IconButton icon="fa-solid fa-pen" label="Editar usuario" tone="neutral" onClick={() => actions.openEdit(user)} {...t(`settings.users.edit.${user.id}`)} />
            <IconButton icon="fa-solid fa-key" label="Restablecer contraseña" tone="neutral" onClick={() => actions.openResetPassword(user)} {...t(`settings.users.reset-password.${user.id}`)} />
            <IconButton
              icon="fa-solid fa-trash"
              label={deleteBlock ?? 'Eliminar usuario'}
              tone="danger"
              disabled={Boolean(deleteBlock)}
              className="disabled:opacity-40 disabled:cursor-not-allowed"
              onClick={() => actions.promptDelete(user)}
              {...t(`settings.users.delete.${user.id}`)}
            />
          </div>
        </td>
      )}
    </tr>
  )
}
