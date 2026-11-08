/**
 * Registro de datos de demostración por feature.
 *
 * Problema que resuelve: Ajustes › Mantenimiento necesita restablecer y
 * respaldar los datos de TODOS los features. Si importara cada feature
 * directamente, los features que a su vez usan Ajustes (p. ej. cotizaciones
 * lee la identidad comercial) crearían dependencias circulares.
 *
 * Solución: cada store se registra aquí al cargarse y Mantenimiento solo
 * recorre el registro. Agregar un feature nuevo no obliga a tocar Ajustes.
 *
 * @example
 * registerDemoData({ key: 'quotes', reset: () => store.reset(), snapshot: () => store.quotes })
 */
export interface DemoDataSource {
  /** Nombre de la sección en el respaldo JSON. */
  key: string
  /** Restaura los datos de fábrica. */
  reset: () => void
  /** Datos a incluir en el respaldo JSON. */
  snapshot: () => unknown
}

const sources = new Map<string, DemoDataSource>()

export const registerDemoData = (source: DemoDataSource): void => {
  sources.set(source.key, source)
}

export const resetRegisteredDemoData = (): void => sources.forEach((s) => s.reset())

export const snapshotRegisteredDemoData = (): Record<string, unknown> =>
  Object.fromEntries([...sources.values()].map((s) => [s.key, s.snapshot()]))
