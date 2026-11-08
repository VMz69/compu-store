import { cn } from '@/shared/lib/cn'
import { useStatusStyle } from '../hooks/useOrders'

/** Badge de estado operativo con el estilo configurado en el pipeline. */
export function OrderStatusBadge({ status }: { status: string }) {
  const { icon, badgeStyle } = useStatusStyle(status)

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border whitespace-nowrap',
        badgeStyle,
      )}
    >
      <i className={cn('fa-solid', icon, 'text-[10px]')} aria-hidden="true" /> {status}
    </span>
  )
}
