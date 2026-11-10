import { Button, EmptyState, PageContainer, PageHeader } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { BrandsTable } from '../components/taxonomy/BrandsTable'
import { CategoryCard } from '../components/taxonomy/CategoryCard'
import { TaxonomyToolbar } from '../components/taxonomy/TaxonomyToolbar'
import { useBrandsTab } from '../hooks/taxonomy/useBrandsTab'
import { useCategoriesTab } from '../hooks/taxonomy/useCategoriesTab'
import { useTaxonomyPage } from '../hooks/taxonomy/useTaxonomyPage'

const t = tracer('CategoriesPage', 'src/features/catalog/pages/CategoriesPage.tsx')

/** /categorias · CRUD de la taxonomía del catálogo: categorías (tarjetas) y marcas (tabla). */
export function CategoriesPage() {
  const page = useTaxonomyPage()
  const categories = useCategoriesTab(page.tab === 'categorias' ? page.search : '')
  const brands = useBrandsTab(page.tab === 'marcas' ? page.search : '')
  const isBrands = page.tab === 'marcas'
  const visible = isBrands ? brands.items.length : categories.items.length

  return (
    <PageContainer {...t('catalog.taxonomy')}>
      <PageHeader title="Categorías y marcas" subtitle="Organiza el catálogo: cómo se agrupan los productos en el Front Office y quién los fabrica." />
      <TaxonomyToolbar page={page} />

      <section id={`taxonomy-panel-${page.tab}`} role="tabpanel" aria-label={isBrands ? 'Marcas' : 'Categorías'} {...t(`catalog.taxonomy.panel.${page.tab}`)}>
        {visible === 0 ? (
          <EmptyState
            icon={page.search ? 'fa-solid fa-magnifying-glass' : isBrands ? 'fa-solid fa-copyright' : 'fa-solid fa-layer-group'}
            title={page.search ? `Sin resultados para «${page.search}»` : isBrands ? 'Aún no hay marcas registradas.' : 'Aún no hay categorías.'}
            hint={page.search ? 'Prueba con otro término o limpia la búsqueda.' : undefined}
            action={
              page.search ? (
                <Button variant="outline" size="md" onClick={page.clearSearch} {...t('catalog.taxonomy.clear')}>Limpiar búsqueda</Button>
              ) : (
                page.canCreate && <Button size="md" onClick={page.create} {...t('catalog.taxonomy.empty.create')}>{page.createLabel}</Button>
              )
            }
            {...t('catalog.taxonomy.empty')}
          />
        ) : isBrands ? (
          <BrandsTable api={brands} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4" {...t('catalog.categories.grid')}>
            {categories.items.map((item) => (
              <CategoryCard key={item.category.id} item={item} api={categories} />
            ))}
          </div>
        )}
      </section>
    </PageContainer>
  )
}
