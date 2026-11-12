import { useTheme } from '@/74-pipeline-tema-administrativo/00-director-tema-administrativo'
import { cn } from '@/83-pipeline-recursos-publicos/02-cn'
import { tracer } from '@/00-trazabilidad'

const t = tracer('ThemeToggle', 'src/04-pipeline-cabecera-administrativa/04-ThemeToggle.tsx')

export function ThemeToggle() {
  const { isDark, toggle } = useTheme()

  return (
    <button
      type="button"
      title="Alternar Modo Oscuro"
      aria-label="Alternar Modo Oscuro"
      aria-pressed={isDark}
      className="w-8 h-8 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:text-brand hover:bg-brand-50 dark:hover:bg-slate-800 transition-colors"
      onClick={toggle}
      {...t('layout.topbar.theme')}
    >
      <i
        className={cn('fa-solid text-xs', isDark ? 'fa-sun text-amber-400' : 'fa-moon text-slate-600')}
        aria-hidden="true"
      />
    </button>
  )
}
