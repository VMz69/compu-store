import { useThemeStore } from '@/shared/store/theme.store'

export function useTheme() {
  const isDark = useThemeStore((s) => s.isDark)
  const toggle = useThemeStore((s) => s.toggle)
  return { isDark, toggle }
}
