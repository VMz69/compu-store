import { z } from 'zod'
import { esquemaPaginacion } from '../04-pipeline-http/00-director-http.js'
import { ESTADOS_PEDIDO } from './02-ajustes-ventas.schema.js'
import { DESTINOS_MANUALES } from './05-flujo.js'

/**
 * Pedido (L13): reglas de `validateOrder` y `validateCharges` del admin. Los cuerpos son estrictos:
 * precios, importes y totales del navegador se rechazan (400), porque los calcula el servidor.
 */

/** Número o string decimal con hasta 2 decimales → string (D-05). */
const decimal = (mensaje: string) =>
  z
    .union([z.number(), z.string()])
    .transform((valor) => String(valor).trim())
    .pipe(z.string().regex(/^\d{1,9}(\.\d{1,2})?$/, mensaje))

/** Línea de pedido o cotización (L16 la comparte): el precio lo pone el servidor. */
export const esquemaLinea = z.strictObject({
  productoId: z.number().int().positive('Producto no válido.'),
  cantidad: z.number().int().min(1, 'Cantidad mínima: 1.').max(9999, 'Cantidad máxima: 9999.'),
  descuento: decimal('Descuento inválido (0–100, hasta 2 decimales).')
    .refine((d) => Number(d) <= 100, 'El descuento no puede superar 100 %.')
    .default('0'),
})

/** = `CHARGE_LIMITS` del admin. */
export const esquemaCargo = z.strictObject({
  concepto: z.string().trim().min(3, 'Describe el cargo (mín. 3 letras).').max(60, 'Máximo 60 caracteres.'),
  monto: decimal('Monto inválido (ej. 3.50).')
    .refine((m) => Number(m) > 0, 'Debe ser mayor que $0.')
    .refine((m) => Number(m) <= 2000, 'Máximo $2000 por cargo.'),
})

/** Cliente ocasional (sin ficha en el directorio). */
export const esquemaClienteOcasional = z.strictObject({
  nombre: z.string().trim().min(3, 'Mínimo 3 caracteres.').max(100, 'Máximo 100 caracteres.'),
  telefono: z.string().trim().regex(/^[0-9+\-\s]{8,15}$/, 'Teléfono obligatorio (ej. 7038-8225).'),
  correo: z
    .string()
    .trim()
    .toLowerCase()
    .max(254)
    .refine((c) => c === '' || /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(c), 'Correo no válido.')
    .default(''),
})

/** Alta y edición (la edición reemplaza todos los datos editables). */
export const esquemaPedido = z
  .strictObject({
    clienteId: z.number().int().positive().nullable().default(null),
    cliente: esquemaClienteOcasional.optional(),
    ciudad: z.string().trim().max(80, 'Máximo 80 caracteres.').default(''),
    canalId: z.number({ error: 'Selecciona el canal de venta.' }).int().positive(),
    formaPago: z.string().trim().min(1, 'Selecciona la forma de pago.').max(60),
    formaEntrega: z.string().trim().min(1, 'Indica la forma de entrega.').max(120),
    notas: z.string().trim().max(2000, 'Máximo 2000 caracteres.').default(''),
    lineas: z.array(esquemaLinea).min(1, 'Agrega al menos un producto.').max(50, 'Máximo 50 productos.'),
    cargos: z.array(esquemaCargo).max(6, 'Máximo 6 cargos extra por documento.').default([]),
  })
  .superRefine((p, ctx) => {
    if (p.clienteId === null && !p.cliente) ctx.addIssue({ code: 'custom', path: ['cliente'], message: 'Indica el cliente.' })
    if (p.clienteId !== null && p.cliente) {
      ctx.addIssue({ code: 'custom', path: ['cliente'], message: 'Envía el cliente del directorio o uno ocasional, no ambos.' })
    }
    const ids = p.lineas.map((l) => l.productoId)
    if (new Set(ids).size !== ids.length) ctx.addIssue({ code: 'custom', path: ['lineas'], message: 'Un producto aparece repetido.' })
  })

export const esquemaIdPedido = z.object({ id: z.coerce.number().int().positive('Id no válido.') })

export const esquemaCambioEstado = z.strictObject({
  estado: z.enum(DESTINOS_MANUALES),
  nota: z.string().trim().max(255, 'Máximo 255 caracteres.').optional(),
})

export const esquemaEliminarPedido = z.strictObject({
  motivo: z.string().trim().min(5, 'Indica el motivo (mín. 5 caracteres).').max(200, 'Máximo 200 caracteres.'),
})

export const esquemaListarPedidos = esquemaPaginacion.extend({ estado: z.enum(ESTADOS_PEDIDO).optional() })

/** «Confirmar y reservar» (L14): último día de la reserva; el rango (hoy … hoy + 15) lo valida el service (422). */
export const esquemaReserva = z.strictObject({
  hasta: z.iso.date('Fecha no válida (AAAA-MM-DD).'),
})

export type DatosPedido = z.infer<typeof esquemaPedido>
export type CambioEstado = z.infer<typeof esquemaCambioEstado>
export type ListarPedidos = z.infer<typeof esquemaListarPedidos>
export type Reserva = z.infer<typeof esquemaReserva>
