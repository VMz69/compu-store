import { Navigate } from 'react-router-dom'
import { useHomePath } from '@/features/access'

/** `/` → vista de inicio del rol (caja: /pedidos, servicio: /interacciones, resto: /tablero). */
export function HomeRedirect() {
  return <Navigate to={useHomePath()} replace />
}
