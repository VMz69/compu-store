import { RecentOrdersTable, type Order } from '@/features/sales'
import { Card, CardTitle } from '@/shared/ui'
import { tracer } from '@/ui-traceability'

const t = tracer('RecentOrdersPanel', 'src/features/dashboard/components/RecentOrdersPanel.tsx')

interface RecentOrdersPanelProps {
  orders: Order[]
  onSeeAll: () => void
}

export function RecentOrdersPanel({ orders, onSeeAll }: RecentOrdersPanelProps) {
  return (
    <Card className="lg:col-span-2 p-4 flex flex-col" {...t('dashboard.recent-orders')}>
      <div className="flex items-center justify-between mb-3">
        <div>
          <CardTitle>Órdenes Operativas Recientes</CardTitle>
          <p className="text-[10px] text-slate-400">Transacciones en sala de ventas y pedidos de la web</p>
        </div>
        <button
          type="button"
          className="text-xs font-bold text-brand hover:underline"
          onClick={onSeeAll}
          {...t('dashboard.recent-orders.see-all')}
        >
          Ver todos
        </button>
      </div>
      <RecentOrdersTable orders={orders} />
    </Card>
  )
}
