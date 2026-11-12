import { cn } from '@/83-pipeline-recursos-publicos/02-cn'
import { Card, Switch } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { UserAccessApi } from '../../../hooks/useUserAccess'

const t = tracer('ViewActionsPanel', 'src/features/access/components/users/access/ViewActionsPanel.tsx')

/** Acciones posibles dentro de la vista seleccionada (requieren acceso a la vista). */
export function ViewActionsPanel({ a }: { a: UserAccessApi }) {
  const { def, enabled, actions } = a.selected
  const locked = Boolean(a.lockedReason)

  return (
    <Card className="p-5 space-y-4" {...t(`settings.access.panel.${def.id}`)}>
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-xl bg-brand/10 text-brand flex items-center justify-center text-lg shrink-0" aria-hidden="true">
            <i className={def.icon} />
          </span>
          <div className="min-w-0">
            <h4 className="text-sm font-black text-slate-800 dark:text-slate-100">{def.label}</h4>
            <p className="text-[11px] text-slate-400">{enabled ? 'Visible en su menú' : 'Sin acceso: no aparece en su menú'}</p>
          </div>
        </div>
        <Switch checked={enabled} label={enabled ? `Quitar acceso a ${def.label}` : `Dar acceso a ${def.label}`} disabled={locked} onChange={() => a.toggleView(def.id)} {...t(`settings.access.panel.view.${def.id}`)} />
      </div>

      {actions.length === 0 ? (
        <p className="text-xs text-slate-500 dark:text-slate-400"><i className="fa-solid fa-eye mr-1.5 text-slate-400" aria-hidden="true" />Vista de solo consulta: no tiene acciones que habilitar.</p>
      ) : (
        <ul className="space-y-2" aria-label={`Acciones en ${def.label}`}>
          {actions.map((action) => (
            <li
              key={action.permission}
              className={cn('flex items-center justify-between gap-4 p-3 rounded-xl border transition-colors', action.on && enabled ? 'border-brand/30 bg-brand-50/50 dark:bg-brand/10' : 'border-slate-200 dark:border-slate-700', !enabled && 'opacity-50')}
              {...t(`settings.access.action.${action.permission}`)}
            >
              <div className="min-w-0">
                <p className="text-xs font-bold text-slate-800 dark:text-slate-100">{action.label}</p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">{action.description}</p>
              </div>
              <Switch checked={action.on && enabled} label={action.label} disabled={locked || !enabled} onChange={() => a.togglePermission(action.permission)} {...t(`settings.access.action.toggle.${action.permission}`)} />
            </li>
          ))}
        </ul>
      )}
      {!enabled && actions.length > 0 && <p className="text-[11px] text-slate-400">Habilita la vista para poder asignar sus acciones.</p>}
    </Card>
  )
}
