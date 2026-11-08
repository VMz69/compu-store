import { buildWhatsAppLink } from '@/shared/lib/whatsapp'
import { closeModal, useModalPayload } from '@/shared/store/modal.store'
import { useSalesStore } from '../store'

/** Comprobante del pedido abierto en el modal (payload = id del pedido). */
export function useOrderDetail() {
  const orderId = useModalPayload<string>()
  const order = useSalesStore((s) => s.orders.find((o) => o.id === orderId))

  if (!order) return null

  return {
    order,
    lines: order.items.map((item) => ({ ...item, subtotal: item.price * item.quantity })),
    notifyLink: buildWhatsAppLink(
      order.phone,
      `Hola ${order.client}, te escribimos de CompuStore SV respecto a tu orden ${order.id}.`,
    ),
    onClose: closeModal,
  }
}
