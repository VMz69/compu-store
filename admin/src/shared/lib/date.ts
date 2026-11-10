const dateTime = new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium', timeStyle: 'short' })
const dateOnly = new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium' })

/** "4 nov 2026, 8:12 a. m." · "—" si no hay fecha. */
export const formatDateTime = (iso: string | null | undefined): string =>
  iso ? dateTime.format(new Date(iso)) : '—'

/** "4 nov 2026" · "—" si no hay fecha. */
export const formatDate = (iso: string | null | undefined): string => (iso ? dateOnly.format(new Date(iso)) : '—')

const shortDate = new Intl.DateTimeFormat('es-SV', { day: '2-digit', month: 'short', year: 'numeric' })
const shortTime = new Intl.DateTimeFormat('es-SV', { hour: 'numeric', minute: '2-digit' })

/** Fecha local "YYYY-MM-DD HH:mm" → { date: "02 nov 2026", time: "9:40 a. m." }. */
export function localStampParts(stamp: string): { date: string; time: string } {
  const d = new Date(stamp.replace(' ', 'T'))
  return Number.isNaN(d.getTime()) ? { date: stamp || '—', time: '' } : { date: shortDate.format(d), time: shortTime.format(d) }
}
