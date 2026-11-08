import { Button, SearchInput, Select } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { ProductFiltersApi } from '../../hooks/useProductFilters'
import { ViewModeToggle } from './ViewModeToggle'

const t = tracer('ProductToolbar', 'src/features/catalog/components/toolbar/ProductToolbar.tsx')

interface ProductToolbarProps {
  filters: ProductFiltersApi
  count: number
  canCreate: boolean
  onCreate: () => void
}

/** Búsqueda, filtros, selector grid/tabla y CTA primario de la vista Productos. */
export function ProductToolbar({ filters, count, canCreate, onCreate }: ProductToolbarProps) {
  return (
    <div
      className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3"
      {...t('catalog.toolbar')}
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <SearchInput
          value={filters.search}
          onChange={filters.onSearch}
          placeholder="Buscar por nombre, SKU o marca..."
          aria-label="Buscar productos"
          {...t('catalog.toolbar.search')}
        />
        <Select
          tone="filter"
          options={filters.categoryOptions}
          value={filters.category}
          onChange={filters.onCategory}
          aria-label="Filtrar por categoría"
          {...t('catalog.toolbar.category')}
        />
        <Select
          tone="filter"
          options={filters.stockOptions}
          value={filters.stockFilter}
          onChange={filters.onStock}
          aria-label="Filtrar por disponibilidad"
          {...t('catalog.toolbar.stock')}
        />
      </div>

      <div className="flex items-center gap-2.5">
        <span className="text-xs font-bold text-slate-400 mr-1">{count} productos</span>
        <ViewModeToggle mode={filters.viewMode} onGrid={filters.showGrid} onTable={filters.showTable} />
        {canCreate && (
          <Button icon="fa-solid fa-plus" onClick={onCreate} {...t('catalog.toolbar.create')}>
            Añadir Producto
          </Button>
        )}
      </div>
    </div>
  )
}
