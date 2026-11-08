import { Card, CardTitle } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { Role } from '../../types'

const t = tracer('RoleMatrix', 'src/features/access/components/users/RoleMatrix.tsx')

/** Matriz de facultades: descripción y vistas habilitadas por rol. */
export function RoleMatrix({ roles }: { roles: Role[] }) {
  return (
    <Card className="p-5" {...t('settings.roles')}>
      <CardTitle className="mb-3">Matriz de Facultades por Nivel</CardTitle>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {roles.map((role) => (
          <div
            key={role.id}
            className="p-3.5 rounded-xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30"
            {...t(`settings.roles.role.${role.id}`)}
          >
            <div className="flex items-center gap-2 mb-2">
              <i className={`fa-solid ${role.icon} text-brand`} aria-hidden="true" />
              <h5 className="text-xs font-black text-slate-800 dark:text-slate-100">{role.name}</h5>
            </div>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-3 leading-relaxed">
              {role.description}
            </p>
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
              Vistas Habilitadas:
            </div>
            <div className="flex flex-wrap gap-1">
              {role.allowedViews.map((view) => (
                <span
                  key={view}
                  className="px-2 py-0.5 rounded bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-200 text-[10px] capitalize"
                >
                  {view}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}
