import { create } from 'zustand'
import type { OrderPrefill } from '../42-pipeline-persistencia-pedidos/05-types'

/**
 * Pre-carga transitoria del constructor de pedidos (no se persiste).
 * Cotizaciones la deja lista antes de navegar a /pedidos/nuevo; el
 * constructor la lee al montar y la limpia para que no reaparezca.
 */
interface PrefillState {
  prefill: OrderPrefill | null
}

export const useOrderPrefillStore = create<PrefillState>()(() => ({ prefill: null }))

export const startOrderFromQuote = (prefill: OrderPrefill): void => useOrderPrefillStore.setState({ prefill })

export const peekOrderPrefill = (): OrderPrefill | null => useOrderPrefillStore.getState().prefill

export const clearOrderPrefill = (): void => useOrderPrefillStore.setState({ prefill: null })
