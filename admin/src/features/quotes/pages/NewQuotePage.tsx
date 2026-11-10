import { ProductPicker, useProductPicker } from '@/features/catalog'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { tracer } from '@/ui-traceability'
import { QuoteSummaryPanel } from '../components/builder/QuoteSummaryPanel'
import { useQuoteBuilder } from '../hooks/useQuoteBuilder'

const t = tracer('NewQuotePage', 'src/features/quotes/pages/NewQuotePage.tsx')

/**
 * /cotizaciones/nueva · Constructor a dos columnas.
 * Izquierda: catálogo (scroll propio). Derecha: resumen fijo con totales y "Generar".
 * En pantallas pequeñas las columnas se apilan y desplaza toda la vista.
 */
export function NewQuotePage() {
  const builder = useQuoteBuilder()
  const picker = useProductPicker({ quantities: builder.quantities })
  usePageMeta({ title: 'Nueva cotización', crumbs: [{ label: 'Cotizaciones', to: '/cotizaciones' }], backTo: { label: 'Cotizaciones', to: '/cotizaciones' } })

  return (
    <div className="flex flex-col h-full animate-fade-in" {...t('quotes.builder')}>
      <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden custom-scrollbar p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_480px] xl:grid-cols-[minmax(0,1fr)_540px] gap-5">
        <div className="lg:overflow-y-auto custom-scrollbar lg:pr-1">
          <ProductPicker picker={picker} onAdd={builder.addProduct} traceId="quotes.builder.picker" target="la cotización" />
        </div>
        <QuoteSummaryPanel b={builder} />
      </div>
    </div>
  )
}
