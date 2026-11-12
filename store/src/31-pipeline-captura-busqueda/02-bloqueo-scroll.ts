import { useLayoutEffect } from 'react'

/**
 * Bloquea el scroll del documento mientras un overlay móvil (menú o búsqueda)
 * está desplegado. Usa `position: fixed` en el body, que es la única forma
 * fiable de detener el scroll táctil en iOS, manteniendo el header visible.
 */
export const useSearchLock = (active: boolean) => {
  useLayoutEffect(() => {
    if (!active) return
    if (window.matchMedia('(min-width: 1024px)').matches) return

    const header = document.querySelector<HTMLElement>('#store-sticky-header')
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth

    const previousBodyOverflow = document.body.style.overflow
    const previousBodyPosition = document.body.style.position
    const previousBodyTop = document.body.style.top
    const previousBodyLeft = document.body.style.left
    const previousBodyRight = document.body.style.right
    const previousBodyWidth = document.body.style.width
    const previousBodyTouchAction = document.body.style.touchAction
    const previousHtmlTouchAction = document.documentElement.style.touchAction
    const previousPaddingRight = document.body.style.paddingRight
    const previousHeaderPosition = header?.style.position ?? ''
    const previousHeaderTop = header?.style.top ?? ''
    const previousHeaderLeft = header?.style.left ?? ''
    const previousHeaderRight = header?.style.right ?? ''
    const previousHeaderZIndex = header?.style.zIndex ?? ''

    const scrollY = window.scrollY

    if (header) {
      header.style.position = 'fixed'
      header.style.top = '0'
      header.style.left = '0'
      header.style.right = '0'
      header.style.zIndex = '40'
    }

    document.body.style.overflow = 'hidden'
    document.body.style.position = 'fixed'
    document.body.style.top = `-${scrollY}px`
    document.body.style.left = '0'
    document.body.style.right = '0'
    document.body.style.width = '100%'
    document.documentElement.style.touchAction = 'none'
    document.body.style.touchAction = 'none'
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`
    }

    const handleTouchMove = (event: TouchEvent) => {
      const dropdown = document.querySelector('[data-search-dropdown]')
      if (dropdown && dropdown.contains(event.target as Node)) return
      event.preventDefault()
    }

    document.addEventListener('touchmove', handleTouchMove, { passive: false, capture: true })

    return () => {
      document.removeEventListener('touchmove', handleTouchMove, { capture: true })

      if (header) {
        header.style.position = previousHeaderPosition
        header.style.top = previousHeaderTop
        header.style.left = previousHeaderLeft
        header.style.right = previousHeaderRight
        header.style.zIndex = previousHeaderZIndex
      }

      document.body.style.overflow = previousBodyOverflow
      document.body.style.position = previousBodyPosition
      document.body.style.top = previousBodyTop
      document.body.style.left = previousBodyLeft
      document.body.style.right = previousBodyRight
      document.body.style.width = previousBodyWidth
      document.documentElement.style.touchAction = previousHtmlTouchAction
      document.body.style.touchAction = previousBodyTouchAction
      document.body.style.paddingRight = previousPaddingRight

      window.scrollTo({ top: scrollY, left: 0, behavior: 'instant' })
    }
  }, [active])
}
