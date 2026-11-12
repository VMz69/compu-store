import type { ReactNode } from 'react'
import { ListToolbar, LiveSearch, SegmentedTabs } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { OfferFilter, OffersApi } from '../../hooks/useOffers'

const t = tracer('OffersToolbar', 'src/features/promotions/components/list/OffersToolbar.tsx')

const OFFER_FILTERS: { id: OfferFilter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'vigente', label: 'Vigentes' },
  { id: 'programada', label: 'Programadas' },
  { id: 'pausada', label: 'Pausadas' },
  { id: 'vencida', label: 'Vencidas' },
]

/** Barra estándar de listados: estados · buscador ··· "Nueva oferta". */
export function OffersToolbar({ o, createButton }: { o: OffersApi; createButton: ReactNode }) {
  return (
    <ListToolbar
      traceId="promotions.toolbar"
      context={['Ofertas', o.areaLabel]}
      tabs={
        <SegmentedTabs
          items={OFFER_FILTERS.map((f) => ({ ...f, count: o.counts[f.id] }))}
          value={o.filter}
          onChange={o.setFilter}
          aria-label="Filtrar ofertas por estado"
          traceId="promotions.filter"
        />
      }
      search={
        <LiveSearch
          value={o.search.value}
          onChange={o.search.onChange}
          onClear={o.search.clear}
          resultCount={o.rows.length}
          placeholder="Buscar oferta, producto, SKU, descuento…"
          aria-label="Buscar ofertas"
          {...t('promotions.search')}
        />
      }
      action={createButton}
    />
  )
}
