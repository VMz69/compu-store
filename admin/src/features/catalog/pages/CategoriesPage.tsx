import { Button, PageContainer, PageHeader } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { CategoryCard } from '../components/categories/CategoryCard'
import { useCategories } from '../hooks/useCategories'

const t = tracer('CategoriesPage', 'src/features/catalog/pages/CategoriesPage.tsx')

export function CategoriesPage() {
  const { items, canCreate, showProducts, openCreate } = useCategories()

  return (
    <PageContainer {...t('catalog.categories')}>
      <PageHeader
        title="Categorías de Catálogo"
        subtitle="Estructura taxonómica alineada con el Front Office"
        action={
          canCreate && (
            <Button icon="fa-solid fa-folder-plus" onClick={openCreate} {...t('catalog.categories.create')}>
              Nueva Categoría
            </Button>
          )
        }
      />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" {...t('catalog.categories.grid')}>
        {items.map(({ category, count }) => (
          <CategoryCard key={category.id} category={category} count={count} onShowProducts={showProducts} />
        ))}
      </div>
    </PageContainer>
  )
}
