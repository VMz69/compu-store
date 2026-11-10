import { IconButton } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { useTopbar } from '../../hooks/useLayout'
import { ThemeToggle } from './ThemeToggle'
import { TopbarShortcut } from './TopbarShortcut'
import { TopbarTitle } from './TopbarTitle'

const t = tracer('Topbar', 'src/app/layout/topbar/Topbar.tsx')

/** Barra superior: colapsar menú, título único de la vista, sucursal, tema y accesos directos (Ajustes). */
export function Topbar() {
  const { title, crumbs, backTo, badge, role, isSidebarOpen, toggleSidebar, shortcuts } = useTopbar()

  return (
    <header
      className="h-14 px-5 flex items-center justify-between gap-3 border-b border-slate-200 dark:border-slate-800 shrink-0 bg-white dark:bg-slate-900"
      {...t('layout.topbar')}
    >
      <div className="flex items-center gap-3 min-w-0">
        <IconButton
          icon={isSidebarOpen ? 'fa-solid fa-bars-staggered' : 'fa-solid fa-bars'}
          label="Colapsar Menú"
          iconClass="text-sm"
          aria-expanded={isSidebarOpen}
          onClick={toggleSidebar}
          {...t('layout.topbar.toggle-sidebar')}
        />
        <TopbarTitle title={title} crumbs={crumbs} backTo={backTo} badge={badge} role={role} />
      </div>

      <div className="flex items-center gap-2.5">
        <div
          className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 text-xs font-bold"
          {...t('layout.topbar.branch')}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" aria-hidden="true" />
          <span>Cojutepeque</span>
        </div>
        <ThemeToggle />
        {shortcuts.map((item) => (
          <TopbarShortcut key={item.id} id={item.id} to={item.to} label={item.label} icon={item.icon} isActive={item.isActive} />
        ))}
      </div>
    </header>
  )
}
