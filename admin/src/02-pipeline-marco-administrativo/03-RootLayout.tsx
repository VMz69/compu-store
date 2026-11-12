import { Outlet } from 'react-router-dom'
import { tracer } from '@/00-trazabilidad'
import { Overlays } from './04-Overlays'

const t = tracer('RootLayout', 'src/02-pipeline-marco-administrativo/03-RootLayout.tsx')

/**
 * Marco raíz de la app. Las capas globales (modales, confirmación, toasts) viven
 * dentro del router para que sus acciones puedan navegar.
 */
export function RootLayout() {
  return (
    <div className="h-full w-full flex items-center justify-center p-2 sm:p-4">
      <div
        className="w-full h-full flex gap-3 sm:gap-4 relative overflow-hidden"
        {...t('app.root')}
      >
        <Outlet />
      </div>
      <Overlays />
    </div>
  )
}
