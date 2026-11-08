import { useEffect } from 'react'
import { useUIStore } from '@/store/useUIStore'

const THEME_STORAGE_KEY = 'compustore_sv_theme'

/**
 * Sincroniza el tema de la aplicación con el DOM.
 *
 * - Con preferencia `system` sigue `prefers-color-scheme` en vivo y no escribe
 *   nada en `localStorage`.
 * - Con preferencia manual (`light` / `dark`) persiste la elección.
 *
 * Debe invocarse una sola vez, en el shell de la aplicación (`MainLayout`).
 */
export const useTheme = () => {
  const isDark = useUIStore((state) => state.isDark)
  const themePreference = useUIStore((state) => state.themePreference)
  const toggleDarkMode = useUIStore((state) => state.toggleDarkMode)
  const syncSystemTheme = useUIStore((state) => state.syncSystemTheme)

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark)
    document.documentElement.style.colorScheme = isDark ? 'dark' : 'light'

    try {
      if (themePreference === 'system') {
        localStorage.removeItem(THEME_STORAGE_KEY)
      } else {
        localStorage.setItem(THEME_STORAGE_KEY, isDark ? 'dark' : 'light')
      }
    } catch {
      /* almacenamiento no disponible */
    }
  }, [isDark, themePreference])

  useEffect(() => {
    if (themePreference !== 'system') return

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    const handleChange = (event: MediaQueryListEvent) => syncSystemTheme(event.matches)

    mediaQuery.addEventListener('change', handleChange)
    return () => mediaQuery.removeEventListener('change', handleChange)
  }, [themePreference, syncSystemTheme])

  return { isDark, themePreference, toggleDarkMode }
}
