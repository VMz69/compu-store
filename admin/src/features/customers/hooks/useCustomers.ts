import { useMemo, useState, type ChangeEvent } from 'react'
import { ensurePermission, usePermission } from '@/features/access'
import { useSalesStore } from '@/features/sales'
import { usePagination } from '@/shared/hooks/usePagination'
import { buildWhatsAppLink } from '@/shared/lib/whatsapp'
import { askConfirm } from '@/shared/store/confirm.store'
import { openModal } from '@/shared/store/modal.store'
import { toast } from '@/shared/store/toast.store'
import { CUSTOMER_TYPE_LABELS, filterCustomers, getCustomerStats } from '../lib/customer.service'
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
  const orders = useSalesStore((s) => s.orders)
  const canManage = usePermission('canManageCustomers')
  const canDelete = usePermission('canDeleteCustomers')
  const [search, setSearch] = useState('')
  const [type, setType] = useState<'all' | CustomerType>('all')
  const [status, setStatus] = useState<CustomerStatusFilter>('all')

  const rows = useMemo(
    () =>
      filterCustomers(customers, { search, type, status }).map((customer) => ({
        customer,
        stats: getCustomerStats(customer, orders),
        whatsappLink: buildWhatsAppLink(customer.phone, `Hola ${customer.name}, te saludamos de CompuStore SV.`),
      })),
    [customers, orders, search, type, status],
  )
  const { pageItems, pagination } = usePagination(rows, {
    pageSizeOptions: CUSTOMER_PAGE_SIZES,
    resetKey: `${search}|${type}|${status}`,
  })

  const promptDelete = (customer: Customer) => {
    const { orderCount } = getCustomerStats(customer, orders)
    askConfirm({
      title: 'Eliminar cliente',
      message:
        orderCount > 0
          ? `${customer.name} tiene ${orderCount} pedido(s). Los pedidos se conservan, pero el cliente saldrá del directorio. Si solo quieres ocultarlo, márcalo como inactivo.`
          : `¿Eliminar a ${customer.name} del directorio?`,
      confirmText: 'Eliminar',
      onConfirm: () => {
        if (!ensurePermission('canDeleteCustomers', 'Su rol no puede eliminar clientes')) return
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
