import { Button, EmptyState, Pagination } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { OrderStatusTabs } from '../components/OrderStatusTabs'
import { OrdersTable } from '../components/orders/OrdersTable'
import { useOrderActions } from '../hooks/useOrderActions'
import { usePaginatedOrders } from '../hooks/usePaginatedOrders'

const t = tracer('OrdersPage', 'src/features/sales/pages/OrdersPage.tsx')

export function OrdersPage() {
  const { orders, totalCount, pagination, sort, onSort } = usePaginatedOrders()
  const actions = useOrderActions()

  const createButton = (label: string, size: 'sm' | 'md', id: string) =>
    actions.canChangeStatus && (
      <Button icon="fa-solid fa-cart-plus" size={size} onClick={actions.openCreate} {...t(id)}>
        {label}
      </Button>
    )

  return (
    <div className="flex flex-col h-full animate-fade-in" {...t('sales.orders')}>
      <div
        className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        {...t('sales.toolbar')}
      >
        <OrderStatusTabs />
        {createButton('Nuevo Pedido', 'sm', 'sales.toolbar.create')}
      </div>

      {/* `key` por página: al cambiar de página el contenedor se remonta y el scroll vuelve arriba. */}
      <div key={pagination.page} className="flex-1 p-5 overflow-y-auto custom-scrollbar" {...t('sales.orders.content')}>
        {totalCount === 0 ? (
          <EmptyState
            icon="fa-solid fa-receipt"
            title="No hay órdenes registradas bajo este filtro."
            action={createButton('Registrar el primer pedido', 'md', 'sales.empty.create')}
            {...t('sales.empty')}
          />
        ) : (
          <OrdersTable orders={orders} actions={actions} sort={sort} onSort={onSort} />
        )}
      </div>

      <Pagination pagination={pagination} idPrefix="sales" itemLabel="pedidos" />
    </div>
  )
}
