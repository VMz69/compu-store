import type { ReactNode } from 'react'
import { ListToolbar, LiveSearch, Select } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { QuotesApi } from './02-useQuotes'

const t = tracer('QuotesToolbar', 'src/features/quotes/components/list/QuotesToolbar.tsx')

interface QuotesToolbarProps {
  api: QuotesApi
  newButton: ReactNode
}

/** Barra estándar de listados: buscador · estado ··· "Nueva cotización". */
export function QuotesToolbar({ api, newButton }: QuotesToolbarProps) {
  const { filters } = api

  return (
    <ListToolbar
      traceId="quotes.toolbar"
      search={
        <LiveSearch
          value={filters.search}
          onChange={filters.onSearch}
          onClear={filters.clearSearch}
          resultCount={api.totalCount}
          placeholder="Buscar número, cliente, producto, vendedor…"
          aria-label="Buscar cotizaciones"
          {...t('quotes.toolbar.search')}
        />
      }
      filters={<Select tone="filter" options={filters.statusOptions} value={filters.status} onChange={filters.onStatus} aria-label="Filtrar por estado" {...t('quotes.toolbar.status')} />}
      action={newButton}
    />
  )
}
