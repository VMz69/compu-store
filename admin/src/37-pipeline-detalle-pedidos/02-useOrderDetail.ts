import { useNavigate } from 'react-router-dom'
import { formatLongISO } from '@/71-pipeline-seleccion-fechas/05-date'
import { buildWhatsAppLink } from '@/83-pipeline-recursos-publicos/04-whatsapp'
import { lineTotal } from '@/82-pipeline-calculo-importes/00-director-calculo-importes'
import { orderTotals } from '../43-pipeline-reglas-pedidos/04-charges'
import { closeModal, useModalPayload } from '@/73-pipeline-modales-globales/03-modal.store'
import { isEditable, statusOf } from '../39-pipeline-transiciones-pedidos/02-orderFlow'
import { useSalesStore } from '../42-pipeline-persistencia-pedidos/00-director-persistencia-pedidos'
import { useOrderActions } from '../39-pipeline-transiciones-pedidos/00-director-transiciones-pedidos'

/** Comprobante del pedido abierto en el modal (payload = id del pedido). */
export function useOrderDetail() {
  const orderId = useModalPayload<string>()
  const order = useSalesStore((s) => s.orders.find((o) => o.id === orderId))
  const actions = useOrderActions()
  const navigate = useNavigate()

  if (!order) return null

  return {
    order,
    status: statusOf(order.status),
    /** Vigencia de la reserva (solo en estado Reservado). */
    reservation: order.status === 'confirmado' && order.reservedUntil ? { until: order.reservedUntil, date: formatLongISO(order.reservedUntil) } : null,
    lines: order.items.map((item) => ({ ...item, total: lineTotal(item) })),
    charges: order.charges ?? [],
    totals: orderTotals(order.items, order.charges ?? []),
    timeline: [...order.history].reverse().map((e) => ({ ...e, name: statusOf(e.status).name, icon: statusOf(e.status).icon })),
    buttons: actions.actionsFor(order),
    run: (action: Parameters<typeof actions.run>[0]) => {
      // Facturar navega a otra vista: el comprobante se cierra primero.
      if (action === 'invoice') closeModal()
      actions.run(action, order)
    },
    /** Editar: solo sin factura (Registrado o Reservado) y con permiso sobre pedidos. */
    canEdit: actions.canChangeStatus && isEditable(order),
    canDelete: actions.canDelete(order),
    /** Eliminación lógica; al confirmarse, el comprobante se cierra. */
    remove: () => actions.remove(order, closeModal),
    edit: () => {
      closeModal()
      navigate(`/pedidos/${order.id}/editar`)
    },
    viewInvoice: () => {
      closeModal()
      if (order.invoiceId) actions.viewInvoice(order.invoiceId)
    },
    notifyLink: buildWhatsAppLink(
      order.phone,
      `Hola ${order.client}, te escribimos de CompuStore SV respecto a tu orden ${order.id} (${statusOf(order.status).name}).`,
    ),
    onClose: closeModal,
  }
}

export type OrderDetailApi = NonNullable<ReturnType<typeof useOrderDetail>>
