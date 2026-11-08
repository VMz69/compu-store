import { Navigate, Outlet } from 'react-router-dom'
import { ChangePasswordScreen, useSession } from '@/features/access'

/**
 * Protege el shell administrativo.
 * - Sin sesión (o usuario desactivado/eliminado) → login.
 * - Contraseña temporal pendiente → pantalla obligatoria de cambio de contraseña.
 */
export function RequireAuth() {
  const { isAuthenticated, mustChangePassword } = useSession()
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (mustChangePassword) return <ChangePasswordScreen />
  return <Outlet />
}
