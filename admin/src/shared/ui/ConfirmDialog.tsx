import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog'
import { tracer } from '@/ui-traceability'
import { Button } from './Button'
import { Modal } from './Modal'

const t = tracer('ConfirmDialog', 'src/shared/ui/ConfirmDialog.tsx')

export function ConfirmDialog() {
  const { request, close, accept } = useConfirmDialog()
  if (!request) return null

  return (
    <Modal onClose={close} widthClass="w-[min(94vw,340px)]" className="p-5 text-center" {...t('app.confirm')}>
      <div className="w-11 h-11 rounded-full bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center text-xl mx-auto mb-3 border border-red-100 dark:border-red-900/40">
        <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
      </div>
      <h3 className="text-sm font-black text-slate-800 dark:text-slate-100 mb-1.5">{request.title}</h3>
      <p className="text-xs text-slate-500 dark:text-slate-400 mb-5 leading-relaxed">{request.message}</p>
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
          {...t('app.confirm.accept')}
        >
          {request.confirmText ?? 'Confirmar'}
        </Button>
      </div>
    </Modal>
  )
}
