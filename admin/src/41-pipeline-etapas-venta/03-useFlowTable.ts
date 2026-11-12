import { useState, type FormEvent } from 'react'
import { ensurePermission, usePermission } from '@/00-director-acceso'
import { useFormState } from '@/77-pipeline-edicion-formularios/03-useFormState'
import { closeModal, openModal, useModalPayload } from '@/73-pipeline-modales-globales/03-modal.store'
import { toast } from '@/76-pipeline-avisos-globales/02-toast.store'
import { countByStatus } from '../42-pipeline-persistencia-pedidos/02-order.service'
import { flowStatuses, isOrderStatusId, statusOf, validateStatusLabel } from '../39-pipeline-transiciones-pedidos/02-orderFlow'
import { SALES_MODALS } from '../39-pipeline-transiciones-pedidos/05-modals'
import { useSalesStore } from '../42-pipeline-persistencia-pedidos/00-director-persistencia-pedidos'
import type { OrderStatusId } from '../42-pipeline-persistencia-pedidos/05-types'

/** Tabla del flujo de pedidos: estados en orden, transiciones (fijas) y textos editables. */
export function useFlowTable() {
  const orders = useSalesStore((s) => s.orders)
  // Suscripción a los textos para re-renderizar al editarlos (statusOf los aplica).
  useSalesStore((s) => s.statusLabels)
  const canEdit = usePermission('canEditSettings')

  return {
    rows: flowStatuses().map((status) => ({
      status,
      count: countByStatus(orders, status.id),
      nextNames: status.next.map((id) => statusOf(id).name),
    })),
    canEdit,
    edit: (statusId: OrderStatusId) => openModal(SALES_MODALS.statusLabel, statusId),
  }
}

export type FlowTableApi = ReturnType<typeof useFlowTable>

/** Edición del nombre visible y la descripción de un estado (payload = id del estado). */
export function useStatusLabelForm() {
  const payload = useModalPayload<string>()
  const statusId: OrderStatusId = isOrderStatusId(payload) ? payload : 'registrado'
  const status = statusOf(statusId)
  const update = useSalesStore((s) => s.updateStatusLabel)
  const [submitted, setSubmitted] = useState(false)
  const { values, bind } = useFormState({ name: status.name, description: status.description })
  const errors = submitted ? validateStatusLabel(statusId, values) : {}

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSubmitted(true)
    if (Object.keys(validateStatusLabel(statusId, values)).length > 0) return
    if (!ensurePermission('canEditSettings', 'No tienes permiso para editar la configuración (flujo de pedidos)')) return
    update(statusId, values)
    closeModal()
    toast(`Estado "${values.name.trim()}" actualizado`, 'success')
  }

  return { status, bind, errors, onSubmit, onClose: closeModal }
}
