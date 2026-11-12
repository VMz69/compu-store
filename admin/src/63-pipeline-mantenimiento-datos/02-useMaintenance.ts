import { useNavigate } from 'react-router-dom'
import { ensurePermission, resetAccess, usePermission } from '@/00-director-acceso'
import { resetCatalog, useCatalogStore } from '@/00-director-catalogo'
import { resetCustomers, useCustomersStore } from '@/00-director-clientes'
import { resetPromotions } from '@/00-director-ofertas'
import { resetSales, useSalesStore } from '@/00-director-ventas'
import { resetRegisteredDemoData } from '@/84-pipeline-persistencia-demo/00-director-persistencia-demo'
import { downloadJson } from '@/84-pipeline-persistencia-demo/03-download'
import { askConfirm } from '@/72-pipeline-confirmaciones-globales/03-confirm.store'
import { toast } from '@/76-pipeline-avisos-globales/02-toast.store'
import { backupFilename, buildBackup } from './03-backup'
import { useSettingsStore } from '../62-pipeline-parametros-emisor/02-store'

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
