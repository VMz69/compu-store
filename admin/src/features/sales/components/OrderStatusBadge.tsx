import { cn } from '@/shared/lib/cn'
import { statusOf } from '../lib/orderFlow'
import type { OrderStatusId } from '../types'

/** Badge del estado del pedido con el estilo definido en el flujo. */
export function OrderStatusBadge({ status }: { status: OrderStatusId }) {
  const { name, icon, badgeStyle } = statusOf(status)

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border whitespace-nowrap', badgeStyle)}>
      <i className={cn('fa-solid', icon, 'text-[10px]')} aria-hidden="true" /> {name}
    </span>
  )
}
