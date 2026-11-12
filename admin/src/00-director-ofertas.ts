// API pública del feature `promotions`. Desde fuera solo se importa este archivo.
import { provideEffectivePrice } from '@/00-director-catalogo'
import { useOfferPriceResolver } from './features/promotions/hooks/useOfferPriceResolver'

// Capa de precios: Catálogo (y con él Pedidos y Cotizaciones) obtiene el precio
// vigente de cada producto sin importar este feature.
provideEffectivePrice(useOfferPriceResolver)

export { OfferBuilderPage } from './features/promotions/pages/OfferBuilderPage'
export { PromotionsPage } from './features/promotions/pages/PromotionsPage'
export { resetPromotions, usePromotionsStore } from './features/promotions/store'
export type { Offer } from './features/promotions/types'
