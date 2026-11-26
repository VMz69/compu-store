import { useEffect, useRef, useState } from 'react'
import { formatCurrency } from '@/01-pipeline-identidad-tienda/00-director-identidad-tienda'
import { useToastStore } from '@/03-pipeline-notificaciones/00-director-notificaciones'
import { useCartStore } from '@/07-pipeline-estado-carrito/00-director-estado-carrito'
import type { CartItem, ValidatedCartLine } from '@/07-pipeline-estado-carrito/00-director-estado-carrito'
import { validarCarrito } from '@/38-pipeline-datos-api/00-director-datos-api'

const ESPERA_MS = 300

/** Identidad de lo que se valida: ids y cantidades (no precios, que decide el servidor). */
const claveDe = (items: CartItem[]) => items.map((item) => `${item.product.id}:${item.quantity}`).join(',')

/** Avisos con los toasts existentes para cada línea que el servidor corrigió. */
const avisosDe = (items: CartItem[], lineas: ValidatedCartLine[]) => {
  const porId = new Map(items.map((item) => [item.product.id, item]))
  return lineas.flatMap((linea): string[] => {
    const item = porId.get(linea.productId)
    if (!item) return []
    const nombre = linea.name ?? item.product.name
    if (linea.status === 'unavailable') return [`${nombre} ya no está disponible y se retiró del carrito.`]
    if (linea.status === 'sold-out') return [`${nombre} se agotó y se retiró del carrito.`]
    const avisos: string[] = []
    if (linea.status === 'adjusted') {
      avisos.push(`Solo hay ${linea.available} unidad(es) de ${nombre}; ajustamos tu carrito.`)
    }
    if (linea.unitPrice !== null && linea.unitPrice !== item.product.price) {
      avisos.push(`El precio de ${nombre} se actualizó a ${formatCurrency(linea.unitPrice)}.`)
    }
    return avisos
  })
}

/**
 * Valida el carrito con el servidor (POST /tienda/carrito/validar) al abrirlo y tras
 * cada cambio de productos o cantidades. Aplica precios y existencias vigentes y
 * avisa lo corregido. `isValidated` indica que las líneas actuales ya se validaron:
 * solo entonces se arma el mensaje de WhatsApp.
 */
export const useCartValidation = (items: CartItem[]) => {
  const pushToast = useToastStore((state) => state.pushToast)
  const clave = claveDe(items)
  const validadaRef = useRef<string | null>(null)
  const [validada, setValidada] = useState<string | null>(null)

  useEffect(() => {
    if (!clave || clave === validadaRef.current) return
    let cancelada = false
    const temporizador = setTimeout(async () => {
      const actuales = useCartStore.getState().items
      try {
        const lineas = await validarCarrito(actuales)
        if (cancelada) return
        avisosDe(actuales, lineas).forEach((aviso) => pushToast(aviso, 'warning'))
        useCartStore.getState().applyValidation(lineas)
        const nueva = claveDe(useCartStore.getState().items)
        validadaRef.current = nueva
        setValidada(nueva)
      } catch {
        if (!cancelada) {
          pushToast('No pudimos verificar precios y existencias. Revisa tu conexión e inténtalo de nuevo.', 'warning')
        }
      }
    }, ESPERA_MS)
    return () => {
      cancelada = true
      clearTimeout(temporizador)
    }
  }, [clave, pushToast])

  return { isValidated: clave !== '' && validada === clave }
}
