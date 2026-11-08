import { Button, SearchInput, Select } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { CustomersApi } from '../hooks/useCustomers'

const t = tracer('CustomersToolbar', 'src/features/customers/components/CustomersToolbar.tsx')

type CustomersToolbarProps = Pick<CustomersApi, 'filters' | 'totalCount' | 'canManage' | 'openCreate'>

/** Búsqueda, filtros por tipo/estado y CTA "Nuevo cliente". */
export function CustomersToolbar({ filters, totalCount, canManage, openCreate }: CustomersToolbarProps) {
  return (
    <div
      className="px-5 py-3 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex flex-col md:flex-row md:items-center justify-between gap-3"
      {...t('customers.toolbar')}
    >
      <div className="flex flex-wrap items-center gap-2.5">
        <SearchInput
          wrapperClassName="w-72"
          value={filters.search}
          onChange={filters.onSearch}
          placeholder="Buscar por nombre, teléfono, correo, DUI/NIT…"
          aria-label="Buscar clientes"
          {...t('customers.toolbar.search')}
        />
        <Select tone="filter" options={filters.typeOptions} value={filters.type} onChange={filters.onType} aria-label="Filtrar por tipo" {...t('customers.toolbar.type')} />
        <Select tone="filter" options={filters.statusOptions} value={filters.status} onChange={filters.onStatus} aria-label="Filtrar por estado" {...t('customers.toolbar.status')} />
      </div>
      <div className="flex items-center gap-2.5">
        <span className="text-xs font-bold text-slate-400">{totalCount} clientes</span>
        {canManage && (
          <Button icon="fa-solid fa-user-plus" onClick={openCreate} {...t('customers.toolbar.create')}>
            Nuevo cliente
          </Button>
        )}
      </div>
    </div>
  )
}
