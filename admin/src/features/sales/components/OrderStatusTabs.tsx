import { cn } from '@/shared/lib/cn'
import { tracer } from '@/ui-traceability'
import { useOrderStatusTabs } from '../hooks/useOrders'

const t = tracer('OrderStatusTabs', 'src/features/sales/components/OrderStatusTabs.tsx')

const ACTIVE = 'bg-brand text-white shadow-2xs'
const IDLE = 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'

/** Pestañas de filtro por estado con conteo de órdenes. */
export function OrderStatusTabs() {
  const { tabs, active, select } = useOrderStatusTabs()

  return (
    <div
      className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar"
      role="tablist"
      aria-label="Filtrar pedidos por estado"
      {...t('sales.tabs')}
    >
      {tabs.map((tab) => (
        <button
          key={tab.value}
          type="button"
          role="tab"
          aria-selected={active === tab.value}
          className={cn(
            'px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5',
            active === tab.value ? ACTIVE : IDLE,
          )}
          onClick={() => select(tab.value)}
          {...t(`sales.tabs.${tab.value}`)}
        >
          {tab.icon && <i className={cn(tab.icon, 'text-[10px]')} aria-hidden="true" />}
          {tab.label}
        </button>
      ))}
    </div>
  )
}
