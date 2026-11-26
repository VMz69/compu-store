import { z } from 'zod'
import { esquemaContrasena, ROLES } from './02-acceso.schema.js'
import { ACCIONES, VISTAS } from './06-permisos.catalogo.js'

/** Mismas reglas que `useUserForm` del admin (08-pipeline-edicion-usuarios/02-useUserForm.ts). */
const nombre = z.string().trim().min(3, 'Ingresa el nombre completo.').max(80, 'Máximo 80 caracteres.')
const correo = z.string().trim().toLowerCase().max(254).email('Correo no válido.')
/** Vacío o null = sin teléfono. */
const telefono = z
  .union([z.literal(''), z.null(), z.string().trim().regex(/^[0-9+\-\s]{8,15}$/, 'Teléfono no válido (ej. 7038-8225).')])
  .transform((valor) => (valor ? valor : null))
const rol = z.enum(ROLES)

export const esquemaIdUsuario = z.object({ id: z.coerce.number().int().positive() })

export const esquemaCrearUsuario = z.strictObject({
  nombre,
  correo,
  telefono: telefono.optional().transform((valor) => valor ?? null),
  rol,
  activo: z.boolean().default(true),
  contrasena: esquemaContrasena,
  debeCambiarContrasena: z.boolean().default(true),
})
export type CrearUsuario = z.infer<typeof esquemaCrearUsuario>

export const esquemaEditarUsuario = z
  .strictObject({ nombre, correo, telefono, rol, activo: z.boolean() })
  .partial()
  .refine((cambios) => Object.keys(cambios).length > 0, 'No hay cambios.')
export type EditarUsuario = z.infer<typeof esquemaEditarUsuario>

export const esquemaAccesos = z.strictObject({
  vistas: z.array(z.enum(VISTAS)).max(VISTAS.length),
  acciones: z.array(z.enum(ACCIONES)).max(ACCIONES.length),
})
export type AccesosEntrada = z.infer<typeof esquemaAccesos>

export const esquemaRestablecerContrasena = z.strictObject({
  contrasena: esquemaContrasena,
  debeCambiarContrasena: z.boolean(),
})
export type RestablecerContrasena = z.infer<typeof esquemaRestablecerContrasena>
