import { aplicarIdentidad } from '@/01-pipeline-identidad-tienda/00-director-identidad-tienda'
import { useCartStore } from '@/07-pipeline-estado-carrito/00-director-estado-carrito'
import { useFavStore } from '@/15-pipeline-preferencias-producto/00-director-preferencias-producto'
import { aIdentidad, type IdentidadApi } from './02-adaptadores'
import { obtener } from './01-cliente-api'
import { cargarCatalogo, products } from './03-catalogo.datos'

/**
 * Carga inicial del store (decisión L07B): identidad y catálogo público antes del
 * primer render. Si falla, `main.tsx` muestra el error con reintento; nunca hay
 * respaldo con datos de muestra.
 */
export async function precargar(): Promise<void> {
  const [identidad] = await Promise.all([obtener<IdentidadApi>('/tienda/identidad'), cargarCatalogo()])
  aplicarIdentidad(aIdentidad(identidad))

  // Carrito y favoritos persistidos (p. ej. con ids de la versión de muestra): se
  // descartan sin avisar los que ya no existen y el carrito toma los datos vigentes.
  useCartStore.getState().purgeUnknown(products)
  useFavStore.getState().purgeUnknown(products.map((product) => product.id))
}
