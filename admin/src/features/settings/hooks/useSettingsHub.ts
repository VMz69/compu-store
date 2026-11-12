import { ROLE_LIST, useAccessStore } from '@/00-director-acceso'
import { ORDER_STATUSES, useSalesStore } from '@/00-director-ventas'
import { HUB_CARDS, type HubCardConfig } from '../config/hub.config'
import { useSettingsStore } from '../store'

export interface HubStat {
  label: string
  value: string
  /** Clases completas del valor. */
  valueClass?: string
}

/** Tarjetas del hub de Ajustes con sus métricas en vivo. */
export function useSettingsHub() {
  const settings = useSettingsStore((s) => s.settings)
  const channels = useSalesStore((s) => s.channels)
  const orderCount = useSalesStore((s) => s.orders.length)
  const users = useAccessStore((s) => s.users)
  const activeChannels = channels.filter((c) => c.active).length

  const stats: Record<HubCardConfig['id'], HubStat[]> = {
    canales: [
      { label: 'Canales', value: `${activeChannels} / ${channels.length} Activos` },
      { label: 'Flujo', value: `${ORDER_STATUSES.length} Estados` },
      { label: 'Órdenes', value: `${orderCount} Registradas`, valueClass: 'text-brand' },
    ],
    usuarios: [
      { label: 'Usuarios', value: `${users.filter((u) => u.active).length} / ${users.length} Activos` },
      { label: 'Roles', value: `${ROLE_LIST.length} Perfiles` },
      {
        label: 'Pendientes',
        value: `${users.filter((u) => u.mustChangePassword).length} Contraseñas`,
        valueClass: 'text-amber-600 dark:text-amber-400',
      },
    ],
    identidad: [
      { label: 'Nombre', value: settings.name },
      { label: 'NIT', value: settings.nit },
    ],
  }

  return HUB_CARDS.map((card) => ({ card, stats: stats[card.id] }))
}
