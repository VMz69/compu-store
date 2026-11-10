import { Button, ListToolbar, LiveSearch, Select } from '@/shared/ui'
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

/** Barra estándar de listados: buscador · categoría · disponibilidad ··· conteo, vista · "Nuevo producto". */
export function ProductToolbar({ filters, count, canCreate, onCreate }: ProductToolbarProps) {
  return (
    <ListToolbar
      traceId="catalog.toolbar"
      search={
        <LiveSearch
          value={filters.search}
          onChange={filters.onSearch}
          onClear={filters.clearSearch}
          resultCount={count}
          placeholder="Buscar nombre, SKU, marca o modelo…"
          aria-label="Buscar productos"
          {...t('catalog.toolbar.search')}
        />
      }
      filters={
        <>
          <Select tone="filter" options={filters.categoryOptions} value={filters.category} onChange={filters.onCategory} aria-label="Filtrar por categoría" {...t('catalog.toolbar.category')} />
          <Select tone="filter" options={filters.stockOptions} value={filters.stockFilter} onChange={filters.onStock} aria-label="Filtrar por disponibilidad" {...t('catalog.toolbar.stock')} />
        </>
      }
      aside={<ViewModeToggle mode={filters.viewMode} onGrid={filters.showGrid} onTable={filters.showTable} />}
      action={
        canCreate && (
          <Button icon="fa-solid fa-plus" onClick={onCreate} {...t('catalog.toolbar.create')}>
            Nuevo producto
          </Button>
        )
      }
    />
  )
}
