import { Link } from 'react-router-dom'
import { ProductPicker, useProductPicker } from '@/features/catalog'
import { Badge, Breadcrumb } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { OrderSummaryPanel } from '../components/builder/OrderSummaryPanel'
import { useOrderBuilder } from '../hooks/useOrderBuilder'

const t = tracer('NewOrderPage', 'src/features/sales/pages/NewOrderPage.tsx')

/**
 * /pedidos/nuevo · Constructor a dos columnas (mismo patrón que /cotizaciones/nueva).
 * Izquierda: catálogo con stock disponible (stock − reservado). Derecha: resumen y registro.
 */
export function NewOrderPage() {
  const builder = useOrderBuilder()
  const picker = useProductPicker({ quantities: builder.quantities, reserved: builder.reserved, limitToStock: true })

  return (
    <div className="flex flex-col h-full animate-fade-in" {...t('sales.builder')}>
      <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex items-center gap-3">
        <Link
          to="/pedidos"
          aria-label="Volver a pedidos"
          className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-brand transition-colors"
          {...t('sales.builder.back')}
        >
          <i className="fa-solid fa-arrow-left text-xs" aria-hidden="true" />
        </Link>
        <div className="min-w-0">
          <Breadcrumb items={[{ label: 'Pedidos', to: '/pedidos' }, { label: 'Nuevo' }]} />
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            Nuevo pedido
            {builder.quoteId && <Badge tone="brand" icon="fa-solid fa-file-signature">Desde {builder.quoteId}</Badge>}
          </h3>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden custom-scrollbar p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_440px] gap-5">
        <div className="lg:overflow-y-auto custom-scrollbar lg:pr-1">
          <ProductPicker picker={picker} onAdd={builder.addProduct} traceId="sales.builder.picker" target="el pedido" />
        </div>
        <OrderSummaryPanel b={builder} />
      </div>
    </div>
  )
}
