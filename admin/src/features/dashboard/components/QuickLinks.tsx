import { cn } from '@/shared/lib/cn'
import { tracer } from '@/00-trazabilidad'
import { QUICK_LINKS } from '../config/quickLinks.config'

const t = tracer('QuickLinks', 'src/features/dashboard/components/QuickLinks.tsx')

export function QuickLinks({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <div className="pt-3 border-t border-slate-100 dark:border-slate-800" {...t('dashboard.quick-links')}>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
        Accesos Rápidos
      </span>
      <div className="grid grid-cols-2 gap-2">
        {QUICK_LINKS.map((link) => (
          <button
            key={link.id}
            type="button"
            className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 hover:bg-brand hover:text-white transition-colors text-left text-xs font-bold flex items-center gap-2 text-slate-700 dark:text-slate-200"
            onClick={() => onNavigate(link.to)}
            {...t(`dashboard.quick-links.${link.id}`)}
          >
            <i className={cn(link.icon)} aria-hidden="true" /> {link.label}
          </button>
        ))}
      </div>
    </div>
  )
}
