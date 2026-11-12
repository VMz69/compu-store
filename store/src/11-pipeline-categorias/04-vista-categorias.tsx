import { CategoryCard } from './03-tarjeta-categoria'
import { Breadcrumbs } from '@/04-pipeline-presentacion-secciones/00-director-presentacion-secciones'
import { PageBanner } from '@/04-pipeline-presentacion-secciones/00-director-presentacion-secciones'
import { useCatalogHub } from './02-estado-categorias'
import { uiMeta } from '@/04-trazabilidad-ui'

const SOURCE = 'src/11-pipeline-categorias/04-vista-categorias.tsx'

export const CatalogHub = () => {
  const { categories, totalProducts } = useCatalogHub()

  return (
    <div className="space-y-5 sm:space-y-8">
      <Breadcrumbs
        items={[
          { label: 'Inicio', to: '/' },
          { label: 'Todas las Categorías' },
        ]}
        traceId="categorias.breadcrumbs"
      />

      <PageBanner
        badge="Categorías"
        title="Todas las Categorías de Productos"
        description="Explora nuestra amplia variedad de categorías en productos tecnológicos con garantía y disponibilidad inmediata en nuestra sala de ventas en Cojutepeque."
        traceId="categorias.banner"
      >
        <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl text-center border border-white/20 flex-shrink-0">
          <span className="block text-2xl font-black">{categories.length}</span>
          <span className="text-xs text-blue-100 font-medium">Categorías Activas</span>
        </div>
      </PageBanner>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6"
        {...uiMeta({ id: 'categorias.grid', component: 'CatalogHub', source: SOURCE })}
      >
        {categories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>

      <p className="text-center text-xs text-slate-400">
        {totalProducts} productos disponibles en el catálogo de CompuStore SV.
      </p>
    </div>
  )
}
