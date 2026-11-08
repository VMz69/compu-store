import { Outlet } from 'react-router-dom'
import { tracer } from '@/ui-traceability'
import { Sidebar } from './sidebar/Sidebar'
import { Topbar } from './topbar/Topbar'

const t = tracer('AdminLayout', 'src/app/layout/AdminLayout.tsx')

/** Shell autenticado: sidebar + área principal (topbar + vista activa). */
export function AdminLayout() {
  return (
    <>
      <Sidebar />
      <main
        className="flex-1 min-w-0 bg-white dark:bg-slate-900 rounded-2xl shadow-soft-card flex flex-col overflow-hidden relative border border-slate-200 dark:border-slate-800 transition-colors"
        {...t('layout.main')}
      >
        <Topbar />
        <div
          className="flex-1 overflow-hidden flex flex-col relative bg-slate-50/50 dark:bg-slate-950/40"
          {...t('layout.view')}
        >
          <Outlet />
        </div>
      </main>
    </>
  )
}
