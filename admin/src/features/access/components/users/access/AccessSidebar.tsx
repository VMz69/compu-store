import { cn } from '@/shared/lib/cn'
import { tracer } from '@/00-trazabilidad'
import type { UserAccessApi } from '../../../hooks/useUserAccess'

const t = tracer('AccessSidebar', 'src/features/access/components/users/access/AccessSidebar.tsx')

/**
 * Réplica del menú lateral del usuario: cada vista con su interruptor de acceso
 * y conteo de acciones. Clic en el nombre = ver sus acciones a la derecha.
 */
export function AccessSidebar({ a }: { a: UserAccessApi }) {
  return (
    <nav className="bg-sidebar rounded-2xl p-3 text-white shadow-modal" aria-label="Vistas del menú" {...t('settings.access.sidebar')}>
      <p className="px-2 pt-1 pb-3 text-[10px] font-black uppercase tracking-wider text-sidebar-muted">Menú de {a.user?.name.split(' ').slice(-2).join(' ')}</p>
      <ul className="space-y-0.5">
        {a.views.map(({ def, enabled, actionsOn }) => {
          const selected = a.selected.def.id === def.id
          return (
            <li key={def.id} className={cn('flex items-center gap-1 rounded-xl transition-colors', selected ? 'bg-brand' : 'hover:bg-sidebar-hover')} {...t(`settings.access.view.${def.id}`)}>
              <button
                type="button"
                onClick={() => a.select(def.id)}
                aria-current={selected ? 'true' : undefined}
                className={cn('flex-1 min-w-0 flex items-center gap-3 px-3 py-2.5 text-left text-xs font-bold', !enabled && 'opacity-40 line-through decoration-white/40')}
                {...t(`settings.access.select.${def.id}`)}
              >
                <i className={cn(def.icon, 'w-4 text-center text-sm')} aria-hidden="true" />
                <span className="truncate">{def.label}</span>
                {enabled && def.actions.length > 0 && (
                  <span className={cn('ml-auto text-[10px] px-1.5 rounded-md tabular-nums', selected ? 'bg-white/20' : 'bg-white/10 text-sidebar-muted')}>
                    {actionsOn}/{def.actions.length}
                  </span>
                )}
              </button>
              <label className="pr-3 cursor-pointer" title={enabled ? `Quitar acceso a ${def.label}` : `Dar acceso a ${def.label}`}>
                <input
                  type="checkbox"
                  className="w-4 h-4 accent-emerald-500 cursor-pointer disabled:cursor-not-allowed"
                  checked={enabled}
                  disabled={Boolean(a.lockedReason)}
                  onChange={() => a.toggleView(def.id)}
                  aria-label={`Acceso a ${def.label}`}
                  {...t(`settings.access.toggle.${def.id}`)}
                />
              </label>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
