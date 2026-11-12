import { ProductPicker, useProductPicker } from '@/00-director-catalogo'
import { Button, EmptyState } from '@/00-director-interfaz'
import { usePageMeta } from '@/75-pipeline-estado-navegacion/00-director-estado-navegacion'
import { tracer } from '@/00-trazabilidad'
import { OfferPanel } from './03-OfferPanel'
import { useOfferBuilder } from './02-useOfferBuilder'

const t = tracer('OfferBuilderPage', 'src/53-pipeline-preparacion-ofertas/01-OfferBuilderPage.tsx')

/** /ofertas/nueva y /ofertas/:offerId/editar · Catálogo a la izquierda (clic agrega/quita), oferta a la derecha. */
export function OfferBuilderPage() {
  const b = useOfferBuilder()
  const picker = useProductPicker({ quantities: b.quantities })
  usePageMeta({
    title: b.readOnly ? 'Oferta vencida (solo lectura)' : b.isEdit ? 'Editar oferta' : 'Nueva oferta',
    crumbs: [{ label: 'Ofertas', to: '/ofertas' }],
    backTo: { label: 'Ofertas', to: '/ofertas' },
    badge: b.readOnly ? { label: 'Historial', tone: 'neutral' } : undefined,
  })

  return (
    <div className="flex flex-col h-full animate-fade-in" {...t('promotions.builder')}>
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
