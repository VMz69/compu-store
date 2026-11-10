import { toast } from '@/shared/store/toast.store'
import { useAccessStore } from '../store'
import type { Permission, Role } from '../types'
import { effectiveRole } from './access'

/**
 * Rol de la sesión activa leído fuera de React (para hooks de acciones).
 * Se toma SIEMPRE del usuario vigente (rol + sus accesos por vista): si un administrador
 * le cambia los accesos o lo desactiva, aplica de inmediato sin volver a iniciar sesión.
 */
export const getCurrentRole = (): Role | null => {
  const { session, users } = useAccessStore.getState()
  const user = session ? users.find((u) => u.id === session.userId) : undefined
  return user?.active ? effectiveRole(user) : null
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
