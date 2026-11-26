import type { CartItem, CartLineStatus, ValidatedCartLine } from '@/07-pipeline-estado-carrito/00-director-estado-carrito'
import type { CarritoValidadoApi, EstadoLineaApi } from './02-adaptadores'
import { enviar } from './01-cliente-api'

const ESTADOS: Record<EstadoLineaApi, CartLineStatus> = {
  ok: 'ok',
  ajustada: 'adjusted',
  agotado: 'sold-out',
  'no-disponible': 'unavailable',
}

/**
 * Recalcula en el servidor precios y existencias del carrito antes de WhatsApp.
 * Solo viajan id y cantidad (el servidor ignora precios del navegador); no crea
 * pedidos ni reserva stock.
 */
export async function validarCarrito(items: CartItem[]): Promise<ValidatedCartLine[]> {
  const respuesta = await enviar<CarritoValidadoApi>('/tienda/carrito/validar', {
    lineas: items.map((item) => ({ productoId: item.product.id, cantidad: item.quantity })),
  })
  return respuesta.lineas.map((linea) => ({
    productId: linea.productoId,
    name: linea.nombre,
    unitPrice: linea.precioUnitario === null ? null : Number(linea.precioUnitario),
    available: linea.cantidadDisponible,
    status: ESTADOS[linea.estado],
  }))
}
