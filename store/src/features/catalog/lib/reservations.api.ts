import type { Product } from '@/shared/types'

/**
 * Regla de negocio: productos RESERVADOS por pedidos del back office.
 *
 * ⚠️ AÚN NO EXISTE LA API: este archivo solo documenta la regla y deja el código
 * comentado para conectarlo después. Hoy el Front Office no conoce las reservas.
 *
 * Origen (back office /admin › Pedidos › "Confirmar y reservar"):
 *  · Un pedido "Reservado" aparta sus unidades hasta una fecha límite (máx. 15 días).
 *  · disponible = stock − unidades reservadas por pedidos con reserva VIGENTE.
 *  · Si la reserva vence sin facturarse, se libera sola y el pedido vuelve a "Registrado".
 *
 * Regla para el Front Office:
 *  · Si `disponible === 0` (todo el stock está reservado), el producto se OCULTA
 *    temporalmente del catálogo, búsquedas, ofertas y relacionados.
 *  · Si queda disponible > 0, se muestra con ese disponible como stock (no con el total).
 *  · Al vencer o liberarse la reserva, vuelve a mostrarse solo (el servidor recalcula).
 *
 * Endpoint propuesto:
 *  · GET /api/products/availability → { [productId]: { stock, reserved, available } }
 *    (o el catálogo público ya devuelve `available` calculado por el servidor).
 */

/** Disponibilidad pública de un producto según las reservas vigentes. */
export interface ProductAvailability {
  stock: number
  reserved: number
  available: number
}

// const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
//
// export async function fetchAvailability(): Promise<Record<number, ProductAvailability>> {
//   const res = await fetch(`${API_URL}/api/products/availability`)
//   if (!res.ok) throw new Error('No se pudo consultar la disponibilidad.')
//   return res.json()
// }
//
// /** Aplica la regla: oculta lo que no tiene disponible y usa el disponible como stock. */
// export const applyReservations = (products: Product[], availability: Record<number, ProductAvailability>): Product[] =>
//   products
//     // Solo se oculta lo agotado POR RESERVAS (un agotado normal sigue con su lógica actual).
//     .filter((p) => !(availability[p.id] && availability[p.id].reserved > 0 && availability[p.id].available === 0))
//     .map((p) => (availability[p.id] ? { ...p, stock: availability[p.id].available } : p))

/** Placeholder sin efecto mientras no exista la API (devuelve los productos tal cual). */
export const applyReservations = (products: Product[]): Product[] => products
