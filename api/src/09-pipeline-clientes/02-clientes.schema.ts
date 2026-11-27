import { z } from 'zod'
import { esquemaPaginacion } from '../04-pipeline-http/00-director-http.js'

/**
 * Reglas de `validateCustomer` del admin (`admin/src/30-pipeline-registro-clientes/03-customer.service.ts`).
 * El documento se valida contra el tipo en el service, porque al editar el tipo puede venir solo.
 */
export const TIPOS_CLIENTE = ['persona', 'empresa'] as const
export type TipoCliente = (typeof TIPOS_CLIENTE)[number]

/** DUI salvadoreño: 8 dígitos, guion, 1 dígito verificador. */
export const PATRON_DUI = /^\d{8}-\d$/
/** NIT salvadoreño: 0000-000000-000-0. */
export const PATRON_NIT = /^\d{4}-\d{6}-\d{3}-\d$/

/** Vacío o null = sin valor. */
const opcional = (esquema: z.ZodString) =>
  z.union([z.literal(''), z.null(), esquema]).transform((valor) => (valor ? valor : null))

const nombre = z.string().trim().min(3, 'Mínimo 3 caracteres.').max(100, 'Máximo 100 caracteres.')
const telefono = z.string().trim().regex(/^[0-9+\-\s]{8,15}$/, 'Teléfono obligatorio (ej. 7038-8225).')
const correo = opcional(
  z.string().trim().toLowerCase().max(254).regex(/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/, 'Correo no válido.'),
)
const documento = opcional(z.string().trim().max(17))
const ciudad = z.string().trim().max(80, 'Máximo 80 caracteres.')
const direccion = z.string().trim().max(255, 'Máximo 255 caracteres.')
const notas = z.string().trim().max(2000, 'Máximo 2000 caracteres.')

export const esquemaCrearCliente = z.strictObject({
  tipo: z.enum(TIPOS_CLIENTE),
  nombre,
  documento: documento.default(null),
  telefono,
  correo: correo.default(null),
  ciudad: ciudad.default(''),
  direccion: direccion.default(''),
  notas: notas.default(''),
  activo: z.boolean().default(true),
})

export const esquemaEditarCliente = z.strictObject({
  tipo: z.enum(TIPOS_CLIENTE).optional(),
  nombre: nombre.optional(),
  documento: documento.optional(),
  telefono: telefono.optional(),
  correo: correo.optional(),
  ciudad: ciudad.optional(),
  direccion: direccion.optional(),
  notas: notas.optional(),
  activo: z.boolean().optional(),
})

export const esquemaIdCliente = z.object({ id: z.coerce.number().int().positive('Id no válido.') })

/** Búsqueda del directorio: `q` como el buscador del admin, más tipo, estado y paginación (D-06). */
export const esquemaListarClientes = esquemaPaginacion.extend({
  q: z.string().trim().max(100).default(''),
  tipo: z.enum(TIPOS_CLIENTE).optional(),
  estado: z.enum(['activos', 'inactivos']).optional(),
})

export type CrearCliente = z.infer<typeof esquemaCrearCliente>
export type EditarCliente = z.infer<typeof esquemaEditarCliente>
export type ListarClientes = z.infer<typeof esquemaListarClientes>
