import { ConfirmDialog, Toaster } from '@/00-director-interfaz'
import { ModalHost } from './05-ModalHost'

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
