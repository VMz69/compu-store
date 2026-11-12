import { Button, DataTable, EmptyState, Pagination, type TableHeader } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import { QuoteRow } from './03-QuoteRow'
import { QuotesToolbar } from './04-QuotesToolbar'
import { useQuotes } from './02-useQuotes'

const t = tracer('QuotesPage', 'src/48-pipeline-listado-cotizaciones/01-QuotesPage.tsx')

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

  const newButton = (size: 'sm' | 'md', id: string) =>
    api.canManage && (
      <Button icon="fa-solid fa-file-circle-plus" size={size} onClick={api.openNew} {...t(id)}>
        Nueva cotización
      </Button>
    )

  return (
    <div className="flex flex-col h-full animate-fade-in" {...t('quotes')}>
      <QuotesToolbar api={api} newButton={newButton('sm', 'quotes.toolbar.create')} />

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
