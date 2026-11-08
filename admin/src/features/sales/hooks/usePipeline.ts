import { useMemo } from 'react'
import { closeModal, openModal, useModalPayload } from '@/shared/store/modal.store'
import { countByStatus } from '../lib/order.service'
import { SALES_MODALS } from '../modals'
import { useSalesStore } from '../store'
import { useShowOrdersByStatus } from './useOrders'

const CANCEL_FALLBACK = { name: 'Cancelado', icon: 'fa-ban' }

/** Pipeline secuencial de estados + rama terminal de cancelación + tabla de criterios. */
export function usePipeline() {
  const statuses = useSalesStore((s) => s.statuses)
  const orders = useSalesStore((s) => s.orders)
  const showOrders = useShowOrdersByStatus()

  return useMemo(() => {
    const withCount = statuses.map((status) => ({ status, count: countByStatus(orders, status.name) }))
    const cancel = statuses.find((s) => s.step === 0) ?? CANCEL_FALLBACK
    return {
      steps: withCount.filter((x) => x.status.step > 0).sort((a, b) => a.status.step - b.status.step),
      cancel: { name: cancel.name, icon: cancel.icon, count: countByStatus(orders, cancel.name) },
      criteria: withCount,
      showOrders,
      openDetail: (statusName: string) => openModal(SALES_MODALS.statusDetail, statusName),
    }
  }, [statuses, orders, showOrders])
}

export type PipelineApi = ReturnType<typeof usePipeline>

/** Detalle de un estado operativo (payload = nombre del estado). */
export function useStatusDetail() {
  const statusName = useModalPayload<string>()
  const status = useSalesStore((s) => s.statuses.find((x) => x.id === statusName || x.name === statusName))
  const orders = useSalesStore((s) => s.orders)
  const showOrders = useShowOrdersByStatus()

  const inStatus = useMemo(
    () => (status ? orders.filter((o) => o.status === status.name) : []),
    [orders, status],
  )

  if (!status) return null

  return {
    status,
    orders: inStatus,
    onClose: closeModal,
    onShowOrders: () => {
      closeModal()
      showOrders(status.name)
    },
  }
}
