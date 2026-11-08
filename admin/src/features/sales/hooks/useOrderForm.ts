import type { FormEvent } from 'react'
import { ensurePermission } from '@/features/access'
import { findProduct, useInStockProducts } from '@/features/catalog'
import { useFormState } from '@/shared/hooks/useFormState'
import { formatCurrency } from '@/shared/lib/currency'
import { closeModal } from '@/shared/store/modal.store'
import { toast } from '@/shared/store/toast.store'
import { DEFAULT_DELIVERY, PAYMENT_METHODS, statusOptionLabel } from '../lib/order.service'
import { useSalesStore } from '../store'

type OrderFormValues = {
  client: string
  phone: string
  channel: string
  city: string
  productId: string
  quantity: string
  paymentMethod: string
  status: string
  deliveryMethod: string
}

const MAX_QTY = 10

/** Registro de pedido/venta: opciones desde catálogo, canales y pipeline. */
export function useOrderForm() {
  const products = useInStockProducts()
  const allChannels = useSalesStore((s) => s.channels)
  const statuses = useSalesStore((s) => s.statuses)
  const addOrder = useSalesStore((s) => s.addOrder)
  const isLoading = useSalesStore((s) => s.isLoading)

  const activeChannels = allChannels.filter((c) => c.active)
  const channels = activeChannels.length > 0 ? activeChannels : allChannels

  const { values, bind } = useFormState<OrderFormValues>({
    client: '',
    phone: '',
    channel: channels[0]?.name ?? 'Sala de Ventas',
    city: 'Cojutepeque',
    productId: products[0]?.id ?? '',
    quantity: '1',
    paymentMethod: PAYMENT_METHODS[0],
    status: 'Confirmado',
    deliveryMethod: DEFAULT_DELIVERY,
  })

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!ensurePermission('canChangeOrderStatus', 'Su rol no tiene permisos para registrar pedidos')) return
    const product = findProduct(values.productId)
    const quantity = Math.min(MAX_QTY, Math.max(1, parseInt(values.quantity, 10) || 1))
    const price = product?.price ?? 0
    const order = await addOrder({
      client: values.client.trim(),
      phone: values.phone.trim(),
      city: values.city.trim() || 'Cojutepeque',
      channel: values.channel,
      paymentMethod: values.paymentMethod,
      deliveryMethod: values.deliveryMethod.trim(),
      status: values.status,
      total: price * quantity,
      items: [{ productId: values.productId, name: product?.name ?? 'Artículo Informático', quantity, price }],
    })
    closeModal()
    toast(`Pedido ${order.id} registrado con éxito`, 'success')
  }

  return {
    bind,
    maxQuantity: MAX_QTY,
    hasProducts: products.length > 0,
    channelOptions: channels.map((c) => ({ value: c.name, label: `${c.name} (${c.badge || 'Activo'})` })),
    productOptions: products.map((p) => ({
      value: p.id,
      label: `${p.name} · ${formatCurrency(p.price)} (Stock: ${p.stock})`,
    })),
    paymentOptions: PAYMENT_METHODS.map((m) => ({ value: m, label: m })),
    statusOptions: statuses.map((s) => ({ value: s.name, label: statusOptionLabel(s) })),
    onSubmit,
    onClose: closeModal,
    isLoading,
  }
}

export type OrderFormApi = ReturnType<typeof useOrderForm>
