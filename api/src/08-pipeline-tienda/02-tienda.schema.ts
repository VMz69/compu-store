import { z } from 'zod'

export const MAX_LINEAS_CARRITO = 50
export const MAX_CANTIDAD_LINEA = 99

/** Solo id y cantidad: precios y totales del navegador se rechazan (§3.3, contratos-A §4.5). */
const linea = z.strictObject({
  productoId: z.number().int('Id no válido.').positive('Id no válido.'),
  cantidad: z
    .number()
    .int('Debe ser un entero.')
    .min(1, 'Mínimo 1 unidad.')
    .max(MAX_CANTIDAD_LINEA, `Máximo ${MAX_CANTIDAD_LINEA} unidades por producto.`),
})

export const esquemaValidarCarrito = z.strictObject({
  lineas: z
    .array(linea)
    .min(1, 'El carrito está vacío.')
    .max(MAX_LINEAS_CARRITO, `Máximo ${MAX_LINEAS_CARRITO} productos por carrito.`)
    .refine((lineas) => new Set(lineas.map((l) => l.productoId)).size === lineas.length, 'Hay productos repetidos en el carrito.'),
})

export type ValidarCarrito = z.infer<typeof esquemaValidarCarrito>
export type LineaCarrito = ValidarCarrito['lineas'][number]
