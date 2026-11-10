import { cn } from '@/shared/lib/cn'
import { Button, DataTable, EmptyState, PageContainer, PageHeader, type TableHeader } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { OfferRow } from '../components/list/OfferRow'
import { useOffers, type OfferFilter } from '../hooks/useOffers'

const t = tracer('PromotionsPage', 'src/features/promotions/pages/PromotionsPage.tsx')

const FILTERS: { id: OfferFilter; label: string }[] = [
  { id: 'all', label: 'Todas' },
  { id: 'vigente', label: 'Vigentes' },
  { id: 'programada', label: 'Programadas' },
  { id: 'pausada', label: 'Pausadas' },
  { id: 'vencida', label: 'Vencidas' },
]

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
    <PageContainer {...t('promotions')}>
      <PageHeader
        title="Ofertas"
        subtitle="Descuentos con vigencia por producto. El precio del producto no cambia: la oferta aplica mientras está vigente."
        action={o.canManage && <Button icon="fa-solid fa-tag" onClick={o.create} {...t('promotions.create')}>Nueva oferta</Button>}
      />

      <div className="flex flex-wrap items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 self-start w-fit" role="tablist" aria-label="Filtrar ofertas por estado">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            role="tab"
            aria-selected={o.filter === f.id}
            onClick={() => o.setFilter(f.id)}
            className={cn('px-3 py-1.5 rounded-lg text-xs font-bold transition-all', o.filter === f.id ? 'bg-white dark:bg-slate-900 text-brand shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200')}
            {...t(`promotions.filter.${f.id}`)}
          >
            {f.label} <span className="text-[10px] tabular-nums opacity-70">{o.counts[f.id]}</span>
          </button>
        ))}
      </div>

      {o.rows.length === 0 ? (
        <EmptyState icon="fa-solid fa-tags" title="No hay ofertas en este estado." action={o.canManage && <Button size="md" onClick={o.create} {...t('promotions.empty.create')}>Crear oferta</Button>} {...t('promotions.empty')} />
      ) : (
        <DataTable headers={HEADERS} {...t('promotions.table')}>
          {o.rows.map((row) => <OfferRow key={row.offer.id} row={row} api={o} />)}
        </DataTable>
      )}
    </PageContainer>
  )
}
