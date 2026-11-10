import { Button, ListToolbar, LiveSearch, Select } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { CustomersApi } from '../hooks/useCustomers'

const t = tracer('CustomersToolbar', 'src/features/customers/components/CustomersToolbar.tsx')

type CustomersToolbarProps = Pick<CustomersApi, 'filters' | 'totalCount' | 'canManage' | 'openCreate'>

/** Barra estándar de listados: buscador · tipo · estado ··· "Nuevo cliente". */
export function CustomersToolbar({ filters, totalCount, canManage, openCreate }: CustomersToolbarProps) {
  return (
    <ListToolbar
      traceId="customers.toolbar"
      search={
        <LiveSearch
          value={filters.search}
          onChange={filters.onSearch}
          onClear={filters.clearSearch}
          resultCount={totalCount}
          placeholder="Buscar nombre, teléfono, correo, DUI/NIT…"
          aria-label="Buscar clientes"
          {...t('customers.toolbar.search')}
        />
      }
      filters={
        <>
          <Select tone="filter" options={filters.typeOptions} value={filters.type} onChange={filters.onType} aria-label="Filtrar por tipo" {...t('customers.toolbar.type')} />
          <Select tone="filter" options={filters.statusOptions} value={filters.status} onChange={filters.onStatus} aria-label="Filtrar por estado" {...t('customers.toolbar.status')} />
        </>
      }
      action={
        canManage && (
          <Button icon="fa-solid fa-user-plus" onClick={openCreate} {...t('customers.toolbar.create')}>
            Nuevo cliente
          </Button>
        )
      }
    />
  )
}
