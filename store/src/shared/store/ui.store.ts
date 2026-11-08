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
  isCategoryDropdownOpen: boolean
  isBrandDropdownOpen: boolean
  isMobileMenuOpen: boolean
  activeHeroSlide: number
  productDetailTab: ProductDetailTab
  isDark: boolean
  themePreference: ThemePreference
  toggleCategoryDropdown: (open?: boolean) => void
  toggleBrandDropdown: (open?: boolean) => void
  toggleMobileMenu: (open?: boolean) => void
  closeOverlays: () => void
  setHeroSlide: (index: number, total: number) => void
  setProductDetailTab: (tab: ProductDetailTab) => void
  toggleDarkMode: () => void
  setDarkMode: (value: boolean) => void
  syncSystemTheme: (value: boolean) => void
}

export const useUIStore = create<UIState>((set, get) => ({
  isCategoryDropdownOpen: false,
  isBrandDropdownOpen: false,
  isMobileMenuOpen: false,
  activeHeroSlide: 0,
  productDetailTab: 'overview',
  isDark:
    initialThemePreference === 'system'
      ? getSystemDarkMode()
      : initialThemePreference === 'dark',
  themePreference: initialThemePreference,

  toggleCategoryDropdown: (open) => {
    const next = open ?? !get().isCategoryDropdownOpen
    set({ isCategoryDropdownOpen: next, isBrandDropdownOpen: false })
  },

  toggleBrandDropdown: (open) => {
    const next = open ?? !get().isBrandDropdownOpen
    set({ isBrandDropdownOpen: next, isCategoryDropdownOpen: false })
  },

  toggleMobileMenu: (open) => set({ isMobileMenuOpen: open ?? !get().isMobileMenuOpen }),

  closeOverlays: () =>
    set({
      isCategoryDropdownOpen: false,
      isBrandDropdownOpen: false,
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
