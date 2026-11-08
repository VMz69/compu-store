import { Link, useParams } from 'react-router-dom'
import { ProductGrid } from '@/components/product/ProductGrid'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { EmptyState } from '@/components/ui/EmptyState'
import { FilterBar } from '@/components/ui/FilterBar'
import { PageBanner } from '@/components/ui/PageBanner'
import { useCategoryView } from '@/hooks/useCategoryView'
import { uiMeta } from '@/ui-traceability'

const SOURCE = 'src/pages/CategoryView.tsx'

export const CategoryView = () => {
  const { slug = '' } = useParams()
  const { category, filteredProducts, sortBy, setSortBy } = useCategoryView(slug)

  if (!category) {
    return (
      <EmptyState
        icon="fa-solid fa-box-open"
        title="Categoría no encontrada"
        description="La categoría que buscas no existe o fue movida."
        traceId="categoria.empty"
        action={
          <Link
            to="/categories"
            className="bg-brand hover:bg-brand-hover text-white font-bold text-xs py-2 px-4 rounded-full"
            {...uiMeta({ id: 'categoria.empty.cta', component: 'CategoryView', source: SOURCE })}
          >
            Ver todas las categorías
          </Link>
        }
      />
    )
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: 'Inicio', to: '/' },
          { label: 'Categorías', to: '/categories' },
          { label: category.name },
        ]}
        traceId="categoria.breadcrumbs"
      />

      <PageBanner
        badge="Departamento"
        icon={category.icon}
        title={category.name}
        description={category.description}
        traceId="categoria.banner"
      >
        <div className="bg-white/20 backdrop-blur-xs px-4 py-2 rounded-2xl text-xs font-bold">
          {filteredProducts.length} productos disponibles
        </div>
      </PageBanner>

      <FilterBar
        count={filteredProducts.length}
        subject={`productos en ${category.name}`}
        sortBy={sortBy}
        onSortChange={setSortBy}
        traceId="categoria.filters"
      />

      <ProductGrid
        products={filteredProducts}
        traceId="categoria.grid"
        emptyTitle="Sin productos disponibles"
        emptyDescription="Actualmente no hay artículos en esta categoría."
        emptyAction={
          <Link
            to="/"
            className="bg-brand text-white font-bold text-xs py-2 px-4 rounded-full"
            {...uiMeta({ id: 'categoria.grid.cta', component: 'CategoryView', source: SOURCE })}
          >
            Volver al inicio
          </Link>
        }
      />
    </div>
  )
}
