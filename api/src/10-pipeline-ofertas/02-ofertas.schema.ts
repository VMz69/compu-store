import { z } from 'zod'
import { esquemaPaginacion } from '../04-pipeline-http/00-director-http.js'

/**
 * Reglas de `validateOffer` del admin (`admin/src/54-pipeline-precio-ofertas/02-offerPricing.ts`).
 * Las que combinan campos (porcentaje ≤ 90, fin ≥ inicio) se comprueban en el service con los
 * valores resultantes, porque al editar puede llegar solo uno de ellos.
 */
export const TIPOS_DESCUENTO = ['porcentaje', 'monto'] as const
export type TipoDescuento = (typeof TIPOS_DESCUENTO)[number]

const titulo = z.string().trim().min(3, 'Ingresa un nombre (mín. 3 caracteres).').max(80, 'Máximo 80 caracteres.')
const etiqueta = z.string().trim().max(40, 'Máximo 40 caracteres.')
const descripcion = z.string().trim().max(500, 'Máximo 500 caracteres.')
/** % o $ como string decimal (D-05), mayor que 0. */
const valor = z
  .string()
  .trim()
  .regex(/^\d{1,10}(\.\d{1,2})?$/, 'Descuento no válido (ej. "15" o "25.00").')
  .refine((v) => Number(v) > 0, 'El descuento debe ser mayor que 0.')
/** Fecha de calendario `YYYY-MM-DD` válida. */
const fecha = z.iso.date('Fecha no válida (AAAA-MM-DD).')
const productoIds = z
  .array(z.number().int().positive())
  .min(1, 'Agrega al menos un producto.')
  .max(200, 'Máximo 200 productos.')
  .refine((ids) => new Set(ids).size === ids.length, 'Hay productos repetidos.')

export const esquemaCrearOferta = z.strictObject({
  titulo,
  etiqueta: etiqueta.default(''),
  descripcion: descripcion.default(''),
  tipoDescuento: z.enum(TIPOS_DESCUENTO),
  valor,
  inicio: fecha,
  fin: fecha,
  productoIds,
  pausada: z.boolean().default(false),
})

export const esquemaEditarOferta = z.strictObject({
  titulo: titulo.optional(),
  etiqueta: etiqueta.optional(),
  descripcion: descripcion.optional(),
  tipoDescuento: z.enum(TIPOS_DESCUENTO).optional(),
  valor: valor.optional(),
  inicio: fecha.optional(),
  fin: fecha.optional(),
  productoIds: productoIds.optional(),
  pausada: z.boolean().optional(),
})

export const esquemaPausa = z.strictObject({ pausada: z.boolean() })

export const esquemaIdOferta = z.object({ id: z.coerce.number().int().positive('Id no válido.') })

export const esquemaListarOfertas = esquemaPaginacion

export type CrearOferta = z.infer<typeof esquemaCrearOferta>
export type EditarOferta = z.infer<typeof esquemaEditarOferta>
export type ListarOfertas = z.infer<typeof esquemaListarOfertas>
