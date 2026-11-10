import { useState, type FormEvent } from 'react'
import { ensurePermission } from '@/features/access'
import { useFormState } from '@/shared/hooks/useFormState'
import { closeModal, useModalPayload } from '@/shared/store/modal.store'
import { toast } from '@/shared/store/toast.store'
import { ordersOfChannel, validateChannel } from '../lib/order.service'
import { useSalesStore } from '../store'
import type { Channel } from '../types'

/** Íconos ofrecidos (evita escribir clases a mano). */
export const CHANNEL_ICONS = [
  { value: 'fa-brands fa-whatsapp', label: 'WhatsApp' },
  { value: 'fa-solid fa-globe', label: 'Web' },
  { value: 'fa-solid fa-store', label: 'Tienda' },
  { value: 'fa-solid fa-building', label: 'Empresa' },
  { value: 'fa-brands fa-facebook', label: 'Facebook' },
  { value: 'fa-brands fa-instagram', label: 'Instagram' },
  { value: 'fa-brands fa-tiktok', label: 'TikTok' },
  { value: 'fa-solid fa-phone', label: 'Teléfono' },
]

/** Alta/edición de canal de venta (payload = canal a editar o null). */
export function useChannelForm() {
  const channel = useModalPayload<Channel | null>()
  const channels = useSalesStore((s) => s.channels)
  const orders = useSalesStore((s) => s.orders)
  const saveChannel = useSalesStore((s) => s.saveChannel)
  const isLoading = useSalesStore((s) => s.isLoading)
  const [submitted, setSubmitted] = useState(false)
  const { values, bind, bindCheck, setField } = useFormState({
    name: channel?.name ?? '',
    badge: channel?.badge ?? 'Canal',
    icon: channel?.icon ?? 'fa-solid fa-store',
    description: channel?.description ?? '',
    active: channel?.active ?? true,
  })
  const input = { id: channel?.id, name: values.name, description: values.description }
  const errors = submitted ? validateChannel(input, channels) : {}
  const orderCount = channel ? ordersOfChannel(orders, channel).length : 0
  const renaming = Boolean(channel) && values.name.trim() !== '' && values.name.trim() !== channel?.name

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    if (Object.keys(validateChannel(input, channels)).length > 0) return
    if (!ensurePermission('canEditSettings', 'No tienes permiso para editar la configuración (canales de venta)')) return
    await saveChannel({
      id: channel?.id,
      name: values.name.trim(),
      badge: values.badge.trim() || 'Canal',
      icon: values.icon,
      description: values.description.trim(),
      active: values.active,
    })
    closeModal()
    toast(channel ? `Canal "${values.name.trim()}" actualizado` : `Canal "${values.name.trim()}" creado`, 'success')
  }

  return {
    isEdit: Boolean(channel),
    bind,
    bindCheck,
    errors,
    icon: values.icon,
    icons: CHANNEL_ICONS,
    selectIcon: (icon: string) => setField('icon', icon),
    renameNotice: renaming && orderCount > 0 ? `Se actualizará el nombre en ${orderCount} pedido(s).` : null,
    onSubmit,
    onClose: closeModal,
    isLoading,
  }
}

export type ChannelFormApi = ReturnType<typeof useChannelForm>
