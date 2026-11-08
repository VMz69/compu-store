import { Button, DataTable, EmptyState, Pagination, type TableHeader } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { CustomerRow } from '../components/CustomerRow'
import { CustomersToolbar } from '../components/CustomersToolbar'
import { useCustomers } from '../hooks/useCustomers'

const t = tracer('CustomersPage', 'src/features/customers/pages/CustomersPage.tsx')

const HEADERS: TableHeader[] = [
  { label: 'Cliente', className: 'px-4' },
  { label: 'Contacto' },
  { label: 'Ciudad' },
  { label: 'Compras', className: 'px-3 text-right' },
  { label: 'Estado' },
]
const ACTIONS_HEADER: TableHeader = { label: 'Acciones', className: 'px-4 text-right' }

/** /clientes · Directorio de clientes de la tienda (personas y empresas). */
export function CustomersPage() {
  const api = useCustomers()
  const headers = api.canManage || api.canDelete ? [...HEADERS, ACTIONS_HEADER] : HEADERS
  const { summary } = api

  return (
    <div className="flex flex-col h-full animate-fade-in" {...t('customers')}>
      <CustomersToolbar filters={api.filters} totalCount={api.totalCount} canManage={api.canManage} openCreate={api.openCreate} />

      <div key={api.pagination.page} className="flex-1 p-4 sm:p-5 overflow-y-auto custom-scrollbar space-y-3" {...t('customers.content')}>
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          <b className="text-slate-700 dark:text-slate-200">{summary.total}</b> clientes registrados ·{' '}
          <b className="text-slate-700 dark:text-slate-200">{summary.companies}</b> empresas ·{' '}
          <b className="text-slate-700 dark:text-slate-200">{summary.inactive}</b> inactivos. Las compras se calculan
          con los pedidos entregados.
        </p>

        {api.totalCount === 0 ? (
          <EmptyState
            icon="fa-solid fa-address-book"
            title="No hay clientes que coincidan."
            hint="Ajusta la búsqueda o los filtros."
            action={
              api.canManage && (
                <Button icon="fa-solid fa-user-plus" size="md" onClick={api.openCreate} {...t('customers.empty.create')}>
                  Registrar cliente
                </Button>
              )
            }
          />
        ) : (
          <DataTable headers={headers} {...t('customers.table')}>
            {api.rows.map((row) => (
              <CustomerRow key={row.customer.id} row={row} actions={api} />
            ))}
          </DataTable>
        )}
      </div>

      <Pagination pagination={api.pagination} idPrefix="customers" itemLabel="clientes" />
    </div>
  )
}
