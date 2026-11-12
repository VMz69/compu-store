import { useNavigate } from 'react-router-dom'
import { ensurePermission, usePermission, useSession } from '@/00-director-acceso'
import { askConfirm } from '@/shared/store/confirm.store'
import { openModal } from '@/shared/store/modal.store'
import { toast } from '@/shared/store/toast.store'
import { ACTION_TARGET, availableActions, deleteBlockedReason, isDeletable, statusOf, type OrderAction } from '../lib/orderFlow'
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
  confirm: { label: 'Confirmar y reservar', icon: 'fa-solid fa-lock', tone: 'primary' },
  invoice: { label: 'Facturar', icon: 'fa-solid fa-file-invoice-dollar', tone: 'primary' },
  deliver: { label: 'Entregar', icon: 'fa-solid fa-truck-ramp-box', tone: 'primary' },
  cancel: { label: 'Cancelar', icon: 'fa-solid fa-ban', tone: 'danger' },
}

const DENIED = 'No tienes permiso para gestionar pedidos.'

/**
 * Comandos del flujo de pedidos con validación de permisos y reglas de negocio.
 * Las reglas de transición viven en `lib/orderFlow`; aquí se orquestan los efectos.
 */
export function useOrderActions() {
  const navigate = useNavigate()
  const { user } = useSession()
  const transition = useSalesStore((s) => s.transition)
  const deleteOrder = useSalesStore((s) => s.deleteOrder)
  const canChangeStatus = usePermission('canChangeOrderStatus')
  const canReserve = usePermission('canReserveOrders')
  const canDeleteOrders = usePermission('canDeleteOrders')
  const canInvoice = usePermission('canInvoice')
  const by = user?.name ?? 'Equipo CompuStore'

  /**
   * "Confirmar y reservar": abre el modal donde se elige la vigencia de la reserva.
   * La validación de stock y el cambio de estado ocurren al confirmar (useReserveOrder).
   */
  const confirm = (order: Order) => {
    if (!ensurePermission('canReserveOrders', 'No tienes permiso para confirmar y reservar pedidos.')) return
    openModal(SALES_MODALS.reserveOrder, order.id)
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

  /**
   * Eliminar (LÓGICO): pide un motivo obligatorio para la auditoría. El pedido sale de
   * los listados, métricas y reservas de stock, pero se conserva en la papelera del store.
   * `onDone` permite a la vista cerrarse o navegar tras eliminar.
   */
  const remove = (order: Order, onDone?: () => void) => {
    const blocked = deleteBlockedReason(order)
    if (blocked) return toast(blocked, 'warning')
    askConfirm({
      title: `Eliminar pedido ${order.id}`,
      message:
        (order.status === 'confirmado' ? 'Se liberará el stock reservado. ' : '') +
        `El pedido de ${order.client} dejará de aparecer en Pedidos y en los reportes. Queda archivado para auditoría.`,
      confirmText: 'Eliminar pedido',
      reason: { label: 'Motivo de la eliminación', placeholder: 'Ej. Pedido duplicado por error', minLength: 5 },
      onConfirm: (reason) => {
        if (!ensurePermission('canDeleteOrders', 'No tienes permiso para eliminar pedidos')) return
        try {
          deleteOrder(order.id, by, reason)
          toast(`Pedido ${order.id} eliminado`, 'info')
          onDone?.()
        } catch (error) {
          toast(error instanceof Error ? error.message : 'No se pudo eliminar el pedido.', 'danger')
        }
      },
    })
  }

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
      .filter((a) => (a === 'invoice' ? canInvoice : a === 'confirm' ? canReserve : canChangeStatus))
      .map((action) => ({ action, ...BUTTONS[action] }))

  return {
    canChangeStatus,
    canInvoice,
    /** Mostrar "Eliminar": el rol tiene permiso y el pedido no tiene factura. */
    canDelete: (order: Order) => canDeleteOrders && isDeletable(order),
    remove,
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
