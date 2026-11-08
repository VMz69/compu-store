import { useMemo } from 'react'
import { ensurePermission, usePermission } from '@/features/access'
import { openModal } from '@/shared/store/modal.store'
import { toast } from '@/shared/store/toast.store'
import { getChannelStats } from '../lib/order.service'
import { SALES_MODALS } from '../modals'
import { useSalesStore } from '../store'
import type { Channel } from '../types'

/** Canales omnicanal con métricas y acciones de administración. */
export function useChannels() {
  const channels = useSalesStore((s) => s.channels)
  const orders = useSalesStore((s) => s.orders)
  const toggleChannel = useSalesStore((s) => s.toggleChannel)
  const canEdit = usePermission('canEditSettings')

  const items = useMemo(
    () => channels.map((channel) => ({ channel, ...getChannelStats(channel, orders) })),
    [channels, orders],
  )

  const toggle = (channelId: string) => {
    if (!ensurePermission('canEditSettings', 'Solo Superadmin puede modificar los canales de venta')) return
    const channel = toggleChannel(channelId)
    if (channel) toast(`Canal "${channel.name}" ${channel.active ? 'activado' : 'desactivado'}`, 'info')
  }

  return {
    items,
    activeCount: channels.filter((c) => c.active).length,
    totalCount: channels.length,
    canEdit,
    toggle,
    openCreate: () => openModal(SALES_MODALS.channelForm, null),
    openEdit: (channel: Channel) => openModal(SALES_MODALS.channelForm, channel),
  }
}

export type ChannelsApi = ReturnType<typeof useChannels>
