import { useUIStore } from '@/shared/store/ui.store'

/**
 * Ajustes del layout según barras fijas activas (p. ej. barra de compra móvil).
 */
export const useLayoutInsets = () => {
  const hasMobileActionBar = useUIStore((state) => state.isMobileActionBarVisible)
  return { hasMobileActionBar }
}
