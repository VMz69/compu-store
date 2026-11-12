import type { ChangeEvent } from 'react'
import { cn } from '@/83-pipeline-recursos-publicos/02-cn'
import { formatCurrency } from '@/82-pipeline-calculo-importes/02-currency'
import { tracer } from '@/00-trazabilidad'
import { AffixInput } from '../68-pipeline-marcos-contenido/04-AffixInput'
import { IconButton } from '../66-pipeline-acciones-administrativas/02-IconButton'

const t = tracer('LineItemsEditor', 'src/77-pipeline-edicion-formularios/01-LineItemsEditor.tsx')

const STEP =
  'w-7 h-8 flex items-center justify-center text-slate-500 hover:text-brand hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:pointer-events-none'

export interface EditableLine {
  id: string
  name: string
  sku: string
  unitPrice: number
  quantity: number
  discountPercent: number
  total: number
  /** Tope de unidades (ej. stock disponible). Sin tope si se omite. */
  max?: number
  error?: string
}

interface LineItemsEditorProps {
  title: string
  lines: EditableLine[]
  units: number
  /** Error general (ej. "Agrega al menos un producto"). */
  error?: string
  emptyText: string
  /** Prefijo de trazabilidad (ej. "quotes.builder.items"). */
  traceId: string
  onStep: (id: string, delta: number) => void
  onQuantity: (id: string) => (e: ChangeEvent<HTMLInputElement>) => void
  onDiscount: (id: string) => (e: ChangeEvent<HTMLInputElement>) => void
  onRemove: (id: string) => void
}

/** Líneas de venta: cantidad con stepper, descuento por línea, total y errores por línea. */
export function LineItemsEditor({ title, lines, units, error, emptyText, traceId, onStep, onQuantity, onDiscount, onRemove }: LineItemsEditorProps) {
  return (
    <section className="space-y-3" {...t(traceId)}>
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">{title} ({lines.length})</h3>
        {units > 0 && <span className="text-[10px] text-slate-400">{units} unidades</span>}
      </div>

      {lines.length === 0 ? (
        <p
          className={cn(
            'py-6 px-3 text-center rounded-xl border border-dashed text-[11px]',
            error ? 'border-red-300 dark:border-red-800 font-semibold text-red-600 dark:text-red-400' : 'border-slate-300 dark:border-slate-700 text-slate-400',
          )}
          role={error ? 'alert' : undefined}
        >
          <i className="fa-solid fa-hand-pointer mr-1.5" aria-hidden="true" />
          {error ?? emptyText}
        </p>
      ) : (
        <ul className="divide-y divide-slate-100 dark:divide-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
          {lines.map((line) => (
            <li key={line.id} className={cn('p-3 space-y-2', line.error ? 'bg-red-50/60 dark:bg-red-950/20' : 'bg-white dark:bg-slate-900')} {...t(`${traceId}.${line.id}`)}>
              <div className="flex items-start gap-2">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 leading-tight">{line.name}</p>
                  <p className="text-[10px] text-slate-400">
                    <span className="font-mono">{line.sku}</span> · {formatCurrency(line.unitPrice)} c/u
                    {line.max !== undefined && ` · ${line.max} disp.`}
                  </p>
                </div>
                <IconButton icon="fa-solid fa-xmark" label={`Quitar ${line.name}`} tone="plain" sizeClass="w-7 h-7" onClick={() => onRemove(line.id)} {...t(`${traceId}.${line.id}.remove`)} />
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden" role="group" aria-label="Cantidad">
                  <button type="button" className={STEP} aria-label="Restar una unidad" disabled={line.quantity <= 1} onClick={() => onStep(line.id, -1)} {...t(`${traceId}.${line.id}.decrement`)}>
                    <i className="fa-solid fa-minus text-[10px]" aria-hidden="true" />
                  </button>
                  <input
                    type="number"
                    min="1"
                    max={line.max}
                    value={line.quantity}
                    onChange={onQuantity(line.id)}
                    aria-label={`Cantidad de ${line.name}`}
                    aria-invalid={Boolean(line.error) || undefined}
                    className="w-11 h-8 text-center text-xs font-bold bg-transparent text-slate-800 dark:text-slate-100 outline-none tabular-nums [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none"
                    {...t(`${traceId}.${line.id}.qty`)}
                  />
                  <button type="button" className={STEP} aria-label="Sumar una unidad" disabled={line.max !== undefined && line.quantity >= line.max} onClick={() => onStep(line.id, 1)} {...t(`${traceId}.${line.id}.increment`)}>
                    <i className="fa-solid fa-plus text-[10px]" aria-hidden="true" />
                  </button>
                </div>
                <div className="w-24">
                  <AffixInput suffix="% desc." type="number" min="0" max="100" step="1" value={String(line.discountPercent)} onChange={onDiscount(line.id)} aria-label={`Descuento de ${line.name}`} {...t(`${traceId}.${line.id}.discount`)} />
                </div>
                <span className="ml-auto text-sm font-black text-slate-800 dark:text-slate-100 tabular-nums">{formatCurrency(line.total)}</span>
              </div>
              {line.error && (
                <p role="alert" className="text-[10px] font-semibold text-red-600 dark:text-red-400">
                  <i className="fa-solid fa-triangle-exclamation mr-1" aria-hidden="true" />
                  {line.error}
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
