import { useConfirmDialog } from '@/72-pipeline-confirmaciones-globales/02-useConfirmDialog'
import { tracer } from '@/00-trazabilidad'
import { Button } from '../66-pipeline-acciones-administrativas/00-director-acciones-administrativas'
import { Modal } from '../73-pipeline-modales-globales/00-director-modales-globales'
import { Textarea } from '../65-pipeline-campos-administrativos/02-Textarea'

const t = tracer('ConfirmDialog', 'src/shared/ui/ConfirmDialog.tsx')

export function ConfirmDialog() {
  const d = useConfirmDialog()
  const { request, close, accept } = d
  if (!request) return null

  return (
    <Modal onClose={close} widthClass="w-[min(94vw,340px)]" className="p-5 text-center" {...t('app.confirm')}>
      <div className="w-11 h-11 rounded-full bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center text-xl mx-auto mb-3 border border-red-100 dark:border-red-900/40">
        <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1.5">{request.title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">{request.message}</p>
      {request.reason && (
        <label className="block text-left mb-4">
          <span className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
            {request.reason.label}
            <span className="text-red-500 ml-0.5" aria-hidden="true">*</span>
          </span>
          <Textarea
            autoFocus
            className="h-16"
            maxLength={200}
            placeholder={request.reason.placeholder}
            value={d.reason}
            onChange={d.onReasonChange}
            {...t('app.confirm.reason')}
          />
          {d.remaining > 0 && <span className="block text-[10px] text-slate-400 mt-1">Faltan {d.remaining} caracteres.</span>}
        </label>
      )}
      <div className="flex justify-center gap-2">
        <Button
          variant="muted"
          size="md"
          shape="xl"
          className="flex-1"
          onClick={close}
          {...t('app.confirm.cancel')}
        >
          Cancelar
        </Button>
        <Button
          variant="danger"
          size="md"
          shape="xl"
          className="flex-1"
          onClick={accept}
          disabled={!d.reasonOk}
          {...t('app.confirm.accept')}
        >
          {request.confirmText ?? 'Confirmar'}
        </Button>
      </div>
    </Modal>
  )
}
