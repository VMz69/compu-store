import { create } from 'zustand'
import { LOGOS } from '@/85-pipeline-identificadores-texto/03-store.config'
import { STORAGE_KEYS, writeRaw } from '@/84-pipeline-persistencia-demo/02-storage'

interface ThemeState {
  isDark: boolean
  toggle: () => void
}

const applyTheme = (isDark: boolean): void => {
  document.documentElement.classList.toggle('dark', isDark)
  writeRaw(STORAGE_KEYS.THEME, isDark ? 'dark' : 'light')
  const icon = isDark ? LOGOS.iconOnDark : LOGOS.iconOnLight
  for (const id of ['app-favicon', 'app-apple-icon']) {
    const link = document.getElementById(id) as HTMLLinkElement | null
    if (link) link.href = icon
  }
}

/** El estado inicial lo fija el script de `index.html` antes del primer render. */
export const useThemeStore = create<ThemeState>()((set, get) => ({
  isDark: document.documentElement.classList.contains('dark'),
  toggle: () => {
    const next = !get().isDark
    applyTheme(next)
    set({ isDark: next })
  },
}))
