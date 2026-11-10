import { buildWhatsAppLink } from '@/shared/lib/whatsapp'
import { lineTotal, summarizeLines } from '@/shared/lib/pricing'
import { closeModal, useModalPayload } from '@/shared/store/modal.store'
import { statusOf } from '../lib/orderFlow'
import { useSalesStore } from '../store'
import { useOrderActions } from './useOrderActions'

/** Comprobante del pedido abierto en el modal (payload = id del pedido). */
export function useOrderDetail() {
  const orderId = useModalPayload<string>()
  const order = useSalesStore((s) => s.orders.find((o) => o.id === orderId))
  const actions = useOrderActions()

  if (!order) return null

  return {
    order,
    status: statusOf(order.status),
    lines: order.items.map((item) => ({ ...item, total: lineTotal(item) })),
    totals: summarizeLines(order.items),
    timeline: [...order.history].reverse().map((e) => ({ ...e, name: statusOf(e.status).name, icon: statusOf(e.status).icon })),
    buttons: actions.actionsFor(order),
    run: (action: Parameters<typeof actions.run>[0]) => {
      // Facturar navega a otra vista: el comprobante se cierra primero.
      if (action === 'invoice') closeModal()
      actions.run(action, order)
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
