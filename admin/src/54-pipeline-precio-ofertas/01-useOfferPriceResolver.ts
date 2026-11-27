import { useCallback } from 'react'
import type { EffectivePriceResolver, Product } from '@/00-director-catalogo'
import { effectivePrice } from './02-offerPricing'
import { usePromotionsStore } from './03-store'

/**
 * Implementación del puerto de Catálogo: precio vigente según las ofertas vigentes hoy.
 * El precio de oferta es el que calculó el servidor (L12: el mismo de la tienda y el carrito);
 * el cálculo local solo cubre una oferta sin precio del servidor para ese producto.
 */
export function useOfferPriceResolver(): EffectivePriceResolver {
  const offers = usePromotionsStore((s) => s.offers)
  return useCallback((product: Product) => {
    const { price, offer } = effectivePrice(product, offers)
    return { price: offer?.prices?.[product.id] ?? price, offer: offer && { id: offer.id, title: offer.title } }
  }, [offers])
}
