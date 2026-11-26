import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { refrescar } from '@/38-pipeline-datos-api/00-director-datos-api'

/**
 * Lleva la vista al inicio al cambiar de ruta, sin animación, para que la
 * nueva página se muestre desde arriba de inmediato. En el mismo cambio de ruta
 * refresca en segundo plano el catálogo y la identidad (máx. uno cada 10 s), para
 * que los cambios hechos en el admin se vean al navegar sin recargar.
 */
export const useScrollToTop = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
    void refrescar()
  }, [pathname])
}
