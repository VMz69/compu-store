import { useState } from 'react'
import { ensurePermission, useSession } from '@/00-director-acceso'
import { useCatalogStore } from '@/00-director-catalogo'
import { addDaysISO, formatLongISO, todayISO } from '@/shared/lib/date'
import { closeModal, useModalPayload } from '@/shared/store/modal.store'
import { toast } from '@/shared/store/toast.store'
import { RESERVATION, reservationBounds, reservationDaysLeft, validateReservationDate } from '../lib/reservation'
import { describeShortages, findShortages, reservedByProduct } from '../lib/stock'
import { useSalesStore } from '../store'

/** Atajos de vigencia (días desde hoy) mostrados como chips. */
const QUICK_DAYS = [1, 3, 7, RESERVATION.maxDays]

/**
 * Modal "Confirmar y reservar" (payload = id del pedido): el usuario elige hasta cuándo
 * se aparta el stock. Se revalida el disponible con los datos más recientes al confirmar.
 */
export function useReserveOrder() {
  const orderId = useModalPayload<string>()
  const order = useSalesStore((s) => s.orders.find((o) => o.id === orderId))
  const orders = useSalesStore((s) => s.orders)
  const reserve = useSalesStore((s) => s.reserve)
  const products = useCatalogStore((s) => s.products)
  const { user } = useSession()
  const today = todayISO()
  const bounds = reservationBounds(today)
  const [until, setUntil] = useState(bounds.suggested)

  // Disponible para ESTE pedido: existencias − lo reservado por otros pedidos vigentes.
  const shortages = order ? findShortages(order.items, products, reservedByProduct(orders, order.id, today)) : []
  const error = validateReservationDate(until, today)
  const days = reservationDaysLeft(until, today)

  const submit = () => {
    if (!order || error) return
    if (!ensurePermission('canReserveOrders', 'No tienes permiso para confirmar y reservar pedidos.')) return
    const latest = useSalesStore.getState().orders
    const latestShortages = findShortages(order.items, useCatalogStore.getState().products, reservedByProduct(latest, order.id, today))
    if (latestShortages.length) return toast(`Stock insuficiente para reservar: ${describeShortages(latestShortages)}`, 'warning')
    try {
      reserve(order.id, until, user?.name ?? 'Equipo CompuStore')
      closeModal()
      toast(`Pedido ${order.id} reservado hasta ${formatLongISO(until)}`, 'success')
    } catch (e) {
      toast(e instanceof Error ? e.message : 'No se pudo reservar el pedido.', 'danger')
    }
  }

  return {
    order: order ?? null,
    /** Ya no se puede reservar (cambió de estado mientras el modal estaba abierto). */
    blocked: order && order.status !== 'registrado' ? 'El pedido ya no está en estado Registrado.' : null,
    units: order ? order.items.reduce((acc, i) => acc + i.quantity, 0) : 0,
    until,
    setUntil,
    bounds,
    today,
    quick: QUICK_DAYS.map((n) => ({ days: n, iso: addDaysISO(today, n), active: addDaysISO(today, n) === until })),
    summary: error ? null : { date: formatLongISO(until), daysLabel: days === 0 ? 'vence hoy a las 23:59' : `${days} día(s) · hasta las 23:59` },
    error,
    shortages,
    submit,
    onClose: closeModal,
  }
}

export type ReserveOrderApi = ReturnType<typeof useReserveOrder>
