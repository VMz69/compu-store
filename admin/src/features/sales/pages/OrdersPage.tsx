import { Button, EmptyState, Pagination } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import { OrdersTable } from '../components/orders/OrdersTable'
import { OrdersToolbar } from '../components/orders/OrdersToolbar'
import { useOrderActions } from '../hooks/useOrderActions'
import { usePaginatedOrders } from '../hooks/usePaginatedOrders'

const t = tracer('OrdersPage', 'src/features/sales/pages/OrdersPage.tsx')

export function OrdersPage() {
  const { orders, totalCount, pagination, sort, onSort, search } = usePaginatedOrders()
  const actions = useOrderActions()

  const createButton = (label: string, size: 'sm' | 'md', id: string) =>
    actions.canChangeStatus && (
      <Button icon="fa-solid fa-cart-plus" size={size} onClick={actions.openCreate} {...t(id)}>
        {label}
      </Button>
    )

  return (
    <div className="flex flex-col h-full animate-fade-in" {...t('sales.orders')}>
      <OrdersToolbar search={search} resultCount={totalCount} createButton={createButton('Nuevo pedido', 'sm', 'sales.toolbar.create')} />

      {/* `key` por página: al cambiar de página el contenedor se remonta y el scroll vuelve arriba. */}
      <div key={pagination.page} className="flex-1 p-5 overflow-y-auto custom-scrollbar" {...t('sales.orders.content')}>
        {totalCount === 0 ? (
          search.active ? (
            <EmptyState
              icon="fa-solid fa-magnifying-glass"
              title={`Sin pedidos para «${search.value.trim()}».`}
              hint="Prueba con otras palabras o cambia la pestaña de estado."
              action={<Button variant="outline" size="md" onClick={search.clear} {...t('sales.search.clear')}>Limpiar búsqueda</Button>}
              {...t('sales.search.empty')}
            />
          ) : (
            <EmptyState
              icon="fa-solid fa-receipt"
              title="No hay órdenes registradas bajo este filtro."
              action={createButton('Registrar el primer pedido', 'md', 'sales.empty.create')}
              {...t('sales.empty')}
            />
          )
        ) : (
          <OrdersTable orders={orders} actions={actions} sort={sort} onSort={onSort} />
        )}
      </div>

      <Pagination pagination={pagination} idPrefix="sales" itemLabel="pedidos" />
    </div>
  )
}
