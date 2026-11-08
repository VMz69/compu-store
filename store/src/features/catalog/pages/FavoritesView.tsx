import { Link } from 'react-router-dom'
import { ProductGrid } from '../components/grid/ProductGrid'
import { Breadcrumbs } from '@/shared/ui/Breadcrumbs'
import { useFavoritesView } from '../hooks/useFavoritesView'
import { uiMeta } from '@/ui-traceability'

const SOURCE = 'src/features/catalog/pages/FavoritesView.tsx'

export const FavoritesView = () => {
  const { products } = useFavoritesView()

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[{ label: 'Inicio', to: '/' }, { label: 'Mis Favoritos' }]}
        traceId="favoritos.breadcrumbs"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            Mis Favoritos
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Tienes {products.length} producto(s) guardado(s)
          </p>
        </div>
      </div>

      <ProductGrid
        products={products}
        traceId="favoritos.grid"
        emptyIcon="fa-regular fa-heart"
        emptyTitle="No tienes productos en favoritos"
        emptyDescription="Guarda tus laptops o componentes favoritos haciendo clic en el corazón."
        emptyAction={
          <Link
            to="/"
            className="bg-brand hover:bg-brand-hover text-white font-bold py-2.5 px-6 rounded-full text-xs shadow-md transition-colors"
            {...uiMeta({
              id: 'favoritos.grid.cta',
              component: 'FavoritesView',
              source: SOURCE,
            })}
          >
            Ver Catálogo
          </Link>
        }
      />
    </div>
  )
}
