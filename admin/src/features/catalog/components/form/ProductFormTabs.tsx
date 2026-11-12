import { cn } from '@/83-pipeline-recursos-publicos/02-cn'
import { tracer } from '@/00-trazabilidad'
import { PRODUCT_FORM_TABS, type ProductFormTab } from '../../lib/productForm'

const t = tracer('ProductFormTabs', 'src/features/catalog/components/form/ProductFormTabs.tsx')

const TAB_BASE =
  'relative flex items-center gap-2 px-3 py-3 -mb-px text-xs font-bold whitespace-nowrap border-b-2 transition-colors focus-visible:outline-2 focus-visible:outline-brand'
const TAB_ACTIVE = 'border-brand text-brand'
const TAB_IDLE =
  'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'

const STEP_ERROR = 'bg-red-500 text-white'
const STEP_ACTIVE = 'bg-brand text-white'
const STEP_IDLE = 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400'

interface ProductFormTabsProps {
  active: ProductFormTab
  errorCounts: Record<ProductFormTab, number>
  onSelect: (tab: ProductFormTab) => void
}

/** Secciones numeradas del formulario. Una sección con errores muestra "!" en rojo. */
export function ProductFormTabs({ active, errorCounts, onSelect }: ProductFormTabsProps) {
  return (
    <div
      role="tablist"
      aria-label="Secciones del producto"
      className="flex gap-1 px-4 sm:px-5 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-x-auto hide-scrollbar shrink-0"
      {...t('catalog.product-form.tabs')}
    >
      {PRODUCT_FORM_TABS.map((tab, index) => {
        const isActive = tab.id === active
        const errors = errorCounts[tab.id]
        return (
          <button
            key={tab.id}
            id={`product-form-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls="product-form-panel"
            className={cn(TAB_BASE, isActive ? TAB_ACTIVE : TAB_IDLE)}
            onClick={() => onSelect(tab.id)}
            {...t(`catalog.product-form.tab.${tab.id}`)}
          >
            <span
              className={cn(
                'w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center transition-colors',
                errors > 0 ? STEP_ERROR : isActive ? STEP_ACTIVE : STEP_IDLE,
              )}
              aria-hidden="true"
            >
              {errors > 0 ? '!' : index + 1}
            </span>
            {tab.label}
            {errors > 0 && <span className="sr-only">({errors} campos con error)</span>}
          </button>
        )
      })}
    </div>
  )
}
