import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

/**
 * Lleva la vista al inicio al cambiar de ruta, sin animación, para que la
 * nueva página se muestre desde arriba de inmediato.
 */
export const useScrollToTop = () => {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' })
  }, [pathname])
}
