// API pública del feature `promotions`. Desde fuera solo se importa este archivo.
import { provideEffectivePrice } from '@/features/catalog'
import { useOfferPriceResolver } from './hooks/useOfferPriceResolver'

// Capa de precios: Catálogo (y con él Pedidos y Cotizaciones) obtiene el precio
// vigente de cada producto sin importar este feature.
provideEffectivePrice(useOfferPriceResolver)

export { OfferBuilderPage } from './pages/OfferBuilderPage'
export { PromotionsPage } from './pages/PromotionsPage'
export { resetPromotions, usePromotionsStore } from './store'
export type { Offer } from './types'
