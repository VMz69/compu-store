import { Link } from 'react-router-dom'
import { ProductPicker, useProductPicker } from '@/features/catalog'
import { Breadcrumb } from '@/shared/ui'
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

  return (
    <div className="flex flex-col h-full animate-fade-in" {...t('quotes.builder')}>
      <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex items-center gap-3">
        <Link
          to="/cotizaciones"
          aria-label="Volver a cotizaciones"
          className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-brand transition-colors"
          {...t('quotes.builder.back')}
        >
          <i className="fa-solid fa-arrow-left text-xs" aria-hidden="true" />
        </Link>
        <div>
          <Breadcrumb items={[{ label: 'Cotizaciones', to: '/cotizaciones' }, { label: 'Nueva' }]} />
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100">Nueva cotización</h3>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden custom-scrollbar p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_420px] gap-5">
        <div className="lg:overflow-y-auto custom-scrollbar lg:pr-1">
          <ProductPicker picker={picker} onAdd={builder.addProduct} traceId="quotes.builder.picker" target="la cotización" />
        </div>
        <QuoteSummaryPanel b={builder} />
      </div>
    </div>
  )
}
