import { useEffect } from 'react'
import { toast } from '@/shared/store/toast.store'
import { useSalesStore } from '../store'

/** Cada cuánto se revisan las reservas vencidas mientras el panel está abierto. */
const SWEEP_MS = 60_000

/**
 * Barrido de reservas vencidas (regla de `lib/reservation.ts`): al abrir el panel y
 * cada minuto, los pedidos reservados cuya fecha límite pasó vuelven a "Registrado" y
 * su stock se libera. Se monta una sola vez en el layout del back office.
 *
 * TODO(API): en producción lo hace el servidor (tarea programada), no el navegador.
 */
export function useReservationExpiry() {
  useEffect(() => {
    const sweep = () => {
      const expired = useSalesStore.getState().expireReservations()
      if (expired.length) {
        toast(`Reserva vencida: ${expired.join(', ')} volvió a Registrado y su stock se liberó.`, 'warning')
      }
    }
    sweep()
    const id = window.setInterval(sweep, SWEEP_MS)
    return () => window.clearInterval(id)
  }, [])
}
