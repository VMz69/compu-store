import { Button } from '@/shared/ui'
import { tracer } from '@/ui-traceability'

const t = tracer('ResetCard', 'src/features/settings/components/ResetCard.tsx')

interface ResetCardProps {
  canEdit: boolean
  onReset: () => void
}

export function ResetCard({ canEdit, onReset }: ResetCardProps) {
  return (
    <div
      className="bg-white dark:bg-slate-900 rounded-xl border border-red-200 dark:border-red-900/50 p-5 shadow-sm space-y-3.5 flex flex-col justify-between"
      {...t('settings.reset')}
    >
      <div>
        <h4 className="text-xs font-black uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-2 mb-2">
          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" /> Zona de Restablecimiento
        </h4>
        <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
          Borra las modificaciones almacenadas en la memoria local del navegador y restaura los 12 productos
          originales, las 5 órdenes, clientes, usuarios, canales, promociones y ajustes de fábrica.
        </p>
        <span className="inline-block p-2 rounded-lg bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-[10px] font-bold">
          Esta acción requiere confirmación y es irreversible.
        </span>
      </div>
      {canEdit ? (
        <Button variant="danger" icon="fa-solid fa-rotate-left" className="w-full" onClick={onReset} {...t('settings.reset.run')}>
          Restablecer Demo de Fábrica
        </Button>
      ) : (
        <span className="text-xs text-slate-400">Protegido por el Superadmin</span>
      )}
    </div>
  )
}
