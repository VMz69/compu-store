import { Link } from 'react-router-dom'
import { ProductGrid } from '../features/catalog/components/grid/ProductGrid'
import { Breadcrumbs } from '@/04-pipeline-presentacion-secciones/00-director-presentacion-secciones'
import { ConfirmDialog } from '@/05-pipeline-controles-compra/00-director-controles-compra'
import { useFavoritesView } from './04-estado-lista-favoritos'
import { uiMeta } from '@/04-trazabilidad-ui'

const SOURCE = 'src/features/catalog/pages/FavoritesView.tsx'

export const FavoritesView = () => {
  const favorites = useFavoritesView()
  const { products } = favorites

  return (
    <div className="space-y-4 sm:space-y-6">
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
        {products.length > 0 ? (
          <button
            type="button"
            onClick={favorites.requestClearFavorites}
            className="text-xs text-red-500 hover:text-red-700 font-semibold flex items-center gap-1 cursor-pointer"
            {...uiMeta({ id: 'favoritos.vaciar', component: 'FavoritesView', source: SOURCE })}
          >
            <i className="fa-regular fa-trash-can" /> Vaciar Favoritos
          </button>
        ) : null}
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

      <ConfirmDialog
        open={favorites.isClearModalOpen}
        title="¿Vaciar tus favoritos?"
        description="Se quitarán todos los productos guardados en tu lista. Esta acción no se puede deshacer."
        confirmLabel="Sí, vaciar"
        cancelLabel="Cancelar"
        tone="danger"
        onConfirm={favorites.confirmClearFavorites}
        onCancel={favorites.cancelClearFavorites}
      />
    </div>
  )
}
