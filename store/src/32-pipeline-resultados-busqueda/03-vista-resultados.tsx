import { Link } from 'react-router-dom'
import { FilterBar, ProductGrid } from '@/00-director-catalogo'
import { Breadcrumbs } from '@/04-pipeline-presentacion-secciones/00-director-presentacion-secciones'
import { useSearchView } from './02-estado-resultados'
import { uiMeta } from '@/04-trazabilidad-ui'

const SOURCE = 'src/32-pipeline-resultados-busqueda/03-vista-resultados.tsx'

export const SearchView = () => {
  const { products, searchQuery, sortBy, setSortBy, resetFilters } = useSearchView()

  return (
    <div className="space-y-4 sm:space-y-6">
      <Breadcrumbs
        items={[{ label: 'Inicio', to: '/' }, { label: 'Resultados de búsqueda' }]}
        traceId="busqueda.breadcrumbs"
      />

      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-slate-100">
            Resultados de Búsqueda
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {searchQuery.trim()
              ? `Mostrando coincidencias para “${searchQuery}”`
              : 'Escribe en el buscador para afinar los resultados'}
          </p>
        </div>
        {searchQuery ? (
          <button
            type="button"
            onClick={resetFilters}
            className="text-xs font-bold text-brand hover:underline cursor-pointer"
            {...uiMeta({
              id: 'busqueda.limpiar',
              component: 'SearchView',
              source: SOURCE,
            })}
          >
            Limpiar búsqueda
          </button>
        ) : null}
      </div>

      <FilterBar
        count={products.length}
        subject="productos encontrados"
        sortBy={sortBy}
        onSortChange={setSortBy}
        traceId="busqueda.filters"
      />

      <ProductGrid
        products={products}
        traceId="busqueda.grid"
        emptyIcon="fa-solid fa-magnifying-glass"
        emptyTitle="Sin coincidencias"
        emptyDescription="Prueba con otro término, marca o nombre de categoría."
        emptyAction={
          <Link
            to="/"
            className="bg-brand text-white font-bold text-xs py-2 px-4 rounded-full"
            {...uiMeta({ id: 'busqueda.grid.cta', component: 'SearchView', source: SOURCE })}
          >
            Volver al inicio
          </Link>
        }
      />
    </div>
  )
}
