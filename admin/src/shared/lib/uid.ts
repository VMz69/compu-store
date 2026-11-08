let fallbackSequence = 0

/** Identificador único para keys de filas dinámicas (no se usa como id de negocio). */
export const uid = (): string =>
  typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `tmp-${Date.now().toString(36)}-${(fallbackSequence++).toString(36)}`
