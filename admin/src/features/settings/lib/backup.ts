import { toLocalISO } from '@/shared/lib/date'
import { getUsersSnapshot } from '@/features/access'
import { getCatalogSnapshot } from '@/features/catalog'
import { getCustomersSnapshot } from '@/features/customers'
import { getSalesSnapshot } from '@/features/sales'
import type { StoreSettings } from '@/shared/config/store.config'
import { snapshotRegisteredDemoData } from '@/shared/lib/demoData'

export const BACKUP_VERSION = '2026.2'

/** Snapshot integral para exportar en JSON. */
export function buildBackup(settings: StoreSettings) {
  const { products, categories, brands } = getCatalogSnapshot()
  const { orders, deletedOrders, orderStatuses, channels } = getSalesSnapshot()
  return {
    version: BACKUP_VERSION,
    exportDate: new Date().toISOString(),
    settings,
    products,
    orders,
    /** Pedidos con eliminación lógica (auditoría). */
    deletedOrders,
    channels,
    orderStatuses,
    categories,
    brands,
    customers: getCustomersSnapshot(),
    // Los usuarios se exportan SIN hash de contraseña.
    users: getUsersSnapshot(),
    // Secciones de los features registrados (cotizaciones, …).
    ...snapshotRegisteredDemoData(),
  }
}

export const backupFilename = (date: Date = new Date()): string =>
  `compustore_backup_${toLocalISO(date)}.json`
