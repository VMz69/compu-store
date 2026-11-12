import { Link } from 'react-router-dom'
import { cn } from '@/shared/lib/cn'
import { tracer } from '@/00-trazabilidad'

const t = tracer('TopbarShortcut', 'src/app/layout/topbar/TopbarShortcut.tsx')

interface TopbarShortcutProps {
  id: string
  to: string
  label: string
  icon: string
  isActive: boolean
}

/** Acceso directo de la barra superior (mismo formato que el interruptor de tema). */
export function TopbarShortcut({ id, to, label, icon, isActive }: TopbarShortcutProps) {
  return (
    <Link
      to={to}
      title={label}
      aria-label={label}
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'w-8 h-8 rounded-lg border flex items-center justify-center transition-colors',
        isActive
          ? 'bg-brand border-brand text-white shadow-brand-glow'
          : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:text-brand hover:bg-brand-50 dark:hover:bg-slate-800',
      )}
      {...t(`layout.topbar.shortcut.${id}`)}
    >
      <i className={cn(icon, 'text-xs')} aria-hidden="true" />
    </Link>
  )
}
