import { Badge } from '@/00-director-interfaz'
import { useReservedUnits } from '../lib/reservationPort'

/**
 * Unidades apartadas por pedidos reservados. "Todo reservado" = disponible 0: no puede
 * agregarse a otro pedido y se oculta en la tienda web mientras dure la reserva.
 */
export function ReservedBadge({ productId, stock }: { productId: string; stock: number }) {
  const reserved = useReservedUnits(productId)
  if (reserved <= 0) return null
  const all = reserved >= stock

  return (
    <Badge tone={all ? 'warning' : 'neutral'} icon="fa-solid fa-lock" title={all ? 'Sin disponible: oculto en la tienda web mientras dure la reserva' : `${stock - reserved} disponible(s)`}>
      {all ? 'Todo reservado' : `${reserved} reservada(s)`}
    </Badge>
  )
}
