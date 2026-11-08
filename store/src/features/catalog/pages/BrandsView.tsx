import { BrandCard } from '@/components/catalog/BrandCard'
import { Breadcrumbs } from '@/components/ui/Breadcrumbs'
import { PageBanner } from '@/components/ui/PageBanner'
import { useBrandsPage } from '@/hooks/useBrandsPage'
import { uiMeta } from '@/ui-traceability'

const SOURCE = 'src/pages/BrandsView.tsx'

export const BrandsView = () => {
  const { brands } = useBrandsPage()

  return (
    <div className="space-y-8">
      <Breadcrumbs
        items={[{ label: 'Inicio', to: '/' }, { label: 'Marcas Oficiales' }]}
        traceId="marcas.breadcrumbs"
      />

      <PageBanner
        badge="Fabricantes"
        title="Marcas y Fabricantes Oficiales"
        description="En CompuStore SV trabajamos exclusivamente con marcas reconocidas a nivel global. Todos los componentes y equipos cuentan con garantía directa y soporte en nuestro local físico en Cojutepeque."
        traceId="marcas.banner"
      >
        <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl text-center border border-white/20 flex-shrink-0">
          <span className="block text-2xl font-black">{brands.length}</span>
          <span className="text-xs text-blue-100 font-medium">Marcas Oficiales</span>
        </div>
      </PageBanner>

      <div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        {...uiMeta({ id: 'marcas.grid', component: 'BrandsView', source: SOURCE })}
      >
        {brands.map((brand) => (
          <BrandCard key={brand.id} brand={brand} />
        ))}
      </div>
    </div>
  )
}
