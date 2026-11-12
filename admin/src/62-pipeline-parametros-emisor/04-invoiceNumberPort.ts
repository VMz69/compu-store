/**
 * Puerto del correlativo de facturas (inversión de dependencias).
 *
 * Facturación depende de Ajustes (lee la identidad del emisor), así que Ajustes no
 * puede importar Facturación. Para mostrar el último número emitido junto a la
 * semilla, Ajustes declara este puerto y Facturación lo implementa al cargarse
 * (`provideLastInvoiceNumber` en `features/billing/index.ts`). Sin proveedor: null.
 */
export type LastInvoiceNumberHook = () => number | null

const port: { hook: LastInvoiceNumberHook } = { hook: () => null }

export const provideLastInvoiceNumber = (hook: LastInvoiceNumberHook): void => {
  port.hook = hook
}

export function useLastInvoiceNumber(): number | null {
  return port.hook()
}
