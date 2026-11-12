import { DataTable, type TableHeader } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { ProductActions } from '../24-pipeline-inventario-productos/00-director-inventario-productos'
import type { Product } from '../25-pipeline-persistencia-catalogo/04-types'
import { ProductTableRow } from './02-ProductTableRow'

const t = tracer('ProductTable', 'src/features/catalog/components/table/ProductTable.tsx')

const HEADERS: TableHeader[] = [
  { label: 'Producto', className: 'px-4' },
  { label: 'Categoría' },
  { label: 'Marca' },
  { label: 'Precio', className: 'px-3 text-right' },
  { label: 'Stock', className: 'px-3 text-center' },
  { label: 'Estado' },
  { label: 'Acciones', className: 'px-4 text-right' },
]

interface ProductTableProps {
  items: Product[]
  actions: ProductActions
}

export function ProductTable({ items, actions }: ProductTableProps) {
  return (
    <DataTable headers={HEADERS} {...t('catalog.table')}>
      {items.map((product) => (
        <ProductTableRow key={product.id} product={product} actions={actions} />
      ))}
    </DataTable>
  )
}
