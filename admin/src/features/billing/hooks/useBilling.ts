import { useDeferredValue, useEffect, useMemo, useState, type ChangeEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ensurePermission, usePermission, useSession } from '@/features/access'
import { restoreStock } from '@/features/catalog'
import { findOrder, isInvoiceable, orderSearchFields, orderStatusName, setOrderInvoice, useSalesStore } from '@/features/sales'
import { usePagination } from '@/shared/hooks/usePagination'
import { matchesQuery } from '@/shared/lib/text'
import { askConfirm } from '@/shared/store/confirm.store'
import { openModal } from '@/shared/store/modal.store'
import { toast } from '@/shared/store/toast.store'
import { filterInvoices, INVOICE_STATUS_META, invoiceTotals, lastInternalNumber, stockLines } from '../lib/invoice.service'
import { BILLING_MODALS } from '../modals'
import { useBillingStore } from '../store'
import type { Invoice, InvoiceStatus } from '../types'

export type BillingTab = 'pending' | 'issued'
export const INVOICE_PAGE_SIZES = [10, 25, 50]

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  ...(Object.keys(INVOICE_STATUS_META) as InvoiceStatus[]).map((s) => ({ value: s, label: INVOICE_STATUS_META[s].label })),
]

/**
 * Bandeja de Facturación: pedidos por facturar + facturas emitidas.
 *
 * Deep-links desde Pedidos (sin acoplar features):
 * - `/facturacion?pedido=ORD-…` → abre la emisión de ese pedido.
 * - `/facturacion?factura=DTE-…` → abre el PDF de esa factura.
 * El parámetro se limpia tras usarlo para que recargar no lo reabra.
 */
export function useBilling() {
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useState<BillingTab>(() => (params.has('factura') ? 'issued' : 'pending'))
  // Un texto de búsqueda por pestaña: cambiar de pestaña no pierde lo escrito.
  const [queries, setQueries] = useState<Record<BillingTab, string>>({ pending: '', issued: '' })
  const pendingQuery = useDeferredValue(queries.pending)
  const issuedQuery = useDeferredValue(queries.issued)
  const [status, setStatus] = useState<'all' | InvoiceStatus>('all')
  const orders = useSalesStore((s) => s.orders)
  const invoices = useBillingStore((s) => s.invoices)
  const voidInvoice = useBillingStore((s) => s.voidInvoice)
  const canInvoice = usePermission('canInvoice')
  const { user } = useSession()

  useEffect(() => {
    const orderId = params.get('pedido')
    const invoiceId = params.get('factura')
    if (!orderId && !invoiceId) return
    if (orderId) openModal(BILLING_MODALS.emit, orderId)
    else if (invoiceId) openModal(BILLING_MODALS.preview, invoiceId)
    setParams({}, { replace: true })
  }, [params, setParams])

  const allPending = useMemo(() => orders.filter(isInvoiceable), [orders])
  const pending = useMemo(
    () => allPending.filter((o) => matchesQuery(orderSearchFields(o, orderStatusName(o.status)), pendingQuery)),
    [allPending, pendingQuery],
  )
  const issuedRows = useMemo(
    () => filterInvoices(invoices, issuedQuery, status).map((invoice) => ({ invoice, totals: invoiceTotals(invoice.items) })),
    [invoices, issuedQuery, status],
  )
  const { pageItems, pagination } = usePagination(issuedRows, { pageSizeOptions: INVOICE_PAGE_SIZES, resetKey: `${issuedQuery}|${status}` })
  const active = invoices.filter((i) => i.status === 'emitida')

  /**
   * Anular: repone el inventario y devuelve el pedido a "Reservado" (vigencia por defecto)
   * (su stock queda reservado de nuevo). Regla: si el pedido ya se entregó,
   * no se anula desde aquí (requeriría un flujo de devolución).
   */
  const promptVoid = (invoice: Invoice) => {
    if (findOrder(invoice.orderId)?.status === 'entregado') {
      return toast(`El pedido ${invoice.orderId} ya fue entregado: la factura no se puede anular desde el flujo normal.`, 'warning')
    }
    const units = invoiceTotals(invoice.items).units
    askConfirm({
      title: 'Anular factura',
      message: `Se anulará la factura ${invoice.internalId} (${invoice.receptor.name}). Se repondrán ${units} unidad(es) al inventario y el pedido ${invoice.orderId} volverá a "Reservado" por 3 días, para facturarse de nuevo o cancelarse.`,
      confirmText: 'Anular factura',
      onConfirm: () => {
        if (!ensurePermission('canInvoice', 'No tienes permiso para anular facturas')) return
        voidInvoice(invoice.id)
        // Solo productos: los cargos extra (envío, instalación…) no son inventario.
        restoreStock(stockLines(invoice.items))
        const order = findOrder(invoice.orderId)
        if (order?.invoiceId === invoice.id) setOrderInvoice(order.id, null, user?.name ?? 'Equipo CompuStore')
        toast(`Factura ${invoice.internalId} anulada · stock repuesto`, 'info')
      },
    })
  }

  return {
    tab,
    showPending: () => setTab('pending'),
    showIssued: () => setTab('issued'),
    canInvoice,
    pending,
    issued: pageItems,
    pagination,
    issuedCount: issuedRows.length,
    summary: {
      pendingCount: allPending.length,
      pendingAmount: allPending.reduce((acc, o) => acc + o.total, 0),
      issuedCount: active.length,
      billedTotal: active.reduce((acc, i) => acc + invoiceTotals(i.items).total, 0),
    },
    /** Área activa para la línea de ubicación de la barra. */
    areaLabel: tab === 'pending' ? 'Por facturar' : 'Facturas emitidas',
    /** Buscador en tiempo real de la pestaña activa. */
    search: {
      value: queries[tab],
      onChange: (e: ChangeEvent<HTMLInputElement>) => setQueries((q) => ({ ...q, [tab]: e.target.value })),
      clear: () => setQueries((q) => ({ ...q, [tab]: '' })),
      active: queries[tab].trim().length > 0,
      resultCount: tab === 'pending' ? pending.length : issuedRows.length,
    },
    filters: {
      status,
      statusOptions: STATUS_OPTIONS,
      onStatus: (e: ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as 'all' | InvoiceStatus),
    },
    openEmit: (orderId: string) => openModal(BILLING_MODALS.emit, orderId),
    openPreview: (invoice: Invoice) => openModal(BILLING_MODALS.preview, invoice.id),
    promptVoid,
  }
}

export type BillingApi = ReturnType<typeof useBilling>

/** Último correlativo interno emitido (implementa el puerto de Ajustes). */
export function useLastIssuedInvoiceNumber(): number {
  const invoices = useBillingStore((s) => s.invoices)
  return lastInternalNumber(invoices)
}
