import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ensurePermission, useSession } from '@/00-director-acceso'
import { useCatalogStore, useEffectivePrice, type Product } from '@/00-director-catalogo'
import { useCustomerSelection } from '@/00-director-clientes'
import { useExtraCharges } from '@/78-pipeline-cargos-documentos/02-useExtraCharges'
import { useFormState } from '@/77-pipeline-edicion-formularios/03-useFormState'
import { useLineItems } from '@/77-pipeline-edicion-formularios/02-useLineItems'
import { lineTotal } from '@/82-pipeline-calculo-importes/00-director-calculo-importes'
import { openModal } from '@/73-pipeline-modales-globales/03-modal.store'
import { toast } from '@/76-pipeline-avisos-globales/02-toast.store'
import { orderTotals } from '../43-pipeline-reglas-pedidos/04-charges'
import { DEFAULT_CITY, DELIVERY_METHODS, PAYMENT_METHODS } from '../42-pipeline-persistencia-pedidos/02-order.service'
import { editBlockedReason } from '../39-pipeline-transiciones-pedidos/02-orderFlow'
import { optionsWithLegacy, orderSeed } from '../42-pipeline-persistencia-pedidos/04-orderSeed'
import { validateOrder } from '../43-pipeline-reglas-pedidos/02-orderValidation'
import { SALES_MODALS } from '../39-pipeline-transiciones-pedidos/05-modals'
import { clearOrderPrefill, peekOrderPrefill } from '../43-pipeline-reglas-pedidos/00-director-reglas-pedidos'
import { useSalesStore } from '../42-pipeline-persistencia-pedidos/00-director-persistencia-pedidos'
import type { OrderDraft, OrderItem } from '../42-pipeline-persistencia-pedidos/05-types'
import { useOrderActions } from '../39-pipeline-transiciones-pedidos/00-director-transiciones-pedidos'
import { useReservedStock } from '../35-pipeline-consulta-pedidos/00-director-consulta-pedidos'

/**
 * Constructor de pedidos, análogo al de cotizaciones. Dos modos con la misma vista:
 *  · /pedidos/nuevo: registra un pedido (estado Registrado). Si viene de una
 *    cotización, se pre-carga con sus precios y descuentos.
 *  · /pedidos/:orderId/editar: edita un pedido sin factura (ver `editBlockedReason`).
 * Flujo: cliente → productos (limitados al stock disponible) → entrega y pago → cargos extra.
 */
