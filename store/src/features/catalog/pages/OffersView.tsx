import { Link } from 'react-router-dom'
import { ProductGrid } from '../components/grid/ProductGrid'
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs'
import { FilterBar } from '../components/FilterBar'
import { PageBanner } from '@/shared/ui/PageBanner'
import { useOffersView } from '../hooks/useOffersView'
import { uiMeta } from '@/ui-traceability'

const SOURCE = 'src/features/catalog/pages/OffersView.tsx'

export const OffersView = () => {
  const { products, sortBy, setSortBy } = useOffersView()

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[{ label: 'Inicio', to: '/' }, { label: 'Ofertas y Promociones' }]}
        traceId="ofertas.breadcrumbs"
      />

      <PageBanner
        badge="Liquidación"
        title="Zona de Ofertas Especiales"
        description="Productos seleccionados con precios rebajados. ¡Aprovecha antes de que se agoten las existencias!"
        gradient="from-amber-500 via-amber-600 to-red-500"
        traceId="ofertas.banner"
      >
        <div className="bg-white/20 backdrop-blur-xs px-4 py-2 rounded-2xl text-xs font-bold">
          {products.length} ofertas activas
        </div>
      </PageBanner>

      <FilterBar
        count={products.length}
        subject="ofertas activas"
        sortBy={sortBy}
        onSortChange={setSortBy}
        traceId="ofertas.filters"
      />

      <ProductGrid
        products={products}
        traceId="ofertas.grid"
        emptyIcon="fa-solid fa-tags"
        emptyTitle="No hay ofertas actualmente"
        emptyDescription="Pronto agregaremos nuevas promociones."
        emptyAction={
          <Link
            to="/"
            className="bg-brand text-white font-bold text-xs py-2 px-4 rounded-full"
            {...uiMeta({ id: 'ofertas.grid.cta', component: 'OffersView', source: SOURCE })}
          >
            Explorar catálogo
          </Link>
        }
      />
    </div>
  )
}
