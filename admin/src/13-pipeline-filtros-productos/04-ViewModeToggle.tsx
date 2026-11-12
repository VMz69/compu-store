import { cn } from '@/83-pipeline-recursos-publicos/02-cn'
import { tracer } from '@/00-trazabilidad'
import type { ProductViewMode } from '../25-pipeline-persistencia-catalogo/04-types'

const t = tracer('ViewModeToggle', 'src/features/catalog/components/toolbar/ViewModeToggle.tsx')

const BASE = 'w-7 h-7 rounded-md flex items-center justify-center transition-all'
const ACTIVE = 'bg-white dark:bg-slate-700 text-brand shadow-xs font-bold'
const IDLE = 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'

interface ViewModeToggleProps {
  mode: ProductViewMode
  onGrid: () => void
  onTable: () => void
}

export function ViewModeToggle({ mode, onGrid, onTable }: ViewModeToggleProps) {
  return (
    <div
      className="flex items-center bg-slate-100 dark:bg-slate-800 p-0.5 rounded-lg border border-slate-200 dark:border-slate-700"
      role="group"
      aria-label="Modo de visualización"
      {...t('catalog.toolbar.view-mode')}
    >
      <button
        type="button"
        title="Vista Cuadrícula"
        aria-pressed={mode === 'grid'}
        className={cn(BASE, mode === 'grid' ? ACTIVE : IDLE)}
        onClick={onGrid}
        {...t('catalog.toolbar.view-mode.grid')}
      >
        <i className="fa-solid fa-border-all text-xs" aria-hidden="true" />
      </button>
      <button
        type="button"
        title="Vista Tabla"
        aria-pressed={mode === 'table'}
        className={cn(BASE, mode === 'table' ? ACTIVE : IDLE)}
        onClick={onTable}
        {...t('catalog.toolbar.view-mode.table')}
      >
        <i className="fa-solid fa-list text-xs" aria-hidden="true" />
      </button>
    </div>
  )
}
