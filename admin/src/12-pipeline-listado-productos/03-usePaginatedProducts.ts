import { usePagination } from '@/70-pipeline-orden-paginacion/04-usePagination'
import { useProductFiltersStore } from '../13-pipeline-filtros-productos/02-filters.store'
import { useFilteredProducts } from './02-useFilteredProducts'

/**
 * Tamaños de página del catálogo. Múltiplos de 4 para que la grilla
 * (4 columnas en `xl`) siempre llene filas completas.
 */
export const PRODUCT_PAGE_SIZES = [8, 12, 24, 48]

/**
 * Productos filtrados + paginados.
 *
 * Cualquier cambio en búsqueda, categoría o filtro de stock regresa a la
 * página 1 (vía `resetKey`). Cambiar entre grilla y tabla NO reinicia la
 * página: es la misma lista vista de otra forma.
 */
export function usePaginatedProducts() {
  const filtered = useFilteredProducts()
  const search = useProductFiltersStore((s) => s.search)
  const category = useProductFiltersStore((s) => s.category)
  const stockFilter = useProductFiltersStore((s) => s.stockFilter)

  const { pageItems, pagination } = usePagination(filtered, {
    pageSizeOptions: PRODUCT_PAGE_SIZES,
    resetKey: `${search}|${category}|${stockFilter}`,
  })

  return { items: pageItems, totalCount: filtered.length, pagination }
}
