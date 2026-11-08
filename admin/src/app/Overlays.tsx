import { ConfirmDialog, Toaster } from '@/shared/ui'
import { ModalHost } from './ModalHost'

/** Capas globales: modal activo, confirmación y notificaciones. */
export function Overlays() {
  return (
    <>
      <ModalHost />
      <ConfirmDialog />
      <Toaster />
    </>
  )
}
