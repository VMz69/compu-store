import { Card, CardTitle } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { IdentityFormApi } from '../hooks/useIdentityForm'

const t = tracer('IdentityPreview', 'src/features/settings/components/IdentityPreview.tsx')

const LABEL = 'text-[9px] font-black uppercase tracking-wider text-slate-400'
const LINE = 'text-[11px] text-slate-500 dark:text-slate-400 leading-snug break-words'

/** Vista previa en vivo: encabezado de documentos + bloque "Datos del emisor" de la factura. */
export function IdentityPreview({ preview: p }: { preview: IdentityFormApi['preview'] }) {
  return (
    <Card className="p-5 space-y-3 xl:sticky xl:top-0" {...t('settings.identity.preview')}>
      <CardTitle className="flex items-center gap-2">
        <i className="fa-solid fa-eye text-brand" aria-hidden="true" /> Así aparece en tus documentos
      </CardTitle>
      <div className="rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-950" aria-live="polite">
        <div className="h-1.5 bg-brand" aria-hidden="true" />
        <div className="p-4 space-y-1">
          <p className={LABEL}>Encabezado · cotización y factura</p>
          <p className="text-sm font-black text-slate-800 dark:text-slate-100 break-words">{p.name}</p>
          <p className={LINE}>{p.address}</p>
          <p className={LINE}>{p.phones.length ? `Tel. ${p.phones.join(' / ')}` : 'Sin teléfono'} · {p.email}</p>
        </div>
        <div className="p-4 space-y-0.5 border-t border-dashed border-slate-200 dark:border-slate-700">
          <p className={LABEL}>Datos del emisor · factura (DTE)</p>
          <p className="text-[11px] font-bold text-slate-700 dark:text-slate-200 break-words">{p.legalName || '—'}</p>
          <p className={LINE}>NIT: {p.nit || '—'} · NRC: {p.nrc || '—'}</p>
          <p className={LINE}>Actividad: {p.economicActivity || '—'}</p>
          <p className={LINE}>Establecimiento: {p.establishmentType || '—'}</p>
        </div>
      </div>
      <p className="text-[10px] text-slate-400 leading-relaxed">Los documentos ya emitidos conservan los datos con los que se generaron.</p>
    </Card>
  )
}