export function useOrderBuilder() {
  const navigate = useNavigate()
  const { orderId } = useParams<{ orderId: string }>()
  const { user } = useSession()
  const [prefill] = useState(() => (orderId ? null : peekOrderPrefill()))
  useEffect(() => clearOrderPrefill(), [])

  // Pedido a editar: se toma una sola vez (la vista no debe cambiar mientras se edita).
  const [editing] = useState(() => (orderId ? useSalesStore.getState().orders.find((o) => o.id === orderId) : undefined))
  const isEdit = Boolean(orderId)

  const products = useCatalogStore((s) => s.products)
  const priceOf = useEffectivePrice()
  const channels = useSalesStore((s) => s.channels)
  const addOrder = useSalesStore((s) => s.addOrder)
  const updateOrder = useSalesStore((s) => s.updateOrder)
  const isLoading = useSalesStore((s) => s.isLoading)
  const actions = useOrderActions()
  // Al editar un pedido confirmado, su propia reserva no cuenta en su contra.
  const reserved = useReservedStock(editing?.id)
  const [submitted, setSubmitted] = useState(false)
  /** Candado de envío: cubre el alta del cliente + el guardado del pedido (evita dobles clics). */
  const [saving, setSaving] = useState(false)

  const availableOf = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    return product ? Math.max(0, product.stock - (reserved[productId] ?? 0)) : 0
  }

  const activeChannels = channels.filter((c) => c.active)
  const [seed] = useState(() => orderSeed(editing, prefill, activeChannels[0]?.name ?? ''))
  const customer = useCustomerSelection(seed.customer, { registerNew: true })
  const lines = useLineItems<OrderItem>(seed.items, availableOf)
  const extra = useExtraCharges(seed.charges)
  const form = useFormState(seed.fields)
  const { values } = form

  const validate = () => ({ ...customer.validate(), ...validateOrder(values, lines.items, availableOf), ...extra.validate() })
  const errors = submitted ? validate() : {}

  const addProduct = (p: Product) => {
    // Precio vigente: si el producto está en una oferta vigente, entra con ese precio.
    const { price, offer } = priceOf(p)
    const isNew = !lines.items.some((i) => i.productId === p.id)
    const added = lines.add({ productId: p.id, sku: p.sku, name: p.name, unitPrice: price, quantity: 1, discountPercent: 0 })
    if (!added) toast(`No hay más unidades disponibles de ${p.name}.`, 'warning')
    else if (offer && isNew) toast(`Precio de oferta aplicado: ${offer.title}`, 'info')
  }

  const submit = async () => {
    if (saving) return
    setSubmitted(true)
    if (Object.keys(validate()).length > 0) return toast('Revisa el cliente, los productos, la entrega y los cargos extra.', 'warning')
    if (!ensurePermission('canChangeOrderStatus', isEdit ? 'No tienes permiso para editar pedidos' : 'No tienes permiso para registrar pedidos')) return
    if (customer.mode === 'walkin' && !ensurePermission('canManageCustomers', 'No tienes permiso para registrar clientes nuevos')) return
    setSaving(true)
    try {
      // Cliente nuevo: se da de alta primero para que el pedido quede enlazado a su ficha.
      const snap = await customer.commit()
      if (snap.created) toast(`Cliente ${snap.created.name} agregado al directorio`, 'info')
      const draft: OrderDraft = {
        customerId: snap.customerId, client: snap.name, phone: snap.phone, email: snap.email,
        city: values.city.trim() || snap.city || DEFAULT_CITY,
        channel: values.channel, paymentMethod: values.paymentMethod, deliveryMethod: values.deliveryMethod.trim(),
        notes: values.notes.trim(), items: lines.items, charges: extra.charges, quoteId: editing?.quoteId ?? prefill?.quoteId ?? null,
      }
      const by = user?.name ?? 'Equipo CompuStore'
      const order = editing ? await updateOrder(editing.id, draft, by) : await addOrder(draft, by)
      toast(editing ? `Pedido ${order.id} actualizado` : `Pedido ${order.id} registrado`, 'success')
      navigate('/pedidos')
      openModal(SALES_MODALS.orderDetail, order.id)
    } catch (error) {
      toast(error instanceof Error ? error.message : 'No se pudo guardar el pedido.', 'danger')
    } finally {
      setSaving(false)
    }
  }

  return {
    isEdit,
    orderId: editing?.id ?? orderId ?? null,
    /** En edición: motivo por el que el pedido no se puede editar (la vista lo muestra en vez del formulario). */
    blockedReason: isEdit ? editBlockedReason(editing) : null,
    quoteId: editing?.quoteId ?? prefill?.quoteId ?? null,
    customer,
    bind: form.bind,
    errors,
    quantities: lines.quantities,
    reserved,
    lines: lines.items.map((i) => ({
      id: i.productId, name: i.name, sku: i.sku, unitPrice: i.unitPrice, quantity: i.quantity,
      discountPercent: i.discountPercent, total: lineTotal(i), max: availableOf(i.productId), error: errors[`items.${i.productId}`],
    })),
    lineHandlers: { onStep: lines.step, onQuantity: lines.onQuantity, onDiscount: lines.onDiscount, onRemove: lines.remove },
    charges: extra,
    totals: orderTotals(lines.items, extra.charges),
    cityPlaceholder: customer.snapshot.city || DEFAULT_CITY,
    channelOptions: optionsWithLegacy(activeChannels.map((c) => c.name), seed.fields.channel, (name) => {
      const channel = activeChannels.find((c) => c.name === name)
      return `${name} (${channel?.badge || 'Activo'})`
    }),
    paymentOptions: optionsWithLegacy(PAYMENT_METHODS, seed.fields.paymentMethod),
    deliveryOptions: optionsWithLegacy(DELIVERY_METHODS, seed.fields.deliveryMethod),
    submitLabel: isEdit ? 'Guardar cambios' : 'Registrar pedido',
    /** Solo en edición: eliminación lógica del pedido (vuelve a la lista al confirmarse). */
    canDelete: editing ? actions.canDelete(editing) : false,
    remove: () => editing && actions.remove(editing, () => navigate('/pedidos')),
    addProduct,
    register: submit,
    cancel: () => navigate('/pedidos'),
    isLoading: isLoading || saving,
  }
}

export type OrderBuilderApi = ReturnType<typeof useOrderBuilder>
