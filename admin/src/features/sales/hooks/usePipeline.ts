import { useMemo } from 'react'
import { closeModal, openModal, useModalPayload } from '@/shared/store/modal.store'
import { countByStatus } from '../lib/order.service'
import { isOrderStatusId, ORDER_STATUSES, statusOf } from '../lib/orderFlow'
import { SALES_MODALS } from '../modals'
import { useSalesStore } from '../store'
import type { OrderStatusId } from '../types'
import { useShowOrdersByStatus } from './useOrders'

const CANCEL = statusOf('cancelado')

/** Flujo secuencial de estados + rama terminal de cancelación + tabla de criterios. */
export function usePipeline() {
  const orders = useSalesStore((s) => s.orders)
  const showOrders = useShowOrdersByStatus()

  return useMemo(() => {
    const withCount = ORDER_STATUSES.map((status) => ({
      status,
      count: countByStatus(orders, status.id),
      nextNames: status.next.map((id) => statusOf(id).name),
    }))
    return {
      steps: withCount.filter((x) => x.status.step > 0).sort((a, b) => a.status.step - b.status.step),
      cancel: { id: CANCEL.id, name: CANCEL.name, icon: CANCEL.icon, count: countByStatus(orders, CANCEL.id) },
      criteria: withCount,
      showOrders,
      openDetail: (statusId: OrderStatusId) => openModal(SALES_MODALS.statusDetail, statusId),
    }
  }, [orders, showOrders])
}

export type PipelineApi = ReturnType<typeof usePipeline>

/** Detalle de un estado del flujo (payload = id del estado). */
export function useStatusDetail() {
  const statusId = useModalPayload<string>()
  const orders = useSalesStore((s) => s.orders)
  const showOrders = useShowOrdersByStatus()
  const status = isOrderStatusId(statusId) ? statusOf(statusId) : null

  const inStatus = useMemo(() => (status ? orders.filter((o) => o.status === status.id) : []), [orders, status])

  if (!status) return null

  return {
    status,
    nextNames: status.next.map((id) => statusOf(id).name),
    orders: inStatus,
    onClose: closeModal,
    onShowOrders: () => {
      closeModal()
      showOrders(status.id)
    },
  }
}
