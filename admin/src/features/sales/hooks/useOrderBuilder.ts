import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ensurePermission, useSession } from '@/features/access'
import { useCatalogStore, type Product } from '@/features/catalog'
import { useCustomerSelection } from '@/features/customers'
import { useFormState } from '@/shared/hooks/useFormState'
import { useLineItems } from '@/shared/hooks/useLineItems'
import { lineTotal } from '@/shared/lib/pricing'
import { openModal } from '@/shared/store/modal.store'
import { toast } from '@/shared/store/toast.store'
import { orderTotals } from '../lib/charges'
import { DEFAULT_CITY, DELIVERY_METHODS, PAYMENT_METHODS } from '../lib/order.service'
import { validateOrder } from '../lib/orderValidation'
import { SALES_MODALS } from '../modals'
import { clearOrderPrefill, peekOrderPrefill } from '../prefill.store'
import { useSalesStore } from '../store'
import type { OrderItem } from '../types'
import { useOrderCharges } from './useOrderCharges'
import { useReservedStock } from './useOrders'

/**
 * Constructor de pedidos (/pedidos/nuevo), análogo al de cotizaciones.
 * Flujo: cliente → productos (limitados al stock disponible) → entrega y pago →
 * "Registrar" (estado Registrado); la confirmación y reserva de stock se hacen desde el detalle.
 * Si viene de una cotización, se pre-carga con sus precios y descuentos.
 */
export function useOrderBuilder() {
  const navigate = useNavigate()
  const { user } = useSession()
  const [prefill] = useState(peekOrderPrefill)
  useEffect(() => clearOrderPrefill(), [])

  const products = useCatalogStore((s) => s.products)
  const channels = useSalesStore((s) => s.channels)
  const addOrder = useSalesStore((s) => s.addOrder)
  const isLoading = useSalesStore((s) => s.isLoading)
  const reserved = useReservedStock()
  const [submitted, setSubmitted] = useState(false)
  /** Candado de envío: cubre el alta del cliente + el registro del pedido (evita dobles clics). */
  const [saving, setSaving] = useState(false)

  const availableOf = (productId: string) => {
    const product = products.find((p) => p.id === productId)
    return product ? Math.max(0, product.stock - (reserved[productId] ?? 0)) : 0
  }

  const customer = useCustomerSelection(prefill?.customer, { registerNew: true })
  const lines = useLineItems<OrderItem>(prefill?.items ?? [], availableOf)
  const extra = useOrderCharges()
  const activeChannels = channels.filter((c) => c.active)
  const form = useFormState({
    channel: activeChannels[0]?.name ?? '',
    paymentMethod: PAYMENT_METHODS[0],
    deliveryMethod: DELIVERY_METHODS[0],
    city: '',
    notes: prefill?.notes ?? '',
  })
  const { values } = form

  const validate = () => ({ ...customer.validate(), ...validateOrder(values, lines.items, availableOf), ...extra.validate() })
  const errors = submitted ? validate() : {}

  const addProduct = (p: Product) => {
    const added = lines.add({ productId: p.id, sku: p.sku, name: p.name, unitPrice: p.price, quantity: 1, discountPercent: 0 })
    if (!added) toast(`No hay más unidades disponibles de ${p.name}.`, 'warning')
  }

  const submit = async () => {
    if (saving) return
    setSubmitted(true)
    if (Object.keys(validate()).length > 0) return toast('Revisa el cliente, los productos, la entrega y los cargos extra.', 'warning')
    if (!ensurePermission('canChangeOrderStatus', 'Su rol no puede registrar pedidos')) return
    const isNewCustomer = customer.mode === 'walkin'
    if (isNewCustomer && !ensurePermission('canManageCustomers', 'Su rol no puede registrar clientes nuevos')) return
    setSaving(true)
    try {
      // Cliente nuevo: se da de alta primero para que el pedido quede enlazado a su ficha.
      const snap = await customer.commit()
      if (snap.created) toast(`Cliente ${snap.created.name} agregado al directorio`, 'info')
      const order = await addOrder(
        {
          customerId: snap.customerId, client: snap.name, phone: snap.phone, email: snap.email,
          city: values.city.trim() || snap.city || DEFAULT_CITY,
          channel: values.channel, paymentMethod: values.paymentMethod, deliveryMethod: values.deliveryMethod.trim(),
          notes: values.notes.trim(), items: lines.items, charges: extra.charges, quoteId: prefill?.quoteId ?? null,
        },
        user?.name ?? 'Equipo CompuStore',
      )
      toast(`Pedido ${order.id} registrado`, 'success')
      navigate('/pedidos')
      openModal(SALES_MODALS.orderDetail, order.id)
    } catch (error) {
      toast(error instanceof Error ? error.message : 'No se pudo registrar el pedido.', 'danger')
    } finally {
      setSaving(false)
    }
  }

  return {
    quoteId: prefill?.quoteId ?? null,
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
    channelOptions: activeChannels.map((c) => ({ value: c.name, label: `${c.name} (${c.badge || 'Activo'})` })),
    paymentOptions: PAYMENT_METHODS.map((m) => ({ value: m, label: m })),
    deliveryOptions: DELIVERY_METHODS.map((m) => ({ value: m, label: m })),
    addProduct,
    register: submit,
    cancel: () => navigate('/pedidos'),
    isLoading: isLoading || saving,
  }
}

export type OrderBuilderApi = ReturnType<typeof useOrderBuilder>
