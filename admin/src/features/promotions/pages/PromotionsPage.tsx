import { Button, DataTable, EmptyState, PageContainer, type TableHeader } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { OfferRow } from '../components/list/OfferRow'
import { OffersToolbar } from '../components/list/OffersToolbar'
import { useOffers } from '../hooks/useOffers'

const t = tracer('PromotionsPage', 'src/features/promotions/pages/PromotionsPage.tsx')

const HEADERS: TableHeader[] = [
  { label: 'Oferta', className: 'px-4' },
  { label: 'Productos' },
  { label: 'Descuento' },
  { label: 'Vigencia' },
  { label: 'Margen mín.', className: 'px-3 text-right' },
  { label: 'Estado' },
  { label: 'Acciones', className: 'px-4 text-right' },
]

/** /ofertas · CRUD de ofertas: descuentos con vigencia sobre productos concretos. */
export function PromotionsPage() {
  const o = useOffers()

  return (
    <div className="flex flex-col h-full animate-fade-in" {...t('promotions')}>
      <OffersToolbar o={o} createButton={o.canManage && <Button icon="fa-solid fa-tag" onClick={o.create} {...t('promotions.create')}>Nueva oferta</Button>} />
      <PageContainer className="flex-1 min-h-0" {...t('promotions.content')}>

        {o.rows.length === 0 ? (
          o.search.active ? (
            <EmptyState
              icon="fa-solid fa-magnifying-glass"
              title={`Sin ofertas para «${o.search.value.trim()}».`}
              hint="Prueba con otras palabras o cambia el filtro de estado."
              action={<Button variant="outline" size="md" onClick={o.search.clear} {...t('promotions.search.clear')}>Limpiar búsqueda</Button>}
              {...t('promotions.search.empty')}
            />
          ) : (
            <EmptyState icon="fa-solid fa-tags" title="No hay ofertas en este estado." action={o.canManage && <Button size="md" onClick={o.create} {...t('promotions.empty.create')}>Crear oferta</Button>} {...t('promotions.empty')} />
          )
        ) : (
          <DataTable headers={HEADERS} {...t('promotions.table')}>
            {o.rows.map((row) => <OfferRow key={row.offer.id} row={row} api={o} />)}
          </DataTable>
        )}
      </PageContainer>
    </div>
  )
}
