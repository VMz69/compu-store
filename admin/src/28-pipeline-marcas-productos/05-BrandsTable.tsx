import { DataTable, type TableHeader } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { BrandsTabApi } from './03-useBrandsTab'
import { BrandRow } from './04-BrandRow'

const t = tracer('BrandsTable', 'src/28-pipeline-marcas-productos/05-BrandsTable.tsx')

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
