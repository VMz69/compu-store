// API pública del feature `customers`. Desde fuera solo se importa este archivo.
export { CustomerFormModal } from './components/CustomerFormModal'
export { CUSTOMERS_MODALS } from './modals'
export { CustomersPage } from './pages/CustomersPage'
export { getCustomersSnapshot, resetCustomers, useCustomersStore } from './store'
export type { Customer, CustomerType } from './types'
