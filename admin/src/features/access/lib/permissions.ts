import { toast } from '@/shared/store/toast.store'
import { ROLES } from '../mocks/roles.mock'
import { useAccessStore } from '../store'
import type { Permission, Role } from '../types'

/**
 * Rol de la sesión activa leído fuera de React (para hooks de acciones).
 * El rol se toma SIEMPRE del usuario vigente: si un administrador le cambia el
 * rol o lo desactiva, el cambio aplica de inmediato sin volver a iniciar sesión.
 */
export const getCurrentRole = (): Role | null => {
  const { session, users } = useAccessStore.getState()
  const user = session ? users.find((u) => u.id === session.userId) : undefined
  return user?.active ? ROLES[user.role] : null
}

/**
 * Guardia de permisos para hooks de acciones (regla 6 del blueprint):
 * la vista solo oculta botones; la validación real ocurre aquí.
 */
export const ensurePermission = (permission: Permission, deniedMessage: string): boolean => {
  if (getCurrentRole()?.[permission]) return true
  toast(deniedMessage, 'warning')
  return false
}
