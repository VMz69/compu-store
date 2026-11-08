import { create } from 'zustand'

/**
 * Estado global de interfaz: overlays de navegación, slide activo del hero,
 * pestaña de producto y preferencia de tema.
 *
 * El tema se modela como `themePreference` (`system` | `light` | `dark`) más el
 * valor efectivo `isDark`. Sin preferencia manual, `isDark` sigue al sistema.
 */
export type ProductDetailTab = 'overview' | 'specs' | 'reviews'
export type ThemePreference = 'system' | 'light' | 'dark'

const THEME_STORAGE_KEY = 'compustore_sv_theme'

const getStoredThemePreference = (): ThemePreference => {
  try {
    const saved = localStorage.getItem(THEME_STORAGE_KEY)
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* almacenamiento no disponible */
  }
  return 'system'
}

const getSystemDarkMode = (): boolean => {
  try {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  } catch {
    return false
  }
}

const initialThemePreference = getStoredThemePreference()

interface UIState {
  /** Panel «Explorar» (categorías + marcas) de la navbar de escritorio. */
  isExploreMenuOpen: boolean
  isMobileMenuOpen: boolean
  /** Barra de compra fija inferior (móvil) activa: el layout reserva espacio y oculta el WhatsApp flotante. */
  isMobileActionBarVisible: boolean
  activeHeroSlide: number
  productDetailTab: ProductDetailTab
  isDark: boolean
  themePreference: ThemePreference
  toggleExploreMenu: (open?: boolean) => void
  toggleMobileMenu: (open?: boolean) => void
  setMobileActionBarVisible: (visible: boolean) => void
  closeOverlays: () => void
  setHeroSlide: (index: number, total: number) => void
  setProductDetailTab: (tab: ProductDetailTab) => void
  toggleDarkMode: () => void
  setDarkMode: (value: boolean) => void
  syncSystemTheme: (value: boolean) => void
}

export const useUIStore = create<UIState>((set, get) => ({
  isExploreMenuOpen: false,
  isMobileMenuOpen: false,
  isMobileActionBarVisible: false,
  activeHeroSlide: 0,
  productDetailTab: 'overview',
  isDark:
    initialThemePreference === 'system'
      ? getSystemDarkMode()
      : initialThemePreference === 'dark',
  themePreference: initialThemePreference,

  toggleExploreMenu: (open) => set({ isExploreMenuOpen: open ?? !get().isExploreMenuOpen }),

  toggleMobileMenu: (open) => set({ isMobileMenuOpen: open ?? !get().isMobileMenuOpen }),

  setMobileActionBarVisible: (visible) => set({ isMobileActionBarVisible: visible }),

  closeOverlays: () =>
    set({
      isExploreMenuOpen: false,
      isMobileMenuOpen: false,
    }),

  setHeroSlide: (index, total) =>
    set({ activeHeroSlide: total > 0 ? ((index % total) + total) % total : 0 }),

  setProductDetailTab: (tab) => set({ productDetailTab: tab }),

  toggleDarkMode: () => {
    const next = !get().isDark
    set({ isDark: next, themePreference: next ? 'dark' : 'light' })
  },

  setDarkMode: (value) =>
    set({ isDark: value, themePreference: value ? 'dark' : 'light' }),

  syncSystemTheme: (value) => set({ isDark: value }),
}))
