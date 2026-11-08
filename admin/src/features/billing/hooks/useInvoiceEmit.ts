import { useState, type FormEvent } from 'react'
import { ensurePermission, useSession } from '@/features/access'
import { checkAvailability, deductStock, getCatalogSnapshot, useCatalogStore } from '@/features/catalog'
import { useCustomersStore } from '@/features/customers'
import { INVOICED_STATUS, isInvoiceable, setOrderInvoice, useSalesStore } from '@/features/sales'
import { useStoreSettings } from '@/features/settings'
import { useFormState } from '@/shared/hooks/useFormState'
import { closeModal, openModal, useModalPayload } from '@/shared/store/modal.store'
import { toast } from '@/shared/store/toast.store'
import { invoiceTotals, PAYMENT_CONDITIONS, paymentConditionFrom } from '../lib/invoice.service'
import { BILLING_MODALS } from '../modals'
import { useBillingStore } from '../store'
import type { InvoiceItem, InvoiceReceptor, PaymentCondition } from '../types'

const digits = (phone: string) => phone.replace(/\D/g, '')

/**
 * Emisión de factura desde un pedido (payload del modal: id del pedido).
 *
 * Al emitir, en este orden:
 *  1. Revalida el stock con los datos más recientes (otra venta pudo agotarlo).
 *  2. Crea la factura (número de control, código de generación, sello).
 *  3. Descuenta el inventario (por lotes si aplica).
 *  4. Cierra el pedido: lo vincula a la factura y lo pasa a "Entregado".
 *  5. Abre la vista previa del PDF.
 */
export function useInvoiceEmit() {
  const orderId = useModalPayload<string>()
  const order = useSalesStore((s) => s.orders.find((o) => o.id === orderId))
  const products = useCatalogStore((s) => s.products)
  const customers = useCustomersStore((s) => s.customers)
  const createInvoice = useBillingStore((s) => s.createInvoice)
  const isLoading = useBillingStore((s) => s.isLoading)
  const settings = useStoreSettings()
  const { user } = useSession()
  const [submitted, setSubmitted] = useState(false)

  // Si el teléfono del pedido está en el directorio, se precargan sus datos fiscales.
  const match = order ? customers.find((c) => digits(c.phone) === digits(order.phone)) : undefined
  const { values, bind, bindCheck } = useFormState({
    isFinalConsumer: !match,
    name: match?.name ?? order?.client ?? '',
    documentId: match?.documentId ?? '',
    address: match?.address || order?.city || '',
    email: match?.email ?? '',
    paymentCondition: paymentConditionFrom(order?.paymentMethod ?? ''),
    notes: '',
  })

  const items: InvoiceItem[] = (order?.items ?? []).map((i) => ({
    productId: i.productId, description: i.name, unit: 'Unidad', quantity: i.quantity, unitPrice: i.price, discount: 0,
  }))
  const lines = items.map((i) => ({ productId: i.productId, quantity: i.quantity }))
  const names = Object.fromEntries(items.map((i) => [i.productId, i.description]))
  const availability = checkAvailability(products, lines, names)
  const stockOk = availability.every((r) => r.ok)

  const errors: Record<string, string> =
    submitted && !values.isFinalConsumer && values.name.trim().length < 3 ? { name: 'Ingresa el nombre del receptor.' } : {}

  const receptor = (): InvoiceReceptor =>
    values.isFinalConsumer
      ? { isFinalConsumer: true, name: 'Consumidor Final', documentId: '', address: 'Ciudad', email: values.email.trim(), phone: order?.phone ?? '' }
      : { isFinalConsumer: false, name: values.name.trim(), documentId: values.documentId.trim(), address: values.address.trim(), email: values.email.trim(), phone: order?.phone ?? '' }

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    if (!order || !isInvoiceable(order)) return
    if (!values.isFinalConsumer && values.name.trim().length < 3) return
    if (!ensurePermission('canInvoice', 'Su rol no puede emitir facturas')) return
    if (!checkAvailability(getCatalogSnapshot().products, lines).every((r) => r.ok)) {
      return toast('Stock insuficiente: revisa el inventario antes de facturar.', 'warning')
    }
    const invoice = await createInvoice({
      orderId: order.id,
      receptor: receptor(),
      paymentCondition: values.paymentCondition as PaymentCondition,
      items,
      notes: values.notes.trim(),
      createdBy: user?.name ?? 'Equipo CompuStore',
      issuer: {
        tradeName: settings.name, legalName: settings.legalName, nit: settings.nit, nrc: settings.nrc,
        address: settings.address, phone: settings.phones.join(' / '), email: settings.email,
        establishmentType: settings.establishmentType, economicActivity: settings.economicActivity,
      },
    })
    deductStock(lines)
    setOrderInvoice(order.id, invoice.id, INVOICED_STATUS)
    toast(`Factura ${invoice.internalId} emitida · inventario actualizado`, 'success')
    openModal(BILLING_MODALS.preview, invoice.id)
  }

  return {
    order,
    /** Motivo por el que este pedido no se puede facturar (o null si sí se puede). */
    blockedReason: !order
      ? 'El pedido ya no existe.'
      : order.invoiceId
        ? `Este pedido ya fue facturado (${order.invoiceId}).`
        : !isInvoiceable(order)
          ? `Un pedido en estado "${order.status}" no se puede facturar. Confírmalo primero.`
          : null,
    matchedCustomer: match ?? null,
    isFinalConsumer: values.isFinalConsumer,
    bind,
    bindCheck,
    errors,
    paymentOptions: PAYMENT_CONDITIONS.map((p) => ({ value: p, label: p })),
    items,
    totals: invoiceTotals(items),
    availability,
    stockOk,
    onSubmit,
    onClose: closeModal,
    isLoading,
  }
}

export type InvoiceEmitApi = ReturnType<typeof useInvoiceEmit>
