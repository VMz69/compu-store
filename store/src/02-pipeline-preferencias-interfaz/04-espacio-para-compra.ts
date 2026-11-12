import { useUIStore } from '@/02-pipeline-preferencias-interfaz/01-preferencias.store'

/**
 * Ajustes del layout según barras fijas activas (p. ej. barra de compra móvil).
 */
export const useLayoutInsets = () => {
  const hasMobileActionBar = useUIStore((state) => state.isMobileActionBarVisible)
  return { hasMobileActionBar }
}
