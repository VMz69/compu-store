import { Link } from 'react-router-dom'
import type { Role } from '@/00-director-acceso'
import { RoleBadge } from '@/00-director-acceso'
import { cn } from '@/shared/lib/cn'
import type { PageBadge, PageCrumb } from '@/shared/store/pageMeta.store'
import { Breadcrumb } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'

const t = tracer('TopbarTitle', 'src/app/layout/topbar/TopbarTitle.tsx')

const BADGE: Record<NonNullable<PageBadge['tone']>, string> = {
  brand: 'bg-brand-50 text-brand border-brand/30 dark:bg-brand/10 dark:text-brand-300',
  neutral: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700',
}

interface TopbarTitleProps {
  title: string
  crumbs: PageCrumb[]
  backTo: PageCrumb | null
  badge: PageBadge | null
  role: Role | null
}

/**
 * Título ÚNICO de la vista (h1). En sub-vistas muestra encima la ruta de navegación
 * y un botón para volver; las páginas no repiten su título.
 */
export function TopbarTitle({ title, crumbs, backTo, badge, role }: TopbarTitleProps) {
  return (
    <div className="flex items-center gap-2.5 min-w-0" {...t('layout.topbar.title')}>
      {backTo && (
        <Link
          to={backTo.to}
          title={`Volver a ${backTo.label}`}
          aria-label={`Volver a ${backTo.label}`}
          className="w-8 h-8 shrink-0 rounded-lg border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-500 hover:text-brand hover:bg-brand-50 dark:hover:bg-slate-800 transition-colors"
          {...t('layout.topbar.back')}
        >
          <i className="fa-solid fa-arrow-left text-xs" aria-hidden="true" />
        </Link>
      )}
      <div className="min-w-0">
        {crumbs.length > 0 && <Breadcrumb items={[...crumbs.map((c) => ({ ...c, meta: t(`layout.topbar.crumb.${c.to}`) })), { label: title }]} />}
        <h1 className={cn('font-black text-slate-800 dark:text-slate-100 flex items-center gap-2 min-w-0', crumbs.length ? 'text-sm leading-tight' : 'text-base')}>
          <span className="truncate">{title}</span>
          {badge && (
            <span className={cn('shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md border text-[10px] font-bold', BADGE[badge.tone ?? 'brand'])}>
              {badge.icon && <i className={badge.icon} aria-hidden="true" />}
              {badge.label}
            </span>
          )}
          {role && <span className="shrink-0 hidden sm:inline-flex"><RoleBadge role={role} /></span>}
        </h1>
      </div>
    </div>
  )
}
