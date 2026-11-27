import { useState, type FormEvent } from 'react'
import { ensurePermission } from '@/00-director-acceso'
import { checkAvailability, getCatalogSnapshot, refreshProducts, useCatalogStore } from '@/00-director-catalogo'
import { normalizePhone, useCustomersStore } from '@/00-director-clientes'
import { isInvoiceable, orderStatusName, refreshOrder, useSalesStore } from '@/00-director-ventas'
import { useFormState } from '@/77-pipeline-edicion-formularios/03-useFormState'
import { lineDiscount } from '@/82-pipeline-calculo-importes/00-director-calculo-importes'
import { closeModal, openModal, useModalPayload } from '@/73-pipeline-modales-globales/03-modal.store'
import { toast } from '@/76-pipeline-avisos-globales/02-toast.store'
import { invoiceTotals, PAYMENT_CONDITIONS, paymentConditionFrom, stockLines } from '../47-pipeline-persistencia-facturas/02-invoice.service'
import { BILLING_MODALS } from './05-modals'
import { useBillingStore } from '../47-pipeline-persistencia-facturas/00-director-persistencia-facturas'
import type { InvoiceItem, InvoiceReceptor, PaymentCondition } from '../47-pipeline-persistencia-facturas/03-types'

/**
 * Emisión de factura desde un pedido (payload del modal: id del pedido).
 *
 * Al emitir (L15), el servidor hace en UNA transacción: revalida el pedido (Reservado con la reserva
 * vigente), copia sus líneas y cargos, asigna números, código y sello (simulado), descuenta el inventario
 * (stock y reserva, por lotes FEFO) y pasa el pedido a "Facturado". Aquí solo se envían el receptor, la
 * condición de pago y las notas; después se releen el pedido y el catálogo y se abre la vista previa del PDF.
 * Si el servidor lo rechaza, su mensaje se muestra y el modal sigue abierto.
 */
export function useInvoiceEmit() {
  const orderId = useModalPayload<string>()
  const order = useSalesStore((s) => s.orders.find((o) => o.id === orderId))
  const products = useCatalogStore((s) => s.products)
  const customers = useCustomersStore((s) => s.customers)
  const createInvoice = useBillingStore((s) => s.createInvoice)
  const isLoading = useBillingStore((s) => s.isLoading)
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
    let invoice
    try {
      invoice = await createInvoice({
        orderId: order.id,
        receptor: receptor(),
        paymentCondition: values.paymentCondition as PaymentCondition,
        notes: values.notes.trim(),
      })
    } catch (error) {
      return toast(error instanceof Error ? error.message : 'No se pudo emitir la factura.', 'danger')
    }
    await Promise.all([refreshOrder(order.id), refreshProducts()])
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
