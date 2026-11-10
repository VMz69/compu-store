import { Link } from 'react-router-dom'
import { ProductPicker, useProductPicker } from '@/features/catalog'
import { Badge, Breadcrumb, Button, EmptyState } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { OfferPanel } from '../components/builder/OfferPanel'
import { useOfferBuilder } from '../hooks/useOfferBuilder'

const t = tracer('OfferBuilderPage', 'src/features/promotions/pages/OfferBuilderPage.tsx')

/** /ofertas/nueva y /ofertas/:offerId/editar · Catálogo a la izquierda (clic agrega/quita), oferta a la derecha. */
export function OfferBuilderPage() {
  const b = useOfferBuilder()
  const picker = useProductPicker({ quantities: b.quantities })
  const title = b.readOnly ? 'Oferta vencida (solo lectura)' : b.isEdit ? 'Editar oferta' : 'Nueva oferta'

  return (
    <div className="flex flex-col h-full animate-fade-in" {...t('promotions.builder')}>
      <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex items-center gap-3">
        <Link to="/ofertas" aria-label="Volver a ofertas" className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-brand transition-colors" {...t('promotions.builder.back')}>
          <i className="fa-solid fa-arrow-left text-xs" aria-hidden="true" />
        </Link>
        <div className="min-w-0">
          <Breadcrumb items={[{ label: 'Ofertas', to: '/ofertas' }, { label: b.isEdit ? 'Editar' : 'Nueva' }]} />
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            {title}
            {b.readOnly && <Badge tone="neutral">Historial</Badge>}
          </h3>
        </div>
      </div>

      {b.notFound ? (
        <EmptyState icon="fa-solid fa-tags" title="La oferta no existe o fue eliminada." action={<Button variant="outline" size="md" onClick={b.cancel} {...t('promotions.builder.not-found.back')}>Volver a ofertas</Button>} {...t('promotions.builder.not-found')} />
      ) : (
        <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden custom-scrollbar p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_480px] xl:grid-cols-[minmax(0,1fr)_540px] gap-5">
          <div className="lg:overflow-y-auto custom-scrollbar lg:pr-1">
            <ProductPicker picker={picker} onAdd={b.readOnly ? () => undefined : b.toggleProduct} traceId="promotions.builder.picker" target="la oferta" />
          </div>
          <OfferPanel b={b} />
        </div>
      )}
    </div>
  )
}
