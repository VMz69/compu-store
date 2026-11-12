import { useState } from 'react'
import { useConfirmStore } from '@/72-pipeline-confirmaciones-globales/03-confirm.store'

/** Estado y acciones del diálogo global de confirmación (con motivo opcional). */
export function useConfirmDialog() {
  const request = useConfirmStore((s) => s.request)
  const close = useConfirmStore((s) => s.close)
  const accept = useConfirmStore((s) => s.accept)
  const [reason, setReason] = useState('')
  // Cada solicitud empieza con el motivo vacío (se compara la solicitud vigente, sin efectos).
  const [owner, setOwner] = useState(request)
  if (owner !== request) {
    setOwner(request)
    setReason('')
  }

  const minLength = request?.reason?.minLength ?? 0
  const reasonOk = !request?.reason || reason.trim().length >= minLength

  return {
    request,
    isOpen: request !== null,
    close,
    reason,
    reasonOk,
    remaining: Math.max(0, minLength - reason.trim().length),
    onReasonChange: (event: { target: { value: string } }) => setReason(event.target.value),
    accept: () => {
      if (reasonOk) accept(reason)
    },
  }
}
