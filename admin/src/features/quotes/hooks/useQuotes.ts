import { useMemo, useState, type ChangeEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { ensurePermission, usePermission } from '@/features/access'
import { usePagination } from '@/shared/hooks/usePagination'
import { askConfirm } from '@/shared/store/confirm.store'
import { openModal } from '@/shared/store/modal.store'
import { toast } from '@/shared/store/toast.store'
import { calcTotals, effectiveStatus, filterQuotes, QUOTE_STATUS_META, validUntil } from '../lib/quote.service'
import { QUOTES_MODALS } from '../modals'
import { useQuotesStore } from '../store'
import type { Quote, QuoteStatus, QuoteStoredStatus } from '../types'

export const QUOTE_PAGE_SIZES = [10, 25, 50]

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  ...(Object.keys(QUOTE_STATUS_META) as QuoteStatus[]).map((s) => ({ value: s, label: QUOTE_STATUS_META[s].label })),
]

const DENIED = 'Su rol no puede gestionar cotizaciones'

/** Listado de cotizaciones: filtros, paginación, totales por fila y acciones. */
export function useQuotes() {
  const navigate = useNavigate()
  const quotes = useQuotesStore((s) => s.quotes)
  const setStatus = useQuotesStore((s) => s.setStatus)
  const deleteQuote = useQuotesStore((s) => s.deleteQuote)
  const canManage = usePermission('canManageQuotes')
  const [search, setSearch] = useState('')
  const [status, setStatusFilter] = useState<'all' | QuoteStatus>('all')

  const rows = useMemo(
    () =>
      filterQuotes(quotes, search, status).map((quote) => ({
        quote,
        status: effectiveStatus(quote),
        totals: calcTotals(quote.items, quote.issuer.taxRate),
        validUntil: validUntil(quote),
      })),
    [quotes, search, status],
  )
  const { pageItems, pagination } = usePagination(rows, { pageSizeOptions: QUOTE_PAGE_SIZES, resetKey: `${search}|${status}` })

  const changeStatus = (quote: Quote, next: QuoteStoredStatus) => {
    if (!ensurePermission('canManageQuotes', DENIED)) return
    setStatus(quote.id, next)
    toast(`Cotización ${quote.id} marcada como ${QUOTE_STATUS_META[next].label.toLowerCase()}`, 'success')
  }

  const promptDelete = (quote: Quote) =>
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

  return {
    rows: pageItems,
    pagination,
    totalCount: rows.length,
    canManage,
    filters: {
      search,
      status,
      statusOptions: STATUS_OPTIONS,
      onSearch: (e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value),
      onStatus: (e: ChangeEvent<HTMLSelectElement>) => setStatusFilter(e.target.value as 'all' | QuoteStatus),
    },
    openNew: () => navigate('/cotizaciones/nueva'),
    openPreview: (quote: Quote) => openModal(QUOTES_MODALS.preview, quote.id),
    accept: (quote: Quote) => changeStatus(quote, 'aceptada'),
    reject: (quote: Quote) => changeStatus(quote, 'rechazada'),
    promptDelete,
  }
}

export type QuotesApi = ReturnType<typeof useQuotes>
export type QuoteRowData = QuotesApi['rows'][number]
