import { useNavigate } from 'react-router-dom'
import { ensurePermission, resetAccess, usePermission } from '@/features/access'
import { resetCatalog, useCatalogStore } from '@/features/catalog'
import { resetCustomers, useCustomersStore } from '@/features/customers'
import { resetPromotions } from '@/features/promotions'
import { resetSales, useSalesStore } from '@/features/sales'
import { resetRegisteredDemoData } from '@/shared/lib/demoData'
import { downloadJson } from '@/shared/lib/download'
import { askConfirm } from '@/shared/store/confirm.store'
import { toast } from '@/shared/store/toast.store'
import { backupFilename, buildBackup } from '../lib/backup'
import { useSettingsStore } from '../store'

/** Respaldo JSON y restablecimiento de fábrica del demo. */
export function useMaintenance() {
  const navigate = useNavigate()
  const settings = useSettingsStore((s) => s.settings)
  const resetSettings = useSettingsStore((s) => s.reset)
  const productCount = useCatalogStore((s) => s.products.length)
  const orderCount = useSalesStore((s) => s.orders.length)
  const channelCount = useSalesStore((s) => s.channels.length)
  const customerCount = useCustomersStore((s) => s.customers.length)
  const canEdit = usePermission('canEditSettings')

  const exportBackup = () => {
    downloadJson(backupFilename(), buildBackup(settings))
    toast('Snapshot de respaldo exportado exitosamente', 'success')
  }

  const resetAll = () => {
    if (!ensurePermission('canEditSettings', 'Acción restringida')) return
    resetCatalog()
    resetSales()
    resetPromotions()
    resetSettings()
    resetCustomers()
    resetAccess() // usuarios de fábrica; la sesión se mantiene si tu usuario existe
    resetRegisteredDemoData() // features registrados en shared/lib/demoData (cotizaciones, …)
    navigate('/ajustes')
    toast('Datos de demostración restablecidos de fábrica', 'info')
  }

  const promptReset = () =>
    askConfirm({
      title: 'Restablecer Demo',
      message:
        'Esta acción restaurará catálogo, pedidos, clientes, usuarios y ajustes a su estado original de fábrica.',
      confirmText: 'Restablecer',
      onConfirm: resetAll,
    })

  return {
    summary: [
      `${productCount} Productos de catálogo`,
      `${orderCount} Órdenes operativas`,
      `${channelCount} Canales de venta`,
      `${customerCount} Clientes del directorio`,
    ],
    canEdit,
    exportBackup,
    promptReset,
  }
}
