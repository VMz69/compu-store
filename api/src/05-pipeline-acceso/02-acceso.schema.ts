import { z } from 'zod'

/** Roles del admin (`RoleId` en admin/src/06-pipeline-sesion-permisos/05-types.ts). En L09 pasan a tabla. */
export const ROLES = ['superadmin', 'gerencia', 'administracion', 'caja_inventario', 'servicio_cliente'] as const
export type Rol = (typeof ROLES)[number]

/** Misma política que `checkPassword` del admin; el símbolo es solo recomendado. */
export const esquemaContrasena = z
  .string()
  .min(8, 'Mínimo 8 caracteres.')
  .max(128, 'Máximo 128 caracteres.')
  .regex(/[a-z]/, 'Debe incluir una minúscula.')
  .regex(/[A-Z]/, 'Debe incluir una mayúscula.')
  .regex(/\d/, 'Debe incluir un número.')

export const esquemaCambioContrasena = z.strictObject({ contrasena: esquemaContrasena })
export type CambioContrasena = z.infer<typeof esquemaCambioContrasena>
