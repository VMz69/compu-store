import { ProductPicker, useProductPicker } from '@/00-director-catalogo'
import { Button, EmptyState } from '@/00-director-interfaz'
import { usePageMeta } from '@/shared/hooks/usePageMeta'
import { tracer } from '@/00-trazabilidad'
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
  usePageMeta({
    title: builder.isEdit ? `Editar pedido ${builder.orderId}` : 'Nuevo pedido',
    crumbs: [{ label: 'Pedidos', to: '/pedidos' }],
    backTo: { label: 'Pedidos', to: '/pedidos' },
    badge: builder.quoteId ? { label: `Desde ${builder.quoteId}`, icon: 'fa-solid fa-file-signature' } : undefined,
  })

  return (
    <div className="flex flex-col h-full animate-fade-in" {...t('sales.builder')}>
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
