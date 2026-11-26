import { aplicarIdentidad } from '@/01-pipeline-identidad-tienda/00-director-identidad-tienda'
import { useCartStore } from '@/07-pipeline-estado-carrito/00-director-estado-carrito'
import { useFavStore } from '@/15-pipeline-preferencias-producto/00-director-preferencias-producto'
import { aIdentidad, type IdentidadApi } from './02-adaptadores'
import { obtener } from './01-cliente-api'
import { cargarCatalogo, useCatalogStore } from './03-catalogo.datos'

/**
 * Identidad + catálogo público, y depuración de carrito y favoritos persistidos:
 * se descartan sin avisar los ids que ya no existen (p. ej. de la versión de muestra)
 * y el carrito toma la copia vigente de cada producto.
 */
export async function cargarDatos(): Promise<void> {
  const [identidad] = await Promise.all([obtener<IdentidadApi>('/tienda/identidad'), cargarCatalogo()])
  aplicarIdentidad(aIdentidad(identidad))

  const { products } = useCatalogStore.getState()
  useCartStore.getState().purgeUnknown(products)
  useFavStore.getState().purgeUnknown(products.map((product) => product.id))
}

/**
 * Carga inicial del store (decisión L07B), antes del primer render. Si falla,
 * `main.tsx` muestra el error con reintento; nunca hay respaldo con datos de muestra.
 */
export const precargar = (): Promise<void> => cargarDatos()
