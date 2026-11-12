import { useNavigate } from 'react-router-dom'
import { toast } from '@/76-pipeline-avisos-globales/02-toast.store'
import { useAccessStore } from '../store'

/** Cierre de sesión con redirección al login. */
export function useAccessActions() {
  const navigate = useNavigate()
  const logout = useAccessStore((s) => s.logout)

  return {
    logout: () => {
      logout()
      navigate('/login', { replace: true })
      toast('Sesión cerrada correctamente', 'info')
    },
  }
}
