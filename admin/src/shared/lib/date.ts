const dateTime = new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium', timeStyle: 'short' })
const dateOnly = new Intl.DateTimeFormat('es-SV', { dateStyle: 'medium' })

/** "4 nov 2026, 8:12 a. m." · "—" si no hay fecha. */
export const formatDateTime = (iso: string | null | undefined): string =>
  iso ? dateTime.format(new Date(iso)) : '—'

/** "4 nov 2026" · "—" si no hay fecha. */
export const formatDate = (iso: string | null | undefined): string => (iso ? dateOnly.format(new Date(iso)) : '—')
