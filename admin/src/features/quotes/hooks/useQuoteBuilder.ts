import { useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ensurePermission, useSession } from '@/features/access'
import type { Product } from '@/features/catalog'
import { useCustomersStore } from '@/features/customers'
import { useStoreSettings } from '@/features/settings'
import { useFormState } from '@/shared/hooks/useFormState'
import { openModal } from '@/shared/store/modal.store'
import { toast } from '@/shared/store/toast.store'
import { calcTotals, DEFAULT_VALIDITY_DAYS, lineTotal, VALIDITY_OPTIONS } from '../lib/quote.service'
import { QUOTES_MODALS } from '../modals'
import { useQuotesStore } from '../store'
import type { QuoteCustomer, QuoteItem } from '../types'

/** "directory" = cliente del directorio · "walkin" = cliente ocasional (datos a mano). */
export type CustomerMode = 'directory' | 'walkin'

const MAX_QTY = 999
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

/**
 * Estado del constructor de cotizaciones (/cotizaciones/nueva).
 * Flujo: elegir cliente → agregar productos → ajustar cantidades/descuentos →
 * "Generar" guarda la cotización y abre la vista previa del PDF.
 */
export function useQuoteBuilder() {
  const navigate = useNavigate()
  const customers = useCustomersStore((s) => s.customers)
  const createQuote = useQuotesStore((s) => s.createQuote)
  const isLoading = useQuotesStore((s) => s.isLoading)
  const settings = useStoreSettings()
  const { user } = useSession()

  const [items, setItems] = useState<QuoteItem[]>([])
  const [mode, setMode] = useState<CustomerMode>('directory')
  const [submitted, setSubmitted] = useState(false)
  const form = useFormState({ customerId: '', name: '', phone: '', email: '', notes: '', validityDays: String(DEFAULT_VALIDITY_DAYS) })
  const { values } = form

  const activeCustomers = customers.filter((c) => c.active)
  const selected = activeCustomers.find((c) => c.id === values.customerId)

  // ── Ítems
  const patchItem = (productId: string, patch: Partial<QuoteItem>) =>
    setItems((list) => list.map((i) => (i.productId === productId ? { ...i, ...patch } : i)))
  const addProduct = (p: Product) =>
    setItems((list) =>
      list.some((i) => i.productId === p.id)
        ? list.map((i) => (i.productId === p.id ? { ...i, quantity: clamp(i.quantity + 1, 1, MAX_QTY) } : i))
        : [...list, { productId: p.id, sku: p.sku, name: p.name, unitPrice: p.price, quantity: 1, discountPercent: 0 }],
    )

  // ── Cliente resultante (snapshot) y validación
  const customer: QuoteCustomer =
    mode === 'directory'
      ? { customerId: selected?.id ?? null, name: selected?.name ?? '', phone: selected?.phone ?? '', email: selected?.email ?? '', documentId: selected?.documentId ?? '' }
      : { customerId: null, name: values.name.trim(), phone: values.phone.trim(), email: values.email.trim(), documentId: '' }

  const validate = () => {
    const e: Record<string, string> = {}
    if (mode === 'directory' && !selected) e.customer = 'Selecciona un cliente del directorio.'
    if (mode === 'walkin' && customer.name.length < 3) e.name = 'Ingresa el nombre del cliente.'
    if (mode === 'walkin' && customer.phone.replace(/\D/g, '').length < 8) e.phone = 'Ingresa un teléfono de contacto.'
    if (items.length === 0) e.items = 'Agrega al menos un producto.'
    return e
  }
  const errors = submitted ? validate() : {}

  const generate = async () => {
    setSubmitted(true)
    if (Object.keys(validate()).length > 0) return toast('Completa el cliente y los productos.', 'warning')
    if (!ensurePermission('canManageQuotes', 'Su rol no puede emitir cotizaciones')) return
    const quote = await createQuote({
      customer,
      items,
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
    mode,
    setDirectoryMode: () => setMode('directory'),
    setWalkinMode: () => setMode('walkin'),
    bind: form.bind,
    selectedCustomer: selected ?? null,
    customerOptions: [
      { value: '', label: 'Selecciona un cliente…' },
      ...activeCustomers.map((c) => ({ value: c.id, label: `${c.name} · ${c.phone}` })),
    ],
    validityOptions: VALIDITY_OPTIONS.map((d) => ({ value: String(d), label: `${d} días` })),
    items: items.map((item) => ({ item, total: lineTotal(item) })),
    quantities: Object.fromEntries(items.map((i) => [i.productId, i.quantity])),
    totals: calcTotals(items, settings.taxRate),
    taxPercent: Math.round(settings.taxRate * 100),
    errors,
    addProduct,
    removeItem: (productId: string) => setItems((list) => list.filter((i) => i.productId !== productId)),
    stepQuantity: (productId: string, delta: number) =>
      setItems((list) => list.map((i) => (i.productId === productId ? { ...i, quantity: clamp(i.quantity + delta, 1, MAX_QTY) } : i))),
    onQuantity: (productId: string) => (e: ChangeEvent<HTMLInputElement>) =>
      patchItem(productId, { quantity: clamp(parseInt(e.target.value, 10) || 1, 1, MAX_QTY) }),
    onDiscount: (productId: string) => (e: ChangeEvent<HTMLInputElement>) =>
      patchItem(productId, { discountPercent: clamp(parseFloat(e.target.value) || 0, 0, 100) }),
    generate,
    cancel: () => navigate('/cotizaciones'),
    isLoading,
  }
}

export type QuoteBuilderApi = ReturnType<typeof useQuoteBuilder>
