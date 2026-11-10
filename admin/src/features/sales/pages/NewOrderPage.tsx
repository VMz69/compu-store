import { Link } from 'react-router-dom'
import { ProductPicker, useProductPicker } from '@/features/catalog'
import { Badge, Breadcrumb, Button, EmptyState } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { OrderSummaryPanel } from '../components/builder/OrderSummaryPanel'
import { useOrderBuilder } from '../hooks/useOrderBuilder'

const t = tracer('NewOrderPage', 'src/features/sales/pages/NewOrderPage.tsx')

/**
 * /pedidos/nuevo y /pedidos/:orderId/editar · Constructor a dos columnas (mismo patrón
 * que /cotizaciones/nueva). Izquierda: catálogo con stock disponible (stock − reservado).
 * Derecha: resumen y registro (o guardado de cambios).
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
          <Breadcrumb items={[{ label: 'Pedidos', to: '/pedidos' }, { label: builder.isEdit ? `Editar ${builder.orderId}` : 'Nuevo' }]} />
          <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            {builder.isEdit ? `Editar pedido ${builder.orderId}` : 'Nuevo pedido'}
            {builder.quoteId && <Badge tone="brand" icon="fa-solid fa-file-signature">Desde {builder.quoteId}</Badge>}
          </h3>
        </div>
      </div>

      {builder.blockedReason ? (
        <EmptyState
          icon="fa-solid fa-lock"
          title="Este pedido no se puede editar"
          hint={builder.blockedReason}
          action={<Button variant="outline" size="md" onClick={builder.cancel} {...t('sales.builder.blocked.back')}>Volver a pedidos</Button>}
          {...t('sales.builder.blocked')}
        />
      ) : (
      <div className="flex-1 min-h-0 overflow-y-auto lg:overflow-hidden custom-scrollbar p-4 sm:p-5 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_480px] xl:grid-cols-[minmax(0,1fr)_540px] gap-5">
        <div className="lg:overflow-y-auto custom-scrollbar lg:pr-1">
          <ProductPicker picker={picker} onAdd={builder.addProduct} traceId="sales.builder.picker" target="el pedido" />
        </div>
        <OrderSummaryPanel b={builder} />
      </div>
      )}
    </div>
  )
}
