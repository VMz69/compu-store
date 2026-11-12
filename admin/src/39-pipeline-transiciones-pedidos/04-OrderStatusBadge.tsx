import { cn } from '@/83-pipeline-recursos-publicos/02-cn'
import { useStatusMeta } from '../35-pipeline-consulta-pedidos/00-director-consulta-pedidos'
import type { OrderStatusId } from '../42-pipeline-persistencia-pedidos/05-types'

/** Badge del estado del pedido con el estilo definido en el flujo. */
export function OrderStatusBadge({ status }: { status: OrderStatusId }) {
  const { name, icon, badgeStyle } = useStatusMeta(status)

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold border whitespace-nowrap', badgeStyle)}>
      <i className={cn('fa-solid', icon, 'text-[10px]')} aria-hidden="true" /> {name}
    </span>
  )
}
