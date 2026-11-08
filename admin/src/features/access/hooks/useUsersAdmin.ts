import { useMemo, useState, type ChangeEvent } from 'react'
import { askConfirm } from '@/shared/store/confirm.store'
import { openModal } from '@/shared/store/modal.store'
import { toast } from '@/shared/store/toast.store'
import { ensurePermission } from '../lib/permissions'
import { deactivateBlockReason, deleteBlockReason } from '../lib/userRules'
import { ROLE_LIST, ROLES } from '../mocks/roles.mock'
import { ACCESS_MODALS } from '../modals'
import { useAccessStore } from '../store'
import type { RoleId, User } from '../types'
import { usePermission, useSession } from './useSession'

const DENIED = 'Solo el Superadmin puede gestionar usuarios.'

/**
 * Administración de usuarios (Ajustes › Usuarios y Roles).
 * Combina listado filtrado + acciones con validación de permisos y de reglas
 * de negocio (no autoeliminarse, no dejar el sistema sin Superadmin activo).
 */
export function useUsersAdmin() {
  const users = useAccessStore((s) => s.users)
  const setActive = useAccessStore((s) => s.setActive)
  const deleteUser = useAccessStore((s) => s.deleteUser)
  const { user: current } = useSession()
  const canManage = usePermission('canManageUsers')
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState<'all' | RoleId>('all')
  const currentId = current?.id ?? null

  const rows = useMemo(() => {
    const term = search.trim().toLowerCase()
    return users
      .filter((u) => roleFilter === 'all' || u.role === roleFilter)
      .filter((u) => !term || [u.name, u.email, u.phone].some((f) => f.toLowerCase().includes(term)))
      .map((user) => ({
        user,
        role: ROLES[user.role],
        isCurrent: user.id === currentId,
        // Motivos de bloqueo precalculados: la vista deshabilita y explica.
        deleteBlock: deleteBlockReason(user, currentId, users),
        deactivateBlock: deactivateBlockReason(user, currentId, users),
      }))
  }, [users, search, roleFilter, currentId])

  const toggleActive = (user: User) => {
    if (!ensurePermission('canManageUsers', DENIED)) return
    const blocked = deactivateBlockReason(user, currentId, users)
    if (blocked) return toast(blocked, 'warning')
    setActive(user.id, !user.active)
    toast(`${user.name} ${user.active ? 'desactivado: ya no podrá iniciar sesión' : 'reactivado'}`, 'info')
  }

  const promptDelete = (user: User) => {
    const blocked = deleteBlockReason(user, currentId, users)
    if (blocked) return toast(blocked, 'warning')
    askConfirm({
      title: 'Eliminar usuario',
      message: `¿Eliminar a ${user.name} (${user.email})? Perderá el acceso de inmediato. Si solo quieres suspenderlo temporalmente, desactívalo en su lugar.`,
      confirmText: 'Eliminar',
      onConfirm: () => {
        if (!ensurePermission('canManageUsers', DENIED)) return
        deleteUser(user.id)
        toast(`Usuario ${user.name} eliminado`, 'info')
      },
    })
  }

  return {
    rows,
    total: users.length,
    activeCount: users.filter((u) => u.active).length,
    canManage,
    search,
    roleFilter,
    roleOptions: [{ value: 'all', label: 'Todos los roles' }, ...ROLE_LIST.map((r) => ({ value: r.id, label: r.name }))],
    onSearch: (e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value),
    onRoleFilter: (e: ChangeEvent<HTMLSelectElement>) => setRoleFilter(e.target.value as 'all' | RoleId),
    toggleActive,
    promptDelete,
    openCreate: () => openModal(ACCESS_MODALS.userForm, null),
    openEdit: (user: User) => openModal(ACCESS_MODALS.userForm, user),
    openResetPassword: (user: User) => openModal(ACCESS_MODALS.resetPassword, user.id),
  }
}

export type UsersAdminApi = ReturnType<typeof useUsersAdmin>
export type UserRowData = UsersAdminApi['rows'][number]
