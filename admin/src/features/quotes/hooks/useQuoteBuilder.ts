import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ensurePermission, useSession } from '@/features/access'
import type { Product } from '@/features/catalog'
import { useCustomerSelection } from '@/features/customers'
import { useStoreSettings } from '@/features/settings'
import { useFormState } from '@/shared/hooks/useFormState'
import { useLineItems } from '@/shared/hooks/useLineItems'
import { openModal } from '@/shared/store/modal.store'
import { toast } from '@/shared/store/toast.store'
import { calcTotals, DEFAULT_VALIDITY_DAYS, lineTotal, VALIDITY_OPTIONS } from '../lib/quote.service'
import { QUOTES_MODALS } from '../modals'
import { useQuotesStore } from '../store'
import type { QuoteItem } from '../types'

/**
 * Estado del constructor de cotizaciones (/cotizaciones/nueva).
 * Flujo: elegir cliente → agregar productos → ajustar cantidades/descuentos →
 * "Generar" guarda la cotización y abre la vista previa del PDF.
 * Comparte cliente y líneas con el constructor de pedidos (mismos hooks).
 */
export function useQuoteBuilder() {
  const navigate = useNavigate()
  const createQuote = useQuotesStore((s) => s.createQuote)
  const isLoading = useQuotesStore((s) => s.isLoading)
  const settings = useStoreSettings()
  const { user } = useSession()

  const customer = useCustomerSelection()
  // Se cotiza sin tope de stock: se permite "bajo pedido".
  const lines = useLineItems<QuoteItem>([])
  const [submitted, setSubmitted] = useState(false)
  const form = useFormState({ notes: '', validityDays: String(DEFAULT_VALIDITY_DAYS) })
  const { values } = form

  const validate = () => {
    const e = customer.validate()
    if (lines.items.length === 0) e.items = 'Agrega al menos un producto.'
    return e
  }
  const errors = submitted ? validate() : {}

  const generate = async () => {
    setSubmitted(true)
    if (Object.keys(validate()).length > 0) return toast('Completa el cliente y los productos.', 'warning')
    if (!ensurePermission('canManageQuotes', 'Su rol no puede emitir cotizaciones')) return
    const { customerId, name, phone, email, documentId } = customer.snapshot
    const quote = await createQuote({
      customer: { customerId, name, phone, email, documentId },
      items: lines.items,
      notes: values.notes.trim(),
      validityDays: Number(values.validityDays),
      createdBy: user?.name ?? 'Equipo CompuStore',
      issuer: { name: settings.name, address: settings.address, phones: settings.phones, email: settings.email, taxRate: settings.taxRate },
    })
    toast(`Cotización ${quote.id} generada`, 'success')
    navigate('/cotizaciones')
    openModal(QUOTES_MODALS.preview, quote.id)
  }

  return {
    customer,
    bind: form.bind,
    validityOptions: VALIDITY_OPTIONS.map((d) => ({ value: String(d), label: `${d} días` })),
    lines: lines.items.map((i) => ({
      id: i.productId, name: i.name, sku: i.sku, unitPrice: i.unitPrice, quantity: i.quantity,
      discountPercent: i.discountPercent, total: lineTotal(i),
    })),
    lineHandlers: { onStep: lines.step, onQuantity: lines.onQuantity, onDiscount: lines.onDiscount, onRemove: lines.remove },
    quantities: lines.quantities,
    totals: calcTotals(lines.items, settings.taxRate),
    taxPercent: Math.round(settings.taxRate * 100),
    errors,
    addProduct: (p: Product) =>
      lines.add({ productId: p.id, sku: p.sku, name: p.name, unitPrice: p.price, quantity: 1, discountPercent: 0 }),
    generate,
    cancel: () => navigate('/cotizaciones'),
    isLoading,
  }
}

export type QuoteBuilderApi = ReturnType<typeof useQuoteBuilder>
