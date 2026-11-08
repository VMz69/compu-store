import { useLocation } from 'react-router-dom'
import { useCart } from '@/hooks/useCart'
import { useFavorites } from '@/hooks/useFavorites'
import { useUIStore } from '@/store/useUIStore'

/**
 * Datos que necesita la barra superior (carrito, favoritos, tema y menú móvil).
 *
 * El tema se lee directamente del store porque su aplicación al DOM ocurre en
 * `MainLayout` mediante `useTheme`. Así el header es solo un consumidor y no
 * duplica efectos globales.
 */
export const useHeaderState = () => {
  const { pathname } = useLocation()
  const cart = useCart()
  const favorites = useFavorites()
  const isDark = useUIStore((state) => state.isDark)
  const toggleDarkMode = useUIStore((state) => state.toggleDarkMode)
  const isMobileMenuOpen = useUIStore((state) => state.isMobileMenuOpen)
  const toggleMobileMenu = useUIStore((state) => state.toggleMobileMenu)

  return {
    pathname,
    cartCount: cart.count,
    cartSubtotal: cart.subtotal,
    favoritesCount: favorites.count,
    isDark,
    toggleDarkMode,
    isMobileMenuOpen,
    toggleMobileMenu,
  }
}
