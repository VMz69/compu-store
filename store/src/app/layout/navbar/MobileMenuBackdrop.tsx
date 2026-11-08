import { useMobileMenuOverlay } from '../../hooks/useMobileMenuOverlay'
import { uiMeta } from '@/ui-traceability'

const SOURCE = 'src/app/layout/navbar/MobileMenuBackdrop.tsx'

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
