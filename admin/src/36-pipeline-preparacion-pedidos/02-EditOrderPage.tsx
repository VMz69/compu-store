import { useParams } from 'react-router-dom'
import { NewOrderPage } from './00-director-preparacion-pedidos'

/**
 * /pedidos/:orderId/editar · Reutiliza el constructor de pedidos en modo edición.
 * `key` por pedido: al navegar de un pedido a otro, el constructor se monta de
 * nuevo con los datos del pedido correcto (su estado inicial se toma al montar).
 */
export function EditOrderPage() {
  const { orderId } = useParams<{ orderId: string }>()
  return <NewOrderPage key={orderId} />
}
