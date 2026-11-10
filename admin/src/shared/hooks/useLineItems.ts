import { useState, type ChangeEvent } from 'react'
import { clamp } from '@/shared/lib/pricing'

export interface LineItemBase {
  productId: string
  quantity: number
  /** 0–100. */
  discountPercent: number
}

const MAX_QTY = 999

/**
 * Estado de líneas de venta (una por producto) para cotizaciones y pedidos.
 * `maxOf` limita la cantidad por producto (ej. stock disponible); sin él, el tope es 999.
 */
export function useLineItems<T extends LineItemBase>(initial: T[], maxOf?: (productId: string) => number) {
  const [items, setItems] = useState<T[]>(initial)
  const limit = (productId: string) => Math.max(1, maxOf ? Math.min(maxOf(productId), MAX_QTY) : MAX_QTY)

  const patch = (productId: string, partial: Partial<T>) =>
    setItems((list) => list.map((i) => (i.productId === productId ? { ...i, ...partial } : i)))
  const setQuantity = (productId: string, quantity: number) =>
    patch(productId, { quantity: clamp(quantity, 1, limit(productId)) } as Partial<T>)

  return {
    items,
    quantities: Object.fromEntries(items.map((i) => [i.productId, i.quantity])) as Record<string, number>,
    /** Agrega la línea o suma 1 si ya existe. Devuelve `false` si se alcanzó el tope. */
    add: (line: T): boolean => {
      const current = items.find((i) => i.productId === line.productId)
      const max = maxOf ? maxOf(line.productId) : MAX_QTY
      if ((current?.quantity ?? 0) >= max) return false
      setItems((list) =>
        list.some((i) => i.productId === line.productId)
          ? list.map((i) => (i.productId === line.productId ? { ...i, quantity: i.quantity + 1 } : i))
          : [...list, line],
      )
      return true
    },
    remove: (productId: string) => setItems((list) => list.filter((i) => i.productId !== productId)),
    step: (productId: string, delta: number) => {
      const current = items.find((i) => i.productId === productId)
      if (current) setQuantity(productId, current.quantity + delta)
    },
    onQuantity: (productId: string) => (e: ChangeEvent<HTMLInputElement>) =>
      setQuantity(productId, parseInt(e.target.value, 10) || 1),
    onDiscount: (productId: string) => (e: ChangeEvent<HTMLInputElement>) =>
      patch(productId, { discountPercent: clamp(parseFloat(e.target.value) || 0, 0, 100) } as Partial<T>),
  }
}

export type LineItemsState<T extends LineItemBase> = ReturnType<typeof useLineItems<T>>
