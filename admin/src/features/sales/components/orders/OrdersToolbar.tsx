import type { ReactNode } from 'react'
import { ListToolbar, LiveSearch } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import { useOrderStatusTabs } from '../../hooks/useOrders'
import type { PaginatedOrdersApi } from '../../hooks/usePaginatedOrders'
import { OrderStatusTabs } from '../OrderStatusTabs'

const t = tracer('OrdersToolbar', 'src/features/sales/components/orders/OrdersToolbar.tsx')

interface OrdersToolbarProps {
  search: PaginatedOrdersApi['search']
  resultCount: number
  createButton: ReactNode
}

/** Barra estándar de listados: estados · buscador ··· "Nuevo pedido". */
export function OrdersToolbar({ search, resultCount, createButton }: OrdersToolbarProps) {
  const { activeLabel } = useOrderStatusTabs()

  return (
    <ListToolbar
      traceId="sales.toolbar"
      context={['Pedidos', activeLabel]}
      tabs={<OrderStatusTabs />}
      search={
        <LiveSearch
          value={search.value}
          onChange={search.onChange}
          onClear={search.clear}
          resultCount={resultCount}
          placeholder="Buscar pedido, cliente, teléfono, producto…"
          aria-label="Buscar pedidos"
          {...t('sales.search')}
        />
      }
      action={createButton}
    />
  )
}
