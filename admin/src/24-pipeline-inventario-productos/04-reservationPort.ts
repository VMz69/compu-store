/**
 * Puerto de STOCK RESERVADO (inversión de dependencias).
 *
 * Las reservas viven en Pedidos ("Confirmar y reservar"), que depende de Catálogo.
 * Para mostrar en Productos cuántas unidades están apartadas, Catálogo declara este
 * puerto y Pedidos lo implementa al cargarse (`provideReservedStock` en
 * `features/sales/index.ts`). Sin proveedor: nada reservado.
 */
export type ReservedStockHook = () => Record<string, number>

const none: Record<string, number> = {}
const port: { hook: ReservedStockHook } = { hook: () => none }

export const provideReservedStock = (hook: ReservedStockHook): void => {
  port.hook = hook
}

/** Unidades reservadas de un producto por pedidos con reserva vigente. */
export function useReservedUnits(productId: string): number {
  return port.hook()[productId] ?? 0
}
