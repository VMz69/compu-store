import { ROLES } from '../mocks/roles.mock'
import { useAccessStore } from '../store'
import type { Permission, ViewId } from '../types'

/**
 * Sesión activa: colaborador + rol resuelto.
 * Un usuario desactivado o eliminado deja de estar autenticado al instante.
 */
export function useSession() {
  const session = useAccessStore((s) => s.session)
  const user = useAccessStore((s) => (session ? s.users.find((u) => u.id === session.userId) : undefined))

  const isAuthenticated = Boolean(user?.active)
  const role = isAuthenticated && user ? ROLES[user.role] : null

  return {
    isAuthenticated,
    user: isAuthenticated ? (user ?? null) : null,
    role,
    /** El usuario debe definir una contraseña propia antes de continuar. */
    mustChangePassword: Boolean(isAuthenticated && user?.mustChangePassword),
  }
}

/** ¿El rol activo tiene el permiso? (solo para ocultar controles en la vista). */
export function usePermission(permission: Permission): boolean {
  return useSession().role?.[permission] ?? false
}

/** Ruta de inicio del rol activo (primera vista permitida). */
export function useHomePath(): string {
  const { role } = useSession()
  return role ? `/${role.allowedViews[0]}` : '/login'
}

/** Acceso a una vista concreta, usado por el guard de rutas. */
export function useViewAccess(view: ViewId) {
  const { role } = useSession()
  const homePath = useHomePath()
  return { allowed: role?.allowedViews.includes(view) ?? false, homePath }
}
