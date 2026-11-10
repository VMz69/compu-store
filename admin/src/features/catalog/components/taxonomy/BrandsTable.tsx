import { DataTable, type TableHeader } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { BrandsTabApi } from '../../hooks/taxonomy/useBrandsTab'
import { BrandRow } from './BrandRow'

const t = tracer('BrandsTable', 'src/features/catalog/components/taxonomy/BrandsTable.tsx')

const HEADERS: TableHeader[] = [
  { label: 'Marca', className: 'px-4' },
  { label: 'Productos', className: 'px-3 text-right' },
  { label: 'Sitio web' },
  { label: 'Estado' },
  { label: 'Acciones', className: 'px-4 text-right' },
]

export function BrandsTable({ api }: { api: BrandsTabApi }) {
  return (
    <DataTable headers={HEADERS} {...t('catalog.brands.table')}>
      {api.items.map((item) => (
        <BrandRow key={item.brand.id} item={item} api={api} />
      ))}
    </DataTable>
  )
}
