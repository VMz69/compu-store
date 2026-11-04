import { Link } from 'react-router-dom'
import { BrandTile } from '@/components/catalog/BrandTile'
import { CategoryTile } from '@/components/catalog/CategoryTile'
import { HeroSlider } from '@/components/catalog/HeroSlider'
import { TrustPillars } from '@/components/catalog/TrustPillars'
import { ProductGrid } from '@/components/product/ProductGrid'
import { SectionHeading } from '@/components/ui/SectionHeading'
import { useHomeData } from '@/hooks/useHomeData'
import { uiMeta } from '@/ui-traceability'

const SOURCE = 'src/pages/Home.tsx'

export const Home = () => {
  const { categoriesWithCounts, brandsWithCounts, featuredProducts, dealProducts } = useHomeData()

  return (
    <div className="space-y-12">
      <HeroSlider />
      <TrustPillars />

      <section {...uiMeta({ id: 'home.categories', component: 'Home', source: SOURCE })}>
        <SectionHeading
          title="Categorías de Productos"
          subtitle="Selección organizada para encontrar justo lo que buscas"
          traceId="home.categories.heading"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
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
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
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
        <ProductGrid products={featuredProducts} traceId="home.featured.grid" />
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
        <ProductGrid products={dealProducts} traceId="home.deals.grid" />
      </section>
    </div>
  )
}
