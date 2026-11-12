import { Link } from 'react-router-dom'
import { BrandTile } from '../components/BrandTile'
import { CategoryTile } from '../components/CategoryTile'
import { HeroSlider } from '../components/HeroSlider'
import { TrustPillars } from '../components/TrustPillars'
import { ProductGrid } from '@/00-director-catalogo'
import { SectionHeading } from '@/shared/ui/SectionHeading'
import { useHomeData } from '../hooks/useHomeData'
import { uiMeta } from '@/04-trazabilidad-ui'

const SOURCE = 'src/features/home/pages/Home.tsx'
/** Las vitrinas de portada muestran 4 productos: se fijan en 4 columnas para no dejar huecos. */
const SHOWCASE_GRID = 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6'

export const Home = () => {
  const { categoriesWithCounts, brandsWithCounts, featuredProducts, dealProducts } = useHomeData()

  return (
    <div className="space-y-8 sm:space-y-12">
      <HeroSlider />
      <TrustPillars />

      <section {...uiMeta({ id: 'home.categories', component: 'Home', source: SOURCE })}>
        <SectionHeading
          title="Categorías de Productos"
          subtitle="Selección organizada para encontrar justo lo que buscas"
          traceId="home.categories.heading"
        />
        <div className="grid grid-cols-3 lg:grid-cols-5 gap-2.5 sm:gap-4">
          {categoriesWithCounts.map((category) => (
            <CategoryTile key={category.id} category={category} />
          ))}
        </div>
      </section>

      <section {...uiMeta({ id: 'home.brands', component: 'Home', source: SOURCE })}>
        <SectionHeading
          title="Marcas Destacadas"
          subtitle="Equipos originales respaldados por sus fabricantes"
          traceId="home.brands.heading"
          action={
            <Link
              to="/brands"
              className="text-xs font-bold text-brand hover:underline"
              {...uiMeta({ id: 'home.brands.all', component: 'Home', source: SOURCE })}
            >
              Ver todas las marcas <i className="fa-solid fa-arrow-right text-[10px] ml-1" />
            </Link>
          }
        />
        <div className="grid grid-cols-4 lg:grid-cols-8 gap-2 sm:gap-3">
          {brandsWithCounts.map((brand) => (
            <BrandTile key={brand.id} brand={brand} />
          ))}
        </div>
      </section>

      <section {...uiMeta({ id: 'home.featured', component: 'Home', source: SOURCE })}>
        <SectionHeading
          title="Productos Destacados"
          subtitle="Equipos y componentes con mayor preferencia"
          traceId="home.featured.heading"
          action={
            <Link
              to="/category/computadoras"
              className="text-xs font-bold text-brand hover:underline"
              {...uiMeta({ id: 'home.featured.all', component: 'Home', source: SOURCE })}
            >
              Ver catálogo completo <i className="fa-solid fa-arrow-right text-[10px] ml-1" />
            </Link>
          }
        />
        <ProductGrid products={featuredProducts} traceId="home.featured.grid" gridClassName={SHOWCASE_GRID} />
      </section>

      <section {...uiMeta({ id: 'home.deals', component: 'Home', source: SOURCE })}>
        <SectionHeading
          title="Super Ofertas del Mes"
          subtitle="Descuentos especiales con stock limitado"
          traceId="home.deals.heading"
          action={
            <Link
              to="/offers"
              className="text-xs font-bold text-brand hover:underline"
              {...uiMeta({ id: 'home.deals.all', component: 'Home', source: SOURCE })}
            >
              Ver todas las ofertas <i className="fa-solid fa-arrow-right text-[10px] ml-1" />
            </Link>
          }
        />
        <ProductGrid products={dealProducts} traceId="home.deals.grid" gridClassName={SHOWCASE_GRID} />
      </section>
    </div>
  )
}
