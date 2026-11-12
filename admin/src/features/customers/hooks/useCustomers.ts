import { useMemo, useState, type ChangeEvent } from 'react'
import { ensurePermission, usePermission } from '@/00-director-acceso'
import { usePagination } from '@/70-pipeline-orden-paginacion/04-usePagination'
import { buildWhatsAppLink } from '@/83-pipeline-recursos-publicos/04-whatsapp'
import { askConfirm } from '@/72-pipeline-confirmaciones-globales/03-confirm.store'
import { openModal } from '@/73-pipeline-modales-globales/03-modal.store'
import { toast } from '@/76-pipeline-avisos-globales/02-toast.store'
import { CUSTOMER_TYPE_LABELS, filterCustomers } from '../lib/customer.service'
import { useCustomerStats } from '../lib/statsPort'
import { CUSTOMERS_MODALS } from '../modals'
import { useCustomersStore } from '../store'
import type { Customer, CustomerStatusFilter, CustomerType } from '../types'

export const CUSTOMER_PAGE_SIZES = [10, 25, 50]

const TYPE_OPTIONS = [
  { value: 'all', label: 'Todos los tipos' },
  { value: 'persona', label: CUSTOMER_TYPE_LABELS.persona },
  { value: 'empresa', label: CUSTOMER_TYPE_LABELS.empresa },
]
const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'active', label: 'Activos' },
  { value: 'inactive', label: 'Inactivos' },
]

/**
 * Directorio de clientes: filtros, paginación, métricas de compra por cliente
 * (derivadas de los pedidos) y acciones con validación de permisos.
 */
export function useCustomers() {
  const customers = useCustomersStore((s) => s.customers)
  const deleteCustomer = useCustomersStore((s) => s.deleteCustomer)
  // Métricas provistas por Pedidos a través del puerto (sin importar el feature).
  const statsOf = useCustomerStats()
  const canManage = usePermission('canManageCustomers')
  const canDelete = usePermission('canDeleteCustomers')
  const [search, setSearch] = useState('')
  const [type, setType] = useState<'all' | CustomerType>('all')
  const [status, setStatus] = useState<CustomerStatusFilter>('all')

  const rows = useMemo(
    () =>
      filterCustomers(customers, { search, type, status }).map((customer) => ({
        customer,
        stats: statsOf(customer),
        whatsappLink: buildWhatsAppLink(customer.phone, `Hola ${customer.name}, te saludamos de CompuStore SV.`),
      })),
    [customers, statsOf, search, type, status],
  )
  const { pageItems, pagination } = usePagination(rows, {
    pageSizeOptions: CUSTOMER_PAGE_SIZES,
    resetKey: `${search}|${type}|${status}`,
  })

  const promptDelete = (customer: Customer) => {
    const { orderCount } = statsOf(customer)
    askConfirm({
      title: 'Eliminar cliente',
      message:
        orderCount > 0
          ? `${customer.name} tiene ${orderCount} pedido(s). Los pedidos se conservan, pero el cliente saldrá del directorio. Si solo quieres ocultarlo, márcalo como inactivo.`
          : `¿Eliminar a ${customer.name} del directorio?`,
      confirmText: 'Eliminar',
      onConfirm: () => {
        if (!ensurePermission('canDeleteCustomers', 'No tienes permiso para eliminar clientes')) return
        deleteCustomer(customer.id)
        toast(`Cliente ${customer.name} eliminado`, 'info')
      },
    })
  }

  return {
    rows: pageItems,
    pagination,
    totalCount: rows.length,
    summary: {
      total: customers.length,
      companies: customers.filter((c) => c.type === 'empresa').length,
      inactive: customers.filter((c) => !c.active).length,
    },
    filters: {
      search,
      type,
      status,
      typeOptions: TYPE_OPTIONS,
      statusOptions: STATUS_OPTIONS,
      onSearch: (e: ChangeEvent<HTMLInputElement>) => setSearch(e.target.value),
      clearSearch: () => setSearch(''),
      onType: (e: ChangeEvent<HTMLSelectElement>) => setType(e.target.value as 'all' | CustomerType),
      onStatus: (e: ChangeEvent<HTMLSelectElement>) => setStatus(e.target.value as CustomerStatusFilter),
    },
    canManage,
    canDelete,
    openCreate: () => openModal(CUSTOMERS_MODALS.customerForm, null),
    openEdit: (customer: Customer) => openModal(CUSTOMERS_MODALS.customerForm, customer),
    promptDelete,
  }
}

export type CustomersApi = ReturnType<typeof useCustomers>
export type CustomerRowData = CustomersApi['rows'][number]
