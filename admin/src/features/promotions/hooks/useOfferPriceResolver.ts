import { useCallback } from 'react'
import type { EffectivePriceResolver, Product } from '@/00-director-catalogo'
import { effectivePrice } from '../lib/offerPricing'
import { usePromotionsStore } from '../store'

/** Implementación del puerto de Catálogo: precio vigente según las ofertas vigentes hoy. */
export function useOfferPriceResolver(): EffectivePriceResolver {
  const offers = usePromotionsStore((s) => s.offers)
  return useCallback((product: Product) => {
    const { price, offer } = effectivePrice(product, offers)
    return { price, offer: offer && { id: offer.id, title: offer.title } }
  }, [offers])
}
