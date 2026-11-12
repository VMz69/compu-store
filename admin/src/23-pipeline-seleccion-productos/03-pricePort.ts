import type { Product } from '../25-pipeline-persistencia-catalogo/04-types'

/**
 * Puerto de PRECIO VIGENTE (inversión de dependencias).
 *
 * Las ofertas no modifican `Product.price`: son una capa encima. Promociones depende
 * de Catálogo, así que Catálogo declara este puerto y Promociones lo implementa al
 * cargarse (`provideEffectivePrice` en `features/promotions/index.ts`).
 * Pedidos y Cotizaciones lo usan al agregar productos. Sin proveedor = precio base.
 */
export interface EffectivePrice {
  price: number
  /** Oferta que fija el precio, o null si rige el precio base. */
  offer: { id: string; title: string } | null
}

export type EffectivePriceResolver = (product: Product) => EffectivePrice

/** Hook proveedor: debe ser un hook de React estable (se llama en cada render). */
export type EffectivePriceHook = () => EffectivePriceResolver

const base: EffectivePriceResolver = (product) => ({ price: product.price, offer: null })
const port: { hook: EffectivePriceHook } = { hook: () => base }

export const provideEffectivePrice = (hook: EffectivePriceHook): void => {
  port.hook = hook
}

export function useEffectivePrice(): EffectivePriceResolver {
  return port.hook()
}
