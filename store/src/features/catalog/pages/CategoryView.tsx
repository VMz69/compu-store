import { Link, useParams } from 'react-router-dom'
import { ProductGrid } from '../components/grid/ProductGrid'
import { Breadcrumbs } from '@/04-pipeline-presentacion-secciones/00-director-presentacion-secciones'
import { EmptyState } from '@/04-pipeline-presentacion-secciones/00-director-presentacion-secciones'
import { FilterBar } from '../components/FilterBar'
import { PageBanner } from '@/04-pipeline-presentacion-secciones/00-director-presentacion-secciones'
import { useCategoryView } from '../hooks/useCategoryView'
import { uiMeta } from '@/04-trazabilidad-ui'

const SOURCE = 'src/features/catalog/pages/CategoryView.tsx'

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
    <div className="space-y-4 sm:space-y-6">
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
