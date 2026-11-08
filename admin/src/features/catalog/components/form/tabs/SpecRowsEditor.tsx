import { Button, IconButton, Input } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { ProductFormApi } from '../../../hooks/useProductForm'

const t = tracer('SpecRowsEditor', 'src/features/catalog/components/form/tabs/SpecRowsEditor.tsx')

/** Ficha técnica: lista dinámica de pares clave/valor (D1, D2, D3…). */
export function SpecRowsEditor({ api }: { api: ProductFormApi }) {
  const { form, errors } = api
  const rows = form.values.specs

  return (
    <section className="space-y-3 pt-5 border-t border-slate-200 dark:border-slate-800" {...t('catalog.product-form.specs')}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Ficha técnica ({rows.length})
          </h4>
          <p className="text-[11px] text-slate-400">Se muestra como tabla de características en el detalle del producto.</p>
        </div>
        <Button variant="tint" size="xs" icon="fa-solid fa-plus" onClick={form.addSpec} {...t('catalog.product-form.specs.add')}>
          Agregar especificación
        </Button>
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center rounded-xl border border-dashed border-slate-300 dark:border-slate-700 text-[11px] text-slate-400">
          Sin especificaciones. Agrega la primera con el botón de arriba.
        </p>
      ) : (
        <ul className="space-y-2">
          {rows.map((row, index) => {
            const keyError = errors[`specs.${row.id}.key`]
            const valueError = errors[`specs.${row.id}.value`]
            return (
              <li key={row.id} className="grid grid-cols-[auto_1fr_1fr_auto] items-center gap-2" {...t(`catalog.product-form.specs.row.${index + 1}`)}>
                <span className="w-7 text-center text-[10px] font-black text-slate-400 tabular-nums" aria-hidden="true">
                  D{index + 1}
                </span>
                <Input
                  placeholder="Clave · Ej. Procesador"
                  aria-label={`Clave de la especificación ${index + 1}`}
                  invalid={Boolean(keyError)}
                  title={keyError}
                  {...form.bindSpec(row.id, 'key')}
                />
                <Input
                  placeholder="Valor · Ej. Intel Core i5"
                  aria-label={`Valor de la especificación ${index + 1}`}
                  invalid={Boolean(valueError)}
                  title={valueError}
                  {...form.bindSpec(row.id, 'value')}
                />
                <IconButton
                  icon="fa-solid fa-xmark"
                  label={`Quitar especificación ${index + 1}`}
                  tone="plain"
                  onClick={() => form.removeSpec(row.id)}
                  {...t(`catalog.product-form.specs.remove.${index + 1}`)}
                />
              </li>
            )
          })}
        </ul>
      )}
      {Object.keys(errors).some((path) => path.startsWith('specs.')) && (
        <p role="alert" className="text-[10px] font-semibold text-red-600 dark:text-red-400">
          Completa la clave y el valor de cada fila, o déjala totalmente vacía.
        </p>
      )}
    </section>
  )
}
