import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { useClickOutside } from '@/shared/hooks/useClickOutside'
import { useCatalogStats } from '@/features/catalog'
import { useUIStore } from '@/shared/store/ui.store'

/**
 * Estado de los menús de navegación: cierre por ruta, click fuera y overlays.
 */
export const useNavbar = () => {
  const navRef = useRef<HTMLElement | null>(null)
  const { pathname } = useLocation()
  const { categoriesWithCounts, brandsWithCounts } = useCatalogStats()

  const isCategoryDropdownOpen = useUIStore((state) => state.isCategoryDropdownOpen)
  const isBrandDropdownOpen = useUIStore((state) => state.isBrandDropdownOpen)
  const isMobileMenuOpen = useUIStore((state) => state.isMobileMenuOpen)
  const toggleCategoryDropdown = useUIStore((state) => state.toggleCategoryDropdown)
  const toggleBrandDropdown = useUIStore((state) => state.toggleBrandDropdown)
  const toggleMobileMenu = useUIStore((state) => state.toggleMobileMenu)
  const closeOverlays = useUIStore((state) => state.closeOverlays)

  useEffect(() => {
    closeOverlays()
  }, [pathname, closeOverlays])

  useClickOutside(
    navRef,
    closeOverlays,
    isCategoryDropdownOpen || isBrandDropdownOpen || isMobileMenuOpen,
  )

  return {
    navRef,
    pathname,
    categories: categoriesWithCounts,
    brands: brandsWithCounts,
    isCategoryDropdownOpen,
    isBrandDropdownOpen,
    isMobileMenuOpen,
    toggleCategoryDropdown,
    toggleBrandDropdown,
    toggleMobileMenu,
    closeOverlays,
  }
}
