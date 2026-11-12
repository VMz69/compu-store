import { useThemeStore } from '@/74-pipeline-tema-administrativo/02-theme.store'

export function useTheme() {
  const isDark = useThemeStore((s) => s.isDark)
  const toggle = useThemeStore((s) => s.toggle)
  return { isDark, toggle }
}
