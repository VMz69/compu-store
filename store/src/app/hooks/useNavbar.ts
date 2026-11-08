import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useClickOutside } from '@/shared/hooks/useClickOutside'
import { useCatalogStats } from '@/features/catalog'
import { useUIStore } from '@/shared/store/ui.store'

/** Ruta activa para un destino exacto o para cualquiera de sus subrutas. */
const matches = (pathname: string, exact: string[], prefixes: string[] = []) =>
  exact.includes(pathname) || prefixes.some((prefix) => pathname.startsWith(prefix))

/**
 * Estado de la navegación: panel «Explorar», menú móvil y ruta activa.
 * Cierra los overlays al cambiar de ruta, al hacer click fuera y con Esc.
 */
export const useNavbar = () => {
  const navRef = useRef<HTMLElement | null>(null)
  const { pathname } = useLocation()
  const { categoriesWithCounts, brandsWithCounts } = useCatalogStats()

  const isExploreMenuOpen = useUIStore((state) => state.isExploreMenuOpen)
  const isMobileMenuOpen = useUIStore((state) => state.isMobileMenuOpen)
  const toggleExploreMenu = useUIStore((state) => state.toggleExploreMenu)
  const closeOverlays = useUIStore((state) => state.closeOverlays)
  const isAnyOpen = isExploreMenuOpen || isMobileMenuOpen

  useEffect(() => {
    closeOverlays()
  }, [pathname, closeOverlays])

  useEffect(() => {
    if (!isAnyOpen) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeOverlays()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [isAnyOpen, closeOverlays])

  useClickOutside(navRef, closeOverlays, isAnyOpen)

  return {
    navRef,
    pathname,
    categories: categoriesWithCounts,
    brands: brandsWithCounts,
    isExploreMenuOpen,
    isMobileMenuOpen,
    isCatalogActive: matches(pathname, ['/categories', '/brands'], ['/category/', '/brand/']),
    isOffersActive: pathname === '/offers',
    toggleExploreMenu: () => toggleExploreMenu(),
    closeOverlays,
  }
}
