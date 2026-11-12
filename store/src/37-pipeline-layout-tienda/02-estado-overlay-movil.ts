import { useLayoutEffect, useRef } from 'react'
import { useUIStore } from '@/02-pipeline-preferencias-interfaz/00-director-preferencias-interfaz'

/**
 * Controla el estado del menú móvil: bloquea el scroll de la página,
 * evita que quede abierto al pasar al layout de escritorio y permite cerrarlo
 * con Escape.
 *
 * No desplaza la página ni al abrir ni al cerrar: el header se fija mientras
 * el menú está abierto y el scroll se bloquea sin cambiar la posición.
 */
export const useMobileMenuOverlay = () => {
  const isOpen = useUIStore((state) => state.isMobileMenuOpen)
  const setMobileMenuOpen = useUIStore((state) => state.toggleMobileMenu)
  const scrollYRef = useRef(0)

  useLayoutEffect(() => {
    if (!isOpen) return

    scrollYRef.current = window.scrollY
    const header = document.querySelector<HTMLElement>('#store-sticky-header')
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

    const previousBodyOverflow = document.body.style.overflow
    const previousBodyTouchAction = document.body.style.touchAction
    const previousHtmlTouchAction = document.documentElement.style.touchAction
    const previousPaddingRight = document.body.style.paddingRight
    const previousHeaderPosition = header?.style.position ?? ''
    const previousHeaderTop = header?.style.top ?? ''
    const previousHeaderLeft = header?.style.left ?? ''
    const previousHeaderRight = header?.style.right ?? ''
    const previousHeaderZIndex = header?.style.zIndex ?? ''

    if (header) {
      header.style.position = 'fixed'
      header.style.top = '0'
      header.style.left = '0'
      header.style.right = '0'
      header.style.zIndex = '40'
    }

    document.body.style.overflow = 'hidden'
    document.documentElement.style.touchAction = 'none'
    document.body.style.touchAction = 'none'
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }

    const isInsideMenu = (target: EventTarget | null): boolean => {
      if (!(target instanceof Node)) return false
      const menu = document.getElementById('mobile-menu')
      return Boolean(menu && menu.contains(target))
    }

    const handleTouchMove = (event: TouchEvent) => {
      if (isInsideMenu(event.target)) return
      event.preventDefault()
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setMobileMenuOpen(false)
    }

    const desktopQuery = window.matchMedia('(min-width: 1024px)')
    const handleBreakpointChange = () => {
      if (desktopQuery.matches) setMobileMenuOpen(false)
    }

    document.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true })
    document.addEventListener('keydown', handleKeyDown)
    desktopQuery.addEventListener('change', handleBreakpointChange)

    return () => {
      document.removeEventListener('touchmove', handleTouchMove, { capture: true })
      document.removeEventListener('keydown', handleKeyDown)
      desktopQuery.removeEventListener('change', handleBreakpointChange)

      if (header) {
        header.style.position = previousHeaderPosition
        header.style.top = previousHeaderTop
        header.style.left = previousHeaderLeft
        header.style.right = previousHeaderRight
        header.style.zIndex = previousHeaderZIndex
      }

      document.body.style.overflow = previousBodyOverflow
      document.documentElement.style.touchAction = previousHtmlTouchAction
      document.body.style.touchAction = previousBodyTouchAction
      document.body.style.paddingRight = previousPaddingRight

      window.scrollTo({ top: scrollYRef.current, left: 0, behavior: 'instant' })
    }
  }, [isOpen, setMobileMenuOpen])

  return {
    isOpen,
    closeMenu: () => setMobileMenuOpen(false),
  }
}
