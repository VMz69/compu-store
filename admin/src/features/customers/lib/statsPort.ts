import type { Customer, CustomerStats } from '../types'

/**
 * Puerto de métricas de compra (inversión de dependencias).
 *
 * Problema: Pedidos necesita el directorio de clientes (para registrar un
 * pedido) y Clientes necesita los pedidos (para sus métricas). Si ambos se
 * importaran, habría una dependencia circular entre features.
 *
 * Solución: Clientes declara este puerto y Pedidos lo implementa al cargarse
 * (`provideCustomerStats` en `features/sales/index.ts`). Clientes nunca
 * importa Pedidos. Sin proveedor, las métricas salen en cero.
 */
export type CustomerStatsResolver = (customer: Customer) => CustomerStats

/** Hook proveedor: debe ser un hook de React estable (se llama en cada render). */
export type CustomerStatsHook = () => CustomerStatsResolver

const EMPTY_STATS: CustomerStats = { orderCount: 0, totalSpent: 0, lastOrderDate: null }
const emptyResolver: CustomerStatsResolver = () => EMPTY_STATS

const port: { hook: CustomerStatsHook } = { hook: () => emptyResolver }

export const provideCustomerStats = (hook: CustomerStatsHook): void => {
  port.hook = hook
}

/** Devuelve el resolvedor de métricas registrado por Pedidos. */
export function useCustomerStats(): CustomerStatsResolver {
  return port.hook()
}
