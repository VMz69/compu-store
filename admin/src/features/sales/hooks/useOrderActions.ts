import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { ensurePermission, usePermission } from '@/features/access'
import { openModal } from '@/shared/store/modal.store'
import { toast } from '@/shared/store/toast.store'
import { isInvoiceable, statusOptionLabel } from '../lib/order.service'
import { SALES_MODALS } from '../modals'
import { useSalesStore } from '../store'
import type { Order } from '../types'

/** Acciones sobre pedidos con validación de permisos. */
export function useOrderActions() {
  const statuses = useSalesStore((s) => s.statuses)
  const setOrderStatus = useSalesStore((s) => s.setOrderStatus)
  const canChangeStatus = usePermission('canChangeOrderStatus')
  const canInvoice = usePermission('canInvoice')
  const navigate = useNavigate()

  const statusOptions = useMemo(
    () => statuses.map((s) => ({ value: s.name, label: statusOptionLabel(s) })),
    [statuses],
  )

  const changeStatus = (orderId: string, status: string) => {
    if (!ensurePermission('canChangeOrderStatus', 'Su rol no puede modificar el estado de pedidos')) return
    setOrderStatus(orderId, status)
    toast(`Pedido ${orderId} actualizado a ${status}`, 'success')
  }

  return {
    canChangeStatus,
    canInvoice,
    isInvoiceable: (order: Order) => isInvoiceable(order),
    /** Lleva a Facturación con el modal de emisión de este pedido abierto. */
    invoice: (orderId: string) => navigate(`/facturacion?pedido=${orderId}`),
    /** Lleva a Facturación con el PDF de la factura abierto. */
    viewInvoice: (invoiceId: string) => navigate(`/facturacion?factura=${invoiceId}`),
    statusOptions,
    changeStatus,
    openCreate: () => openModal(SALES_MODALS.orderForm),
    openDetail: (orderId: string) => openModal(SALES_MODALS.orderDetail, orderId),
  }
}

export type OrderActions = ReturnType<typeof useOrderActions>
