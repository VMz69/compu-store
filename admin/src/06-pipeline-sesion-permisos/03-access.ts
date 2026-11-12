import { ALL_PERMISSIONS, ALL_VIEWS, VIEW_CATALOG } from '../09-pipeline-accesos-por-vista/02-views.config'
import { ROLES } from '../86-pipeline-datos-demo-personas/00-director-datos-demo-personas'
import type { Permission, Role, RoleId, User, UserAccess, ViewId } from './05-types'

/**
 * RBAC por vistas (lógica pura).
 *  · Cada usuario tiene sus vistas y acciones (`User.access`).
 *  · El rol es solo la PLANTILLA inicial y la etiqueta del puesto.
 *  · Super Administrador (Administrador de Sistema) = acceso total, siempre.
 */

export const SUPERADMIN: RoleId = 'superadmin'

export const isSuperadmin = (user: Pick<User, 'role'>): boolean => user.role === SUPERADMIN

/** Vista a la que pertenece cada acción. */
const VIEW_OF: Record<Permission, ViewId> = Object.fromEntries(
  VIEW_CATALOG.flatMap((v) => v.actions.map((a) => [a.permission, v.id])),
) as Record<Permission, ViewId>

/**
 * Deja los accesos consistentes: vistas en el orden del menú (la primera es la de
 * inicio) y solo acciones cuya vista esté habilitada.
 */
export function normalizeAccess(access: UserAccess): UserAccess {
  const views = ALL_VIEWS.filter((v) => access.views.includes(v))
  return { views, permissions: ALL_PERMISSIONS.filter((p) => access.permissions.includes(p) && views.includes(VIEW_OF[p])) }
}

/** Accesos de la plantilla de un rol. */
export function templateAccess(roleId: RoleId): UserAccess {
  const role = ROLES[roleId]
  return normalizeAccess({ views: role.allowedViews, permissions: ALL_PERMISSIONS.filter((p) => role[p]) })
}

/** Accesos que rigen para el usuario (superadmin: todo). */
export const effectiveAccess = (user: Pick<User, 'role' | 'access'>): UserAccess =>
  isSuperadmin(user) ? { views: ALL_VIEWS, permissions: ALL_PERMISSIONS } : normalizeAccess(user.access ?? templateAccess(user.role))

/**
 * "Rol efectivo" de la sesión: datos del rol + vistas y permisos DEL USUARIO.
 * Así todo el sistema sigue leyendo `role.allowedViews` y `role[permiso]` sin cambios.
 */
export function effectiveRole(user: Pick<User, 'role' | 'access'>): Role {
  const access = effectiveAccess(user)
  const flags = Object.fromEntries(ALL_PERMISSIONS.map((p) => [p, access.permissions.includes(p)])) as Record<Permission, boolean>
  return { ...ROLES[user.role], ...flags, allowedViews: access.views }
}

export function validateAccess(access: UserAccess): string | null {
  return access.views.length === 0 ? 'El usuario necesita al menos una vista habilitada.' : null
}

/** ¿Los accesos difieren de la plantilla de su rol? (para mostrar "personalizado"). */
export function isCustomized(user: Pick<User, 'role' | 'access'>): boolean {
  if (isSuperadmin(user)) return false
  const a = effectiveAccess(user)
  const b = templateAccess(user.role)
  return a.views.join() !== b.views.join() || a.permissions.join() !== b.permissions.join()
}
