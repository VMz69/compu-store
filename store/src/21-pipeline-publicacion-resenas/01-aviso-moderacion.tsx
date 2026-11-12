import { uiMeta } from '@/04-trazabilidad-ui'

const SOURCE = 'src/21-pipeline-publicacion-resenas/01-aviso-moderacion.tsx'

interface ReviewPendingNoticeProps {
  show: boolean
  onDismiss: () => void
}

/** Confirmación tras enviar: la opinión queda en revisión antes de publicarse. */
export const ReviewPendingNotice = ({ show, onDismiss }: ReviewPendingNoticeProps) => {
  if (!show) return null

  return (
    <div
      role="status"
      className="flex items-start gap-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2.5 text-[11px] text-emerald-800 dark:text-emerald-300"
      {...uiMeta({ id: 'producto.reviews.form.pending', component: 'ReviewPendingNotice', source: SOURCE })}
    >
      <i className="fa-solid fa-circle-check mt-0.5" aria-hidden="true" />
      <p className="flex-1">
        <b>¡Gracias por tu opinión!</b> La revisaremos y aparecerá aquí en cuanto sea aprobada.
      </p>
      <button
        type="button"
        onClick={onDismiss}
        aria-label="Cerrar aviso"
        className="text-emerald-700/70 hover:text-emerald-900 dark:text-emerald-400/70 dark:hover:text-emerald-200 cursor-pointer"
        {...uiMeta({ id: 'producto.reviews.form.pending.close', component: 'ReviewPendingNotice', source: SOURCE })}
      >
        <i className="fa-solid fa-xmark" aria-hidden="true" />
      </button>
    </div>
  )
}
