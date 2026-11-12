import { useState, type FormEvent } from 'react'
import { ensurePermission, useSession } from '@/00-director-acceso'
import { checkAvailability, deductStock, getCatalogSnapshot, useCatalogStore } from '@/00-director-catalogo'
import { normalizePhone, useCustomersStore } from '@/00-director-clientes'
import { isInvoiceable, orderStatusName, setOrderInvoice, useSalesStore } from '@/00-director-ventas'
import { useStoreSettings } from '@/00-director-ajustes'
import { useFormState } from '@/shared/hooks/useFormState'
import { lineDiscount } from '@/shared/lib/pricing'
import { closeModal, openModal, useModalPayload } from '@/shared/store/modal.store'
import { toast } from '@/shared/store/toast.store'
import { invoiceTotals, PAYMENT_CONDITIONS, paymentConditionFrom, stockLines } from '../lib/invoice.service'
import { BILLING_MODALS } from '../modals'
import { useBillingStore } from '../store'
import type { InvoiceItem, InvoiceReceptor, PaymentCondition } from '../types'

/**
 * Emisión de factura desde un pedido (payload del modal: id del pedido).
 *
 * Al emitir, en este orden:
 *  1. Revalida el stock con los datos más recientes (otra venta pudo agotarlo).
 *  2. Crea la factura (número de control, código de generación, sello).
 *  3. Descuenta el inventario (por lotes si aplica).
 *  4. Vincula la factura al pedido y lo pasa a "Facturado" (libera la reserva;
 *     la entrega se marca después en Pedidos).
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

  // Cliente enlazado al pedido (o, si fue ocasional, por teléfono): se precargan sus datos fiscales.
  const match = !order
    ? undefined
    : order.customerId
      ? customers.find((c) => c.id === order.customerId)
      : customers.find((c) => normalizePhone(c.phone) === normalizePhone(order.phone))
  const { values, bind, bindCheck } = useFormState({
    isFinalConsumer: !match,
    name: match?.name ?? order?.client ?? '',
    documentId: match?.documentId ?? '',
    address: match?.address || order?.city || '',
    email: match?.email ?? '',
    paymentCondition: paymentConditionFrom(order?.paymentMethod ?? ''),
    notes: '',
  })

  const items: InvoiceItem[] = [
    ...(order?.items ?? []).map((i): InvoiceItem => ({
      // El descuento pactado en el pedido (o la cotización) pasa a la factura en dólares.
      kind: 'product', productId: i.productId, description: i.name, unit: 'Unidad', quantity: i.quantity, unitPrice: i.unitPrice, discount: lineDiscount(i),
    })),
    // Cargos extra del pedido → líneas de servicio (no mueven inventario).
    ...(order?.charges ?? []).map((c): InvoiceItem => ({
      kind: 'charge', productId: c.id, description: c.concept, unit: 'Servicio', quantity: 1, unitPrice: c.amount, discount: 0,
    })),
  ]
  const lines = stockLines(items)
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
    if (!ensurePermission('canInvoice', 'No tienes permiso para emitir facturas')) return
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
    }, settings.invoiceSeed)
    deductStock(lines)
    setOrderInvoice(order.id, invoice.id, user?.name ?? 'Equipo CompuStore')
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
          ? `Un pedido en estado "${orderStatusName(order.status)}" no se puede facturar. Solo se facturan pedidos "Reservado" con la reserva vigente.`
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
