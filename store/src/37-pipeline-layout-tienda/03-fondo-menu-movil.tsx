import { useMobileMenuOverlay } from './02-estado-overlay-movil'
import { uiMeta } from '@/04-trazabilidad-ui'

const SOURCE = 'src/37-pipeline-layout-tienda/03-fondo-menu-movil.tsx'

export const MobileMenuBackdrop = () => {
  const { isOpen, closeMenu } = useMobileMenuOverlay()

  if (!isOpen) return null

  return (
    <div
      aria-hidden="true"
      onClick={closeMenu}
      className="fixed inset-0 z-30 touch-none overscroll-contain bg-slate-950/55 backdrop-blur-[2px] animate-fade-in lg:hidden"
      {...uiMeta({
        id: 'layout.mobile-menu.backdrop',
        component: 'MobileMenuBackdrop',
        source: SOURCE,
      })}
    />
  )
}
