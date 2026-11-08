import { Pagination } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { ProductGrid } from '../components/grid/ProductGrid'
import { ProductsEmptyState } from '../components/ProductsEmptyState'
import { ProductTable } from '../components/table/ProductTable'
import { ProductToolbar } from '../components/toolbar/ProductToolbar'
import { usePaginatedProducts } from '../hooks/usePaginatedProducts'
import { useProductActions } from '../hooks/useProductActions'
import { useProductFilters } from '../hooks/useProductFilters'

const t = tracer('ProductsPage', 'src/features/catalog/pages/ProductsPage.tsx')

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
