import type { ReactNode } from 'react'
import type { PdfDocumentState } from '@/shared/hooks/usePdfDocument'
import { tracer } from '@/ui-traceability'
import { Button } from './Button'
import { Modal, ModalHeader } from './Modal'

const t = tracer('PdfPreviewModal', 'src/shared/ui/PdfPreviewModal.tsx')

interface PdfPreviewModalProps {
  /** Prefijo de trazabilidad del documento (ej. "quotes.preview.COT-2026-007"). */
  traceId: string
  title: ReactNode
  subtitle: string
  pdf: PdfDocumentState
  filename: string
  onClose: () => void
  /** Acción extra a la izquierda del pie (ej. "Avisar por WhatsApp"). */
  footerStart?: ReactNode
}

/**
 * Visor de documentos PDF compartido por cotizaciones y facturas:
 * mismo marco, mismos controles (abrir, descargar, imprimir) y mismos estados.
 */
export function PdfPreviewModal({ traceId, title, subtitle, pdf, filename, onClose, footerStart }: PdfPreviewModalProps) {
  const { url, error, attachFrame, print, openInNewTab } = pdf
  return (
    <Modal onClose={onClose} widthClass="w-[min(96vw,980px)]" className="h-[min(94vh,900px)]" aria-labelledby="pdf-preview-title" {...t(traceId)}>
      <ModalHeader onClose={onClose} closeMeta={t(`${traceId}.close`)}>
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-500 flex items-center justify-center shrink-0">
            <i className="fa-solid fa-file-pdf" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 id="pdf-preview-title" className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              {title}
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>
          </div>
        </div>
      </ModalHeader>

      <div className="flex-1 min-h-0 bg-slate-200 dark:bg-slate-950" {...t(`${traceId}.viewer`)}>
        {url ? (
          <iframe ref={attachFrame} src={url} title={`Vista previa: ${filename}`} className="w-full h-full border-0" />
        ) : (
          <div className="h-full flex flex-col items-center justify-center gap-2 text-slate-500 dark:text-slate-400" role="status">
            <i
              className={error ? 'fa-solid fa-triangle-exclamation text-2xl text-red-500' : 'fa-solid fa-spinner fa-spin text-2xl text-brand'}
              aria-hidden="true"
            />
            <p className="text-xs font-bold">{error ?? 'Generando documento…'}</p>
          </div>
        )}
      </div>

      <div className="px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div>{footerStart}</div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" icon="fa-solid fa-up-right-from-square" disabled={!url} onClick={openInNewTab} {...t(`${traceId}.open-tab`)}>
            Abrir en pestaña
          </Button>
          {url && (
            <a
              href={url}
              download={filename}
              className="h-8 px-3.5 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              {...t(`${traceId}.download`)}
            >
              <i className="fa-solid fa-download text-[10px]" aria-hidden="true" /> Descargar
            </a>
          )}
          <Button icon="fa-solid fa-print" disabled={!url} onClick={print} {...t(`${traceId}.print`)}>
            Imprimir
          </Button>
        </div>
      </div>
    </Modal>
  )
}
