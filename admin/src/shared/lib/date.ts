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

/* ---------- Fechas locales "YYYY-MM-DD" (sin zona horaria: evitan desfases UTC) ---------- */

const pad2 = (n: number) => String(n).padStart(2, '0')

/** Date → "YYYY-MM-DD" en hora local. */
export const toLocalISO = (d: Date): string => `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`

/** "YYYY-MM-DD" → Date a las 00:00 locales (null si no es válida). */
export function parseLocalISO(iso: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso)
  if (!m) return null
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return d.getMonth() === Number(m[2]) - 1 ? d : null
}

export const todayISO = (): string => toLocalISO(new Date())

export const addDaysISO = (iso: string, days: number): string => {
  const d = parseLocalISO(iso) ?? new Date()
  d.setDate(d.getDate() + days)
  return toLocalISO(d)
}

/** Días completos entre dos fechas locales (b − a). */
export const daysBetweenISO = (a: string, b: string): number => {
  const da = parseLocalISO(a)
  const db = parseLocalISO(b)
  return da && db ? Math.round((db.getTime() - da.getTime()) / 86_400_000) : 0
}

const longDate = new Intl.DateTimeFormat('es-SV', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

/** "2026-11-13" → "viernes, 13 de noviembre de 2026" (o "—"). */
export const formatLongISO = (iso: string | null | undefined): string => {
  const d = iso ? parseLocalISO(iso) : null
  return d ? longDate.format(d) : '—'
}

/** "2026-11-13" → "13 nov 2026" (o "—"). */
export const formatShortISO = (iso: string | null | undefined): string => {
  const d = iso ? parseLocalISO(iso) : null
  return d ? shortDate.format(d) : '—'
}
