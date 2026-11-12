import { addDaysISO, daysBetweenISO, todayISO } from '@/71-pipeline-seleccion-fechas/05-date'
import type { Order } from '../types'

/**
 * Reserva de stock del pedido (acción "Confirmar y reservar").
 *
 *  · Al confirmar, el usuario elige la vigencia (fecha límite, inclusive hasta 23:59).
 *  · Mientras está vigente, las unidades del pedido quedan apartadas:
 *    disponible = existencias − reservado. Si el disponible llega a 0, el producto no
 *    puede agregarse a otro pedido y (cuando exista la API) se oculta en el Front Office.
 *  · Si vence sin avanzar a "Facturado", la reserva se libera sola y el pedido vuelve a
 *    "Registrado" (para reservar de nuevo o cancelarlo). Ver `expireReservations` del store.
 */
export const RESERVATION = {
  /** Vigencia sugerida al abrir el modal. */
  defaultDays: 3,
  /** Vigencia máxima permitida (evita inmovilizar mercadería). */
  maxDays: 15,
} as const

/** Límites del calendario: desde hoy hasta hoy + máximo. */
export function reservationBounds(today = todayISO()) {
  return { min: today, max: addDaysISO(today, RESERVATION.maxDays), suggested: addDaysISO(today, RESERVATION.defaultDays) }
}

export function validateReservationDate(until: string, today = todayISO()): string | null {
  const { min, max } = reservationBounds(today)
  if (!until) return 'Elige hasta cuándo se reserva.'
  if (until < min) return 'La fecha no puede ser anterior a hoy.'
  if (until > max) return `Máximo ${RESERVATION.maxDays} días de reserva.`
  return null
}

/** ¿La reserva del pedido sigue vigente hoy? (vence al terminar el día límite). */
export const isReservationActive = (order: Pick<Order, 'status' | 'reservedUntil'>, today = todayISO()): boolean =>
  order.status === 'confirmado' && (!order.reservedUntil || order.reservedUntil >= today)

/** Pedidos reservados cuya fecha límite ya pasó (deben volver a "Registrado"). */
export const expiredReservations = (orders: Order[], today = todayISO()): Order[] =>
  orders.filter((o) => o.status === 'confirmado' && !o.invoiceId && Boolean(o.reservedUntil) && (o.reservedUntil as string) < today)

/** Días restantes (0 = vence hoy). */
export const reservationDaysLeft = (until: string, today = todayISO()): number => daysBetweenISO(today, until)

/** Texto corto para listas: "Vence hoy" · "Vence mañana" · "Quedan 3 días". */
export function reservationLabel(until: string | null, today = todayISO()): string | null {
  if (!until) return null
  const left = reservationDaysLeft(until, today)
  return left < 0 ? 'Vencida' : left === 0 ? 'Vence hoy' : left === 1 ? 'Vence mañana' : `Quedan ${left} días`
}
