import { useEffect, useState } from 'react'
import { formatCurrency } from '@/01-pipeline-identidad-tienda/00-director-identidad-tienda'
import { useToastStore } from '@/03-pipeline-notificaciones/00-director-notificaciones'
import { validarCarrito } from '@/38-pipeline-datos-api/00-director-datos-api'
import type { Product } from '@/00-director-modelos'

const ESPERA_MS = 300

/** Precio y cantidad confirmados por el servidor para la compra directa por WhatsApp. */
export interface ValidatedPurchase {
  /** Clave `id:cantidad` a la que corresponde la validación. */
  key: string
  price: number
  quantity: number
}

/**
 * Valida la compra directa de la ficha igual que el carrito (POST /tienda/carrito/validar
 * con una sola línea) al abrirla y tras cada cambio de cantidad. Avisa con los toasts
 * existentes si el precio o la cantidad cambiaron, o si ya no se puede comprar.
 * `purchase` es null mientras valida o si no hay compra posible: entonces no hay enlace.
 */
export const useProductWhatsAppValidation = (product: Product | undefined, quantity: number) => {
  const pushToast = useToastStore((state) => state.pushToast)
  const [purchase, setPurchase] = useState<ValidatedPurchase | null>(null)
  const key = product ? `${product.id}:${quantity}` : ''

  useEffect(() => {
    if (!product) return
    let cancelada = false
    const temporizador = setTimeout(async () => {
      try {
        const [linea] = await validarCarrito([{ product, quantity }])
        if (cancelada || !linea) return
        const nombre = linea.name ?? product.name
        if (linea.unitPrice === null || linea.status === 'unavailable') {
          pushToast(`${nombre} ya no está disponible.`, 'warning')
          return
        }
        if (linea.status === 'sold-out') {
          pushToast(`${nombre} se agotó.`, 'warning')
          return
        }
        if (linea.unitPrice !== product.price) {
          pushToast(`El precio de ${nombre} se actualizó a ${formatCurrency(linea.unitPrice)}.`, 'warning')
        }
        if (linea.status === 'adjusted') {
          pushToast(`Solo hay ${linea.available} unidad(es) de ${nombre} disponibles.`, 'warning')
        }
        setPurchase({ key: `${product.id}:${quantity}`, price: linea.unitPrice, quantity: Math.min(quantity, linea.available) })
      } catch {
        if (!cancelada) {
          pushToast('No pudimos verificar precio y existencias. Revisa tu conexión e inténtalo de nuevo.', 'warning')
        }
      }
    }, ESPERA_MS)
    return () => {
      cancelada = true
      clearTimeout(temporizador)
    }
  }, [product, quantity, pushToast])

  return { purchase: purchase && purchase.key === key ? purchase : null }
}
