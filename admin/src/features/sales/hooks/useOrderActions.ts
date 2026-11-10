import { useNavigate } from 'react-router-dom'
import { ensurePermission, usePermission, useSession } from '@/features/access'
import { getCatalogSnapshot } from '@/features/catalog'
import { askConfirm } from '@/shared/store/confirm.store'
import { openModal } from '@/shared/store/modal.store'
import { toast } from '@/shared/store/toast.store'
import { ACTION_TARGET, availableActions, statusOf, type OrderAction } from '../lib/orderFlow'
import { describeShortages, findShortages, reservedByProduct } from '../lib/stock'
import { SALES_MODALS } from '../modals'
import { useSalesStore } from '../store'
import type { Order } from '../types'

export interface OrderActionButton {
  action: OrderAction
  label: string
  icon: string
  tone: 'primary' | 'danger'
}

const BUTTONS: Record<OrderAction, Omit<OrderActionButton, 'action'>> = {
  confirm: { label: 'Confirmar', icon: 'fa-solid fa-box-open', tone: 'primary' },
  invoice: { label: 'Facturar', icon: 'fa-solid fa-file-invoice-dollar', tone: 'primary' },
  deliver: { label: 'Entregar', icon: 'fa-solid fa-truck-ramp-box', tone: 'primary' },
  cancel: { label: 'Cancelar', icon: 'fa-solid fa-ban', tone: 'danger' },
}

const DENIED = 'Su rol no puede modificar el estado de pedidos'

/**
 * Comandos del flujo de pedidos con validación de permisos y reglas de negocio.
 * Las reglas de transición viven en `lib/orderFlow`; aquí se orquestan los efectos.
 */
export function useOrderActions() {
  const navigate = useNavigate()
  const { user } = useSession()
  const transition = useSalesStore((s) => s.transition)
  const canChangeStatus = usePermission('canChangeOrderStatus')
  const canInvoice = usePermission('canInvoice')
  const by = user?.name ?? 'Equipo CompuStore'

  /** Confirmar = reservar stock. Se revalida con los datos más recientes. */
  const confirm = (order: Order): boolean => {
    if (!ensurePermission('canChangeOrderStatus', DENIED)) return false
    const orders = useSalesStore.getState().orders
    const shortages = findShortages(order.items, getCatalogSnapshot().products, reservedByProduct(orders, order.id))
    if (shortages.length) {
      toast(`No se puede confirmar ${order.id}: stock insuficiente. ${describeShortages(shortages)}`, 'warning')
      return false
    }
    const ok = transition(order.id, ACTION_TARGET.confirm, by)
    if (ok) toast(`Pedido ${order.id} confirmado · stock reservado`, 'success')
    return ok
  }

  const deliver = (order: Order) => {
    if (!ensurePermission('canChangeOrderStatus', DENIED)) return
    if (transition(order.id, ACTION_TARGET.deliver, by)) toast(`Pedido ${order.id} entregado al cliente`, 'success')
  }

  const cancel = (order: Order) =>
    askConfirm({
      title: `Cancelar pedido ${order.id}`,
      message:
        order.status === 'confirmado'
          ? `Se liberará el stock reservado para ${order.client}. Esta acción no se puede deshacer.`
          : `¿Cancelar el pedido de ${order.client}? Esta acción no se puede deshacer.`,
      confirmText: 'Cancelar pedido',
      onConfirm: () => {
        if (!ensurePermission('canChangeOrderStatus', DENIED)) return
        if (transition(order.id, ACTION_TARGET.cancel, by)) toast(`Pedido ${order.id} cancelado`, 'info')
      },
    })

  /** Facturar vive en Facturación: se abre su modal de emisión con este pedido. */
  const invoice = (order: Order) => navigate(`/facturacion?pedido=${order.id}`)

  const run = (action: OrderAction, order: Order) => {
    if (action === 'confirm') confirm(order)
    else if (action === 'deliver') deliver(order)
    else if (action === 'cancel') cancel(order)
    else invoice(order)
  }

  /** Botones aplicables al pedido según su estado y los permisos del rol. */
  const actionsFor = (order: Order): OrderActionButton[] =>
    availableActions(order)
      .filter((a) => (a === 'invoice' ? canInvoice : canChangeStatus))
      .map((action) => ({ action, ...BUTTONS[action] }))

  return {
    canChangeStatus,
    canInvoice,
    actionsFor,
    run,
    confirm,
    statusName: (order: Order) => statusOf(order.status).name,
    openCreate: () => navigate('/pedidos/nuevo'),
    openDetail: (orderId: string) => openModal(SALES_MODALS.orderDetail, orderId),
    /** Lleva a Facturación con el PDF de la factura abierto. */
    viewInvoice: (invoiceId: string) => navigate(`/facturacion?factura=${invoiceId}`),
  }
}

export type OrderActions = ReturnType<typeof useOrderActions>
