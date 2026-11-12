/** Claves de modales del feature (resueltas por el ModalHost de la app). */
export const ACCESS_MODALS = {
  /** Alta/edición de usuario. Payload: `User` a editar o `null`. */
  userForm: 'user-form',
  /** Restablecer contraseña. Payload: id numérico del usuario. */
  resetPassword: 'user-reset-password',
} as const
