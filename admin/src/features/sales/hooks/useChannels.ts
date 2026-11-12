import { useMemo } from 'react'
import { ensurePermission, usePermission } from '@/00-director-acceso'
import { askConfirm } from '@/72-pipeline-confirmaciones-globales/03-confirm.store'
import { openModal } from '@/73-pipeline-modales-globales/03-modal.store'
import { toast } from '@/76-pipeline-avisos-globales/02-toast.store'
import { channelDeleteBlock, ordersOfChannel } from '../lib/order.service'
import { SALES_MODALS } from '../modals'
import { useSalesStore } from '../store'
import type { Channel } from '../types'

const DENIED = 'No tienes permiso para editar la configuración (canales de venta)'

/** CRUD de canales de venta (tabla de Ajustes). */
export function useChannels() {
  const channels = useSalesStore((s) => s.channels)
  const orders = useSalesStore((s) => s.orders)
  const toggleChannel = useSalesStore((s) => s.toggleChannel)
  const deleteChannel = useSalesStore((s) => s.deleteChannel)
  const canEdit = usePermission('canEditSettings')

  const items = useMemo(
    () =>
      channels.map((channel) => {
        const orderCount = ordersOfChannel(orders, channel).length
        return { channel, orderCount, deleteBlock: channelDeleteBlock(orderCount) }
      }),
    [channels, orders],
  )

  return {
    items,
    activeCount: channels.filter((c) => c.active).length,
    canEdit,
    toggle: (channel: Channel) => {
      if (!ensurePermission('canEditSettings', DENIED)) return
      const updated = toggleChannel(channel.id)
      if (updated) toast(`Canal "${updated.name}" ${updated.active ? 'activado' : 'desactivado'}`, 'info')
    },
    remove: (channel: Channel, block: string | null) => {
      if (block) return toast(`No se puede eliminar "${channel.name}". ${block}`, 'warning')
      askConfirm({
        title: `Eliminar canal ${channel.name}`,
        message: 'El canal no tiene pedidos y dejará de ofrecerse al registrar pedidos.',
        confirmText: 'Eliminar canal',
        onConfirm: () => {
          if (!ensurePermission('canEditSettings', DENIED)) return
          try {
            deleteChannel(channel.id)
            toast(`Canal "${channel.name}" eliminado`, 'info')
          } catch (error) {
            toast(error instanceof Error ? error.message : 'No se pudo eliminar el canal.', 'danger')
          }
        },
      })
    },
    openCreate: () => openModal(SALES_MODALS.channelForm, null),
    openEdit: (channel: Channel) => openModal(SALES_MODALS.channelForm, channel),
  }
}

export type ChannelsApi = ReturnType<typeof useChannels>
