import { cn } from '@/shared/lib/cn'
import { formatLongISO } from '@/shared/lib/date'
import { reservationDaysLeft, reservationLabel } from '../lib/reservation'

/** Etiqueta de vigencia de la reserva: "Quedan 3 días" (ámbar si vence hoy o mañana). */
export function ReservationTag({ until, className }: { until: string | null; className?: string }) {
  const label = reservationLabel(until)
  if (!until || !label) return null
  const urgent = reservationDaysLeft(until) <= 1

  return (
    <span
      title={`Reservado hasta ${formatLongISO(until)} (23:59)`}
      className={cn('inline-flex items-center gap-1 text-[10px] font-bold whitespace-nowrap', urgent ? 'text-amber-600 dark:text-amber-400' : 'text-slate-500 dark:text-slate-400', className)}
    >
      <i className="fa-solid fa-hourglass-half text-[9px]" aria-hidden="true" />
      {label}
    </span>
  )
}
