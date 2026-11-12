import { Outlet } from 'react-router-dom'
import { useReservationExpiry } from '@/00-director-ventas'
import { tracer } from '@/00-trazabilidad'
import { Sidebar } from '../03-pipeline-navegacion-administrativa/00-director-navegacion-administrativa'
import { Topbar } from '../04-pipeline-cabecera-administrativa/00-director-cabecera-administrativa'

const t = tracer('AdminLayout', 'src/02-pipeline-marco-administrativo/01-AdminLayout.tsx')

/** Shell autenticado: sidebar + área principal (topbar + vista activa). */
export function AdminLayout() {
  // Libera las reservas vencidas mientras haya una sesión abierta (ver sales/lib/reservation.ts).
  useReservationExpiry()

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
