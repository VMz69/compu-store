import { Button } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { ProductFormApi } from './02-useProductForm'

const t = tracer('ProductFormFooter', 'src/18-pipeline-edicion-producto/05-ProductFormFooter.tsx')

/**
 * Pie fijo: navegación entre secciones a la izquierda y acciones a la derecha.
 * Guardar está disponible desde cualquier sección (no obliga a recorrer las 4).
 */
export function ProductFormFooter({ api }: { api: ProductFormApi }) {
  const { tabs, isEdit, isLoading, onClose } = api

  return (
    <div className="px-4 sm:px-5 py-3 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 flex flex-wrap items-center justify-between gap-3 shrink-0">
      <div className="flex items-center gap-1">
        <Button
          variant="ghost"
          icon="fa-solid fa-chevron-left"
          disabled={tabs.isFirst}
          onClick={tabs.prev}
          {...t('catalog.product-form.prev')}
        >
          Anterior
        </Button>
        <span className="px-1 text-[11px] font-semibold text-slate-400 tabular-nums" aria-live="polite">
          {tabs.index + 1} / {tabs.total}
        </span>
        <Button variant="ghost" disabled={tabs.isLast} onClick={tabs.next} {...t('catalog.product-form.next')}>
          Siguiente <i className="fa-solid fa-chevron-right text-[10px]" aria-hidden="true" />
        </Button>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <Button variant="outline" onClick={onClose} {...t('catalog.product-form.cancel')}>
          Cancelar
        </Button>
        <Button
          type="submit"
          icon="fa-solid fa-floppy-disk"
          isLoading={isLoading}
          {...t('catalog.product-form.submit')}
        >
          {isEdit ? 'Guardar cambios' : 'Crear producto'}
        </Button>
      </div>
    </div>
  )
}
