// API pública del feature `promotions`. Desde fuera solo se importa este archivo.
import { provideEffectivePrice } from '@/00-director-catalogo'
import { useOfferPriceResolver } from './54-pipeline-precio-ofertas/00-director-precio-ofertas'

// Capa de precios: Catálogo (y con él Pedidos y Cotizaciones) obtiene el precio
// vigente de cada producto sin importar este feature.
provideEffectivePrice(useOfferPriceResolver)

export { OfferBuilderPage } from './53-pipeline-preparacion-ofertas/00-director-preparacion-ofertas'
export { PromotionsPage } from './52-pipeline-listado-ofertas/00-director-listado-ofertas'
export { resetPromotions, usePromotionsStore } from './54-pipeline-precio-ofertas/03-store'
export type { Offer } from './54-pipeline-precio-ofertas/04-types'
