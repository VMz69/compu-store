import { Link, useParams } from 'react-router-dom'
import { ProductGrid } from '../components/grid/ProductGrid'
import { Breadcrumbs } from '@/04-pipeline-presentacion-secciones/00-director-presentacion-secciones'
import { EmptyState } from '@/04-pipeline-presentacion-secciones/00-director-presentacion-secciones'
import { FilterBar } from '../components/FilterBar'
import { PageBanner } from '@/04-pipeline-presentacion-secciones/00-director-presentacion-secciones'
import { useBrandView } from '../hooks/useBrandView'
import { uiMeta } from '@/04-trazabilidad-ui'

const SOURCE = 'src/features/catalog/pages/BrandDetail.tsx'

export const BrandDetail = () => {
  const { slug = '' } = useParams()
  const { brand, filteredProducts, sortBy, setSortBy } = useBrandView(slug)

  if (!brand) {
    return (
      <EmptyState
        icon="fa-solid fa-tags"
        title="Marca no encontrada"
        description="La marca que buscas no está disponible en el catálogo."
        traceId="marca.empty"
        action={
          <Link
            to="/brands"
            className="bg-brand hover:bg-brand-hover text-white font-bold text-xs py-2 px-4 rounded-full"
            {...uiMeta({ id: 'marca.empty.cta', component: 'BrandDetail', source: SOURCE })}
          >
            Ver todas las marcas
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
          { label: 'Marcas', to: '/brands' },
          { label: brand.name },
        ]}
        traceId="marca.breadcrumbs"
      />

      <PageBanner
        badge="Catálogo de Marca"
        icon={brand.icon}
        title={`Catálogo ${brand.name}`}
        description={brand.description}
        gradient="from-slate-900 via-brand-dark to-brand"
        traceId="marca.banner"
      >
        <div className="bg-white/20 backdrop-blur-xs px-4 py-2 rounded-2xl text-xs font-bold">
          {filteredProducts.length} productos en stock
        </div>
      </PageBanner>

      <FilterBar
        count={filteredProducts.length}
        subject={`productos oficiales de ${brand.name}`}
        sortBy={sortBy}
        onSortChange={setSortBy}
        traceId="marca.filters"
      />

      <ProductGrid
        products={filteredProducts}
        traceId="marca.grid"
        emptyTitle={`Sin productos disponibles para ${brand.name}`}
        emptyDescription="Explora otras marcas o revisa el catálogo completo."
        emptyAction={
          <Link
            to="/brands"
            className="bg-brand text-white font-bold text-xs py-2 px-4 rounded-full"
            {...uiMeta({ id: 'marca.grid.cta', component: 'BrandDetail', source: SOURCE })}
          >
            Ver otras marcas
          </Link>
        }
      />
    </div>
  )
}
