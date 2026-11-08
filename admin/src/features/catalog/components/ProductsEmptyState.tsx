import { Button, EmptyState } from '@/shared/ui'
import { tracer } from '@/ui-traceability'

const t = tracer('ProductsEmptyState', 'src/features/catalog/components/ProductsEmptyState.tsx')

interface ProductsEmptyStateProps {
  canCreate: boolean
  onCreate: () => void
}

export function ProductsEmptyState({ canCreate, onCreate }: ProductsEmptyStateProps) {
  return (
    <EmptyState
      icon="fa-solid fa-box-open"
      title="No se encontraron productos coincidentes."
      hint="Prueba cambiando los filtros o el término de búsqueda."
      action={
        canCreate && (
          <Button icon="fa-solid fa-plus" size="md" onClick={onCreate} {...t('catalog.empty.create')}>
            Añadir Primer Producto
          </Button>
        )
      }
      {...t('catalog.empty')}
    />
  )
}
