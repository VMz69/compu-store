import { Pagination } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import { ProductGrid } from '../14-pipeline-tarjetas-productos/00-director-tarjetas-productos'
import { ProductsEmptyState } from './04-ProductsEmptyState'
import { ProductTable } from '../15-pipeline-tabla-existencias/00-director-tabla-existencias'
import { ProductToolbar } from '../13-pipeline-filtros-productos/03-ProductToolbar'
import { usePaginatedProducts } from './03-usePaginatedProducts'
import { useProductActions } from '../24-pipeline-inventario-productos/00-director-inventario-productos'
import { useProductFilters } from '../13-pipeline-filtros-productos/00-director-filtros-productos'

const t = tracer('ProductsPage', 'src/12-pipeline-listado-productos/01-ProductsPage.tsx')

export function ProductsPage() {
  const filters = useProductFilters()
  const { items, totalCount, pagination } = usePaginatedProducts()
  const actions = useProductActions()
  const { canCreate } = actions.permissions

  return (
    <div className="flex flex-col h-full animate-fade-in" {...t('catalog.products')}>
      <ProductToolbar filters={filters} count={totalCount} canCreate={canCreate} onCreate={actions.openCreate} />

      {/* `key` por página: al cambiar de página el contenedor se remonta y el scroll vuelve arriba. */}
      <div
        key={pagination.page}
        className="flex-1 p-4 sm:p-5 overflow-y-auto custom-scrollbar"
        {...t('catalog.products.content')}
      >
        {totalCount === 0 ? (
          <ProductsEmptyState canCreate={canCreate} onCreate={actions.openCreate} />
        ) : filters.viewMode === 'grid' ? (
          <ProductGrid items={items} actions={actions} />
        ) : (
          <ProductTable items={items} actions={actions} />
        )}
      </div>

      <Pagination pagination={pagination} idPrefix="catalog" itemLabel="productos" />
    </div>
  )
}
