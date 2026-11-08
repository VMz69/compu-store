import { uiMeta } from '@/ui-traceability'

interface ThemeToggleProps {
  isDark: boolean
  onToggle: () => void
  compact?: boolean
  traceId: string
  source?: string
}

const SOURCE = 'src/components/layout/ThemeToggle.tsx'

export const ThemeToggle = ({
  isDark,
  onToggle,
  compact = false,
  traceId,
  source = SOURCE,
}: ThemeToggleProps) => {
  const label = isDark ? 'Modo Claro' : 'Modo Oscuro'
  const icon = isDark ? 'fa-sun text-amber-400' : 'fa-moon text-sky-300'

  if (compact) {
    return (
      <button
        type="button"
        onClick={onToggle}
        title="Cambiar tema claro / oscuro"
        aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
        aria-pressed={isDark}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-slate-100 text-slate-700 shadow-xs transition-all hover:border-brand hover:bg-brand hover:text-white focus:outline-none min-[400px]:h-10 min-[400px]:w-10 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:border-brand dark:hover:bg-brand cursor-pointer"
        {...uiMeta({ id: traceId, component: 'ThemeToggle', source })}
      >
        <i className={`fa-solid ${icon} text-lg min-[400px]:text-xl`} />
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={onToggle}
      title={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-label={isDark ? 'Cambiar a modo claro' : 'Cambiar a modo oscuro'}
      aria-pressed={isDark}
      className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-slate-200 hover:text-white transition-all border border-white/15 cursor-pointer text-xs font-semibold focus:outline-none"
      {...uiMeta({ id: traceId, component: 'ThemeToggle', source })}
    >
      <i className={`fa-solid ${icon} text-xs`} />
      <span>{label}</span>
    </button>
  )
}
