import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from '@/shared/store/toast.store'
import { VIEW_CATALOG } from '../config/views.config'
import { effectiveAccess, isSuperadmin, normalizeAccess, templateAccess, validateAccess } from '../lib/access'
import { ensurePermission } from '../lib/permissions'
import { ROLES } from '../../../86-pipeline-datos-demo-personas/00-director-datos-demo-personas'
import { useAccessStore } from '../store'
import type { Permission, UserAccess, ViewId } from '../types'
import { usePermission, useSession } from './useSession'

const USERS_PATH = '/ajustes/usuarios'

/**
 * Accesos de un usuario (RBAC por vistas): borrador editable de vistas y acciones.
 * Reglas: el Super Administrador tiene acceso total (no se edita) y nadie edita sus
 * propios accesos (evita quedarse sin acceso a Ajustes por error).
 */
export function useUserAccess(userId: number) {
  const navigate = useNavigate()
  const { user: me } = useSession()
  const user = useAccessStore((s) => s.users.find((u) => u.id === userId))
  const updateAccess = useAccessStore((s) => s.updateAccess)
  const isLoading = useAccessStore((s) => s.isLoading)
  const canManage = usePermission('canManageUsers')
  const [draft, setDraft] = useState<UserAccess>(() => (user ? effectiveAccess(user) : { views: [], permissions: [] }))
  const [selected, setSelected] = useState<ViewId>(() => draft.views[0] ?? VIEW_CATALOG[0].id)

  const lockedReason = !user
    ? null
    : !canManage
      ? 'Solo lectura: necesitas el permiso «Gestionar usuarios y accesos» para modificarlos.'
      : isSuperadmin(user)
      ? 'El Administrador de Sistema tiene acceso total. Sus permisos no se editan.'
      : user.id === me?.id
        ? 'No puedes modificar tus propios accesos. Pide a otro administrador que lo haga.'
        : null
  const saved = user ? effectiveAccess(user) : draft
  const dirty = saved.views.join() !== draft.views.join() || saved.permissions.join() !== draft.permissions.join()

  const edit = (next: UserAccess) => setDraft(normalizeAccess(next))
  const toggleView = (view: ViewId) =>
    edit(draft.views.includes(view) ? { ...draft, views: draft.views.filter((v) => v !== view) } : { ...draft, views: [...draft.views, view] })
  const togglePermission = (permission: Permission) =>
    edit({ ...draft, permissions: draft.permissions.includes(permission) ? draft.permissions.filter((p) => p !== permission) : [...draft.permissions, permission] })

  const save = async () => {
    if (!user || lockedReason) return
    const error = validateAccess(draft)
    if (error) return toast(error, 'warning')
    if (!ensurePermission('canManageUsers', 'No tienes permiso para gestionar accesos')) return
    await updateAccess(user.id, draft)
    toast(`Accesos de ${user.name} actualizados`, 'success')
  }

  const selectedDef = VIEW_CATALOG.find((v) => v.id === selected) ?? VIEW_CATALOG[0]

  return {
    user: user ?? null,
    role: user ? ROLES[user.role] : null,
    lockedReason,
    views: VIEW_CATALOG.map((def) => ({
      def,
      enabled: draft.views.includes(def.id),
      actionsOn: def.actions.filter((a) => draft.permissions.includes(a.permission)).length,
    })),
    selected: {
      def: selectedDef,
      enabled: draft.views.includes(selectedDef.id),
      actions: selectedDef.actions.map((a) => ({ ...a, on: draft.permissions.includes(a.permission) })),
    },
    homeView: VIEW_CATALOG.find((v) => v.id === draft.views[0])?.label ?? null,
    summary: { views: draft.views.length, actions: draft.permissions.length },
    select: setSelected,
    toggleView,
    togglePermission,
    dirty,
    resetToTemplate: () => user && edit(templateAccess(user.role)),
    discard: () => setDraft(saved),
    save,
    back: () => navigate(USERS_PATH),
    isLoading,
  }
}

export type UserAccessApi = ReturnType<typeof useUserAccess>
