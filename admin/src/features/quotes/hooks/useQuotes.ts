import { useMemo, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ensurePermission, usePermission } from '@/00-director-acceso'
import { SALES_MODALS, startOrderFromQuote, useQuoteOrderLink } from '@/00-director-ventas'
import { usePagination } from '@/70-pipeline-orden-paginacion/04-usePagination'
import { askConfirm } from '@/72-pipeline-confirmaciones-globales/03-confirm.store'
import { openModal } from '@/73-pipeline-modales-globales/03-modal.store'
import { toast } from '@/76-pipeline-avisos-globales/02-toast.store'
import { calcTotals, effectiveStatus, filterQuotes, isConvertible, QUOTE_STATUS_META, validUntil } from '../lib/quote.service'
import { QUOTES_MODALS } from '../modals'
import { useQuotesStore } from '../store'
import type { Quote, QuoteStatus, QuoteStoredStatus } from '../types'

export const QUOTE_PAGE_SIZES = [10, 25, 50]

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  ...(Object.keys(QUOTE_STATUS_META) as QuoteStatus[]).map((s) => ({ value: s, label: QUOTE_STATUS_META[s].label })),
]

const DENIED = 'No tienes permiso para gestionar cotizaciones'

/** Listado de cotizaciones: filtros, paginación, totales por fila y acciones. */
export function useQuotes() {
  const navigate = useNavigate()
  const quotes = useQuotesStore((s) => s.quotes)
  const setStatus = useQuotesStore((s) => s.setStatus)
  const deleteQuote = useQuotesStore((s) => s.deleteQuote)
  const canManage = usePermission('canManageQuotes')
  const canCreateOrders = usePermission('canChangeOrderStatus')
  const orderOf = useQuoteOrderLink()
  const [search, setSearch] = useState('')
  const [status, setStatusFilter] = useState<'all' | QuoteStatus>('all')

  const rows = useMemo(
    () =>
      filterQuotes(quotes, search, status, orderOf).map((quote) => ({
        quote,
        orderId: orderOf(quote.id),
        status: effectiveStatus(quote, orderOf(quote.id)),
        totals: calcTotals(quote.items, quote.charges ?? [], quote.issuer.taxRate),
        validUntil: validUntil(quote),
      })),
    [quotes, search, status, orderOf],
  )
  const { pageItems, pagination } = usePagination(rows, { pageSizeOptions: QUOTE_PAGE_SIZES, resetKey: `${search}|${status}` })

  const changeStatus = (quote: Quote, next: QuoteStoredStatus) => {
    if (!ensurePermission('canManageQuotes', DENIED)) return
    setStatus(quote.id, next)
    toast(`Cotización ${quote.id} marcada como ${QUOTE_STATUS_META[next].label.toLowerCase()}`, 'success')
  }

  const promptDelete = (quote: Quote) => {
    const orderId = orderOf(quote.id)
    if (orderId) return toast(`No se puede eliminar: la cotización originó el pedido ${orderId}.`, 'warning')
    askConfirm({
      title: 'Eliminar cotización',
      message: `¿Eliminar la cotización ${quote.id} de ${quote.customer.name}? Esta acción no se puede deshacer.`,
      confirmText: 'Eliminar',
      onConfirm: () => {
        if (!ensurePermission('canManageQuotes', DENIED)) return
        deleteQuote(quote.id)
        toast(`Cotización ${quote.id} eliminada`, 'info')
      },
    })
  }

  /**
   * Cotización → Pedido. Reglas: vigente (emitida o aceptada), sin pedido activo.
   * Se respetan precios y descuentos cotizados; el stock se valida en el constructor.
   */
  const convert = (quote: Quote) => {
    if (!ensurePermission('canChangeOrderStatus', 'No tienes permiso para registrar pedidos')) return
    const current = effectiveStatus(quote, orderOf(quote.id))
    if (!isConvertible(current)) return toast(`La cotización ${quote.id} está ${QUOTE_STATUS_META[current].label.toLowerCase()}: no se puede convertir.`, 'warning')
    const { customerId, name, phone, email } = quote.customer
    startOrderFromQuote({ quoteId: quote.id, customer: { customerId, name, phone, email }, items: quote.items, charges: quote.charges ?? [], notes: quote.notes })
    navigate('/pedidos/nuevo')
  }

  return {
    rows: pageItems,
    pagination,
    totalCount: rows.length,
    canManage,
    canConvert: canManage && canCreateOrders,
    filters: {
      search,
      status,
      statusOptions: STATUS_OPTIONS,
      onSearch: (e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value),
      clearSearch: () => setSearch(''),
      onStatus: (e: ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as 'all' | QuoteStatus),
    },
    openNew: () => navigate('/cotizaciones/nueva'),
    openPreview: (quote: Quote) => openModal(QUOTES_MODALS.preview, quote.id),
    accept: (quote: Quote) => changeStatus(quote, 'aceptada'),
    reject: (quote: Quote) => changeStatus(quote, 'rechazada'),
    promptDelete,
    convert,
    openOrder: (orderId: string) => openModal(SALES_MODALS.orderDetail, orderId),
  }
}

export type QuotesApi = ReturnType<typeof useQuotes>
export type QuoteRowData = QuotesApi['rows'][number]
