import type { SortDir, SortState } from '@/82-pipeline-calculo-importes/03-sort'
import { sortWith } from '@/82-pipeline-calculo-importes/03-sort'
import type { Order } from '../types'
import { statusOf } from './orderFlow'

/** Columnas ordenables de la tabla de pedidos. */
export type OrderSortKey = 'id' | 'date' | 'client' | 'total' | 'status'

/** Por defecto: más recientes primero (igual que antes de existir el orden). */
export const DEFAULT_ORDER_SORT: SortState<OrderSortKey> = { key: 'date', dir: 'desc' }

/** Dirección inicial al elegir una columna: fechas y montos de mayor a menor; texto A→Z. */
export const FIRST_DIR: Record<OrderSortKey, SortDir> = { id: 'desc', date: 'desc', client: 'asc', total: 'desc', status: 'asc' }

/** Avance en el flujo; cancelado (rama terminal, paso 0) va al final. */
const flowRank = (o: Order) => statusOf(o.status).step || 99

const collator = new Intl.Collator('es', { sensitivity: 'base', numeric: true })

const COMPARE: Record<OrderSortKey, (a: Order, b: Order) => number> = {
  id: (a, b) => collator.compare(a.id, b.id),
  // "YYYY-MM-DD HH:mm" ordena bien como texto.
  date: (a, b) => a.date.localeCompare(b.date),
  client: (a, b) => collator.compare(a.client, b.client),
  total: (a, b) => a.total - b.total,
  // Mismo estado: el más reciente primero, para que el grupo sea predecible.
  status: (a, b) => flowRank(a) - flowRank(b) || b.date.localeCompare(a.date),
}

export const sortOrders = (orders: Order[], sort: SortState<OrderSortKey>): Order[] =>
  sortWith(orders, COMPARE[sort.key], sort.dir)
