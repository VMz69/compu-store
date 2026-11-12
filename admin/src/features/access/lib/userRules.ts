import type { RoleId, User } from '../types'

/**
 * Reglas de negocio de usuarios. Funciones puras: se usan tanto para ocultar
 * o deshabilitar acciones en la vista como para validar en los hooks.
 *
 * Todas devuelven `null` si la acción está permitida o el motivo si no lo está.
 */

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export const isValidEmail = (email: string): boolean => EMAIL_PATTERN.test(email.trim())

export const normalizeEmail = (email: string): string => email.trim().toLowerCase()

/** ¿El correo ya pertenece a otro usuario? (el correo es el login, debe ser único). */
export const isEmailTaken = (email: string, users: User[], exceptId?: number): boolean =>
  users.some((u) => u.id !== exceptId && normalizeEmail(u.email) === normalizeEmail(email))

const activeSuperadmins = (users: User[]) => users.filter((u) => u.role === 'superadmin' && u.active)

/** El sistema nunca puede quedarse sin un Superadmin activo. */
const isLastActiveSuperadmin = (target: User, users: User[]): boolean =>
  target.role === 'superadmin' && target.active && activeSuperadmins(users).length === 1

export function deleteBlockReason(target: User, currentUserId: number | null, users: User[]): string | null {
  if (target.id === currentUserId) return 'No puedes eliminar tu propia cuenta.'
  if (isLastActiveSuperadmin(target, users)) return 'Es el único Superadmin activo.'
  return null
}

export function deactivateBlockReason(target: User, currentUserId: number | null, users: User[]): string | null {
  if (!target.active) return null // reactivar siempre está permitido
  if (target.id === currentUserId) return 'No puedes desactivar tu propia cuenta.'
  if (isLastActiveSuperadmin(target, users)) return 'Es el único Superadmin activo.'
  return null
}

/** Cambiar el rol o desactivar al último Superadmin dejaría el sistema sin administrador. */
export function roleChangeBlockReason(target: User, nextRole: RoleId, nextActive: boolean, users: User[]): string | null {
  const losesSuperadmin = nextRole !== 'superadmin' || !nextActive
  if (losesSuperadmin && isLastActiveSuperadmin(target, users)) {
    return 'Debe existir al menos un Superadmin activo.'
  }
  return null
}

/** Iniciales del nombre (implementación compartida con los avatares generados). */
export { initialsOf } from '@/81-pipeline-visualizacion-imagenes/05-initialsAvatar'
