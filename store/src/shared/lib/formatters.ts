import { STORE_CONFIG } from '@/data/storeConfig'

/**
 * Formateadores de presentación. No dependen de React y son reutilizables en
 * cualquier dominio (catálogo, carrito, reseñas).
 */

/** Moneda oficial de la tienda con dos decimales fijos. */
export const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat(STORE_CONFIG.currency.locale, {
    style: 'currency',
    currency: STORE_CONFIG.currency.code,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)

/** Descuento porcentual entero; devuelve 0 si no hay precio anterior válido. */
export const calculateDiscountPercentage = (
  originalPrice: number | null,
  currentPrice: number,
): number => {
  if (!originalPrice || originalPrice <= currentPrice) return 0
  return Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
}

/** SKU legible y estable a partir del id numérico del producto. */
export const formatSku = (id: number): string => `CP-${String(id).padStart(4, '0')}`

/** Iniciales para avatares de reseñas (máximo dos letras). */
export const getInitials = (name: string): string =>
  name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join('')
