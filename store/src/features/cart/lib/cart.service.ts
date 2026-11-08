import type { CartItem, Product } from '@/types'

/**
 * Dominio del carrito. Todas las operaciones son puras: reciben el estado
 * anterior y devuelven un nuevo arreglo, sin tocar el store ni el DOM.
 */

/** Cantidad total de unidades (suma de cantidades, no de líneas). */
export const calculateItemCount = (items: CartItem[]): number =>
  items.reduce((total, item) => total + item.quantity, 0)

/** Importe de una línea del carrito (precio unitario × cantidad). */
export const getLineTotal = (item: CartItem): number => item.product.price * item.quantity

export const calculateSubtotal = (items: CartItem[]): number =>
  items.reduce((total, item) => total + getLineTotal(item), 0)

/** Stock que aún puede agregarse de un producto, descontando lo que ya está en el carrito. */
export const getAvailableStock = (product: Product, items: CartItem[]): number => {
  const existing = items.find((item) => item.product.id === product.id)
  const inCart = existing ? existing.quantity : 0
  return Math.max(0, product.stock - inCart)
}

/**
 * Agrega unidades respetando el inventario.
 * Lanza un error legible para que la capa de UI lo convierta en toast.
 */
export const addItem = (
  items: CartItem[],
  product: Product,
  quantityToAdd = 1,
): CartItem[] => {
  if (product.stock <= 0) {
    throw new Error('El producto seleccionado está agotado.')
  }

  const existingIndex = items.findIndex((item) => item.product.id === product.id)
  const currentQuantity = existingIndex >= 0 ? items[existingIndex].quantity : 0
  const nextQuantity = currentQuantity + quantityToAdd

  if (nextQuantity > product.stock) {
    throw new Error(`Solo hay ${product.stock} unidad(es) disponibles en inventario.`)
  }

  const updated = [...items]
  if (existingIndex >= 0) {
    updated[existingIndex] = { ...updated[existingIndex], quantity: nextQuantity }
  } else {
    updated.push({ product, quantity: quantityToAdd })
  }
  return updated
}

/** Fija una cantidad; si es <= 0 elimina la línea y si excede el stock la recorta. */
export const updateQuantity = (
  items: CartItem[],
  productId: number,
  nextQuantity: number,
): CartItem[] => {
  if (!Number.isFinite(nextQuantity) || nextQuantity <= 0) {
    return removeItem(items, productId)
  }

  return items.map((item) =>
    item.product.id === productId
      ? { ...item, quantity: Math.min(nextQuantity, item.product.stock) }
      : item,
  )
}

/** Elimina una línea del carrito por id de producto. */
export const removeItem = (items: CartItem[], productId: number): CartItem[] =>
  items.filter((item) => item.product.id !== productId)
