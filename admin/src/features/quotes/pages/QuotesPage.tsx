import { Button, DataTable, EmptyState, Pagination, SearchInput, Select, type TableHeader } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { QuoteRow } from '../components/list/QuoteRow'
import { useQuotes } from '../hooks/useQuotes'

const t = tracer('QuotesPage', 'src/features/quotes/pages/QuotesPage.tsx')

const HEADERS: TableHeader[] = [
  { label: 'Cotización', className: 'px-4' },
  { label: 'Cliente' },
  { label: 'Detalle' },
  { label: 'Total', className: 'px-3 text-right' },
  { label: 'Estado' },
  { label: 'Emitida por' },
  { label: 'Acciones', className: 'px-4 text-right' },
]

/** /cotizaciones · Listado de cotizaciones emitidas con acceso al PDF formal. */
export function QuotesPage() {
  const api = useQuotes()
  const { filters } = api

  const newButton = (size: 'sm' | 'md', id: string) =>
    api.canManage && (
      <Button icon="fa-solid fa-file-circle-plus" size={size} onClick={api.openNew} {...t(id)}>
        Nueva cotización
      </Button>
    )

  return (
    <div className="flex flex-col h-full animate-fade-in" {...t('quotes')}>
      <div
        className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3"
        {...t('quotes.toolbar')}
      >
        <div className="flex flex-wrap items-center gap-2.5">
          <SearchInput
            wrapperClassName="w-72"
            value={filters.search}
            onChange={filters.onSearch}
            placeholder="Buscar por número, cliente o vendedor…"
            aria-label="Buscar cotizaciones"
            {...t('quotes.toolbar.search')}
          />
          <Select tone="filter" options={filters.statusOptions} value={filters.status} onChange={filters.onStatus} aria-label="Filtrar por estado" {...t('quotes.toolbar.status')} />
        </div>
        <div className="flex items-center gap-2.5">
          <span className="text-xs font-bold text-slate-400">{api.totalCount} cotizaciones</span>
          {newButton('sm', 'quotes.toolbar.create')}
        </div>
      </div>

      <div key={api.pagination.page} className="flex-1 p-4 sm:p-5 overflow-y-auto custom-scrollbar" {...t('quotes.content')}>
        {api.totalCount === 0 ? (
          <EmptyState
            icon="fa-solid fa-file-invoice-dollar"
            title="No hay cotizaciones que coincidan."
            hint="Ajusta los filtros o genera una nueva cotización."
            action={newButton('md', 'quotes.empty.create')}
          />
        ) : (
          <DataTable headers={HEADERS} {...t('quotes.table')}>
            {api.rows.map((row) => (
              <QuoteRow key={row.quote.id} row={row} actions={api} />
            ))}
          </DataTable>
        )}
      </div>

      <Pagination pagination={api.pagination} idPrefix="quotes" itemLabel="cotizaciones" />
    </div>
  )
}
