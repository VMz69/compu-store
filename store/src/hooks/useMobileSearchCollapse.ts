import { useEffect, useState } from 'react'

const MOBILE_QUERY = '(max-width: 1023px)'
const TOP_THRESHOLD = 24
const DIRECTION_THRESHOLD = 6

/**
 * Retrae el buscador móvil al hacer scroll hacia abajo y lo vuelve a mostrar
 * al hacer scroll hacia arriba o al llegar al inicio de la página.
 *
 * Se usan los gestos del usuario (wheel/touch) en lugar de comparar posiciones
 * de scroll, porque al plegar el header cambia la altura del documento y esa
 * diferencia podría interpretarse erróneamente como un scroll en sentido contrario.
 */
export const useMobileSearchCollapse = () => {
  const [isCollapsed, setIsCollapsed] = useState(false)

  useEffect(() => {
    const mobileQuery = window.matchMedia(MOBILE_QUERY)
    let lastTouchY = 0

    const setCollapsed = (next: boolean) => {
      setIsCollapsed((previous) => (previous === next ? previous : next))
    }

    const handleWheel = (event: WheelEvent) => {
      if (!mobileQuery.matches) return
      if (window.scrollY <= TOP_THRESHOLD) {
        setCollapsed(false)
        return
      }
      if (event.deltaY > 0) setCollapsed(true)
      else if (event.deltaY < 0) setCollapsed(false)
    }

    const handleTouchStart = (event: TouchEvent) => {
      if (!mobileQuery.matches || event.touches.length === 0) return
      lastTouchY = event.touches[0].clientY
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (!mobileQuery.matches || event.touches.length === 0) return

      const currentY = event.touches[0].clientY
      const delta = lastTouchY - currentY
      if (Math.abs(delta) < DIRECTION_THRESHOLD) return

      if (window.scrollY <= TOP_THRESHOLD) {
        setCollapsed(false)
      } else if (delta > 0) {
        setCollapsed(true)
      } else {
        setCollapsed(false)
      }

      lastTouchY = currentY
    }

    const handleScroll = () => {
      if (mobileQuery.matches && window.scrollY <= TOP_THRESHOLD) setCollapsed(false)
    }

    const handleResize = () => {
      if (!mobileQuery.matches) setCollapsed(false)
    }

    window.addEventListener('wheel', handleWheel, { passive: true })
    window.addEventListener('touchstart', handleTouchStart, { passive: true })
    window.addEventListener('touchmove', handleTouchMove, { passive: true })
    window.addEventListener('scroll', handleScroll, { passive: true })
    window.addEventListener('resize', handleResize)

    return () => {
      window.removeEventListener('wheel', handleWheel)
      window.removeEventListener('touchstart', handleTouchStart)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('scroll', handleScroll)
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return isCollapsed
}
