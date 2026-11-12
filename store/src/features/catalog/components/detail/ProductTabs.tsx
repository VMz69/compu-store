import { ProductOverviewTab } from './ProductOverviewTab'
import { ProductReviewsTab } from '@/21-pipeline-publicacion-resenas/00-director-publicacion-resenas'
import { ProductSpecsTab } from './ProductSpecsTab'
import { uiMeta } from '@/04-trazabilidad-ui'
import type { ProductDetailTab } from '@/02-pipeline-preferencias-interfaz/00-director-preferencias-interfaz'
import type { Product } from '@/00-director-modelos'

const SOURCE = 'src/features/catalog/components/detail/ProductTabs.tsx'

interface ProductTabsProps {
  product: Product
  availableStock: number
  reviewsCount: number
  activeTab: ProductDetailTab
  onSelectTab: (tab: ProductDetailTab) => void
}

const TABS: { id: ProductDetailTab; icon: string; label: string }[] = [
  { id: 'overview', icon: 'fa-solid fa-circle-info', label: 'Descripción General' },
  { id: 'specs', icon: 'fa-solid fa-sliders', label: 'Ficha Técnica y Componentes' },
  { id: 'reviews', icon: 'fa-solid fa-star', label: 'Opiniones de Compradores' },
]

export const ProductTabs = ({
  product,
  availableStock,
  reviewsCount,
  activeTab,
  onSelectTab,
}: ProductTabsProps) => (
  <div
    className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200/90 dark:border-slate-800 shadow-soft-card dark:shadow-none overflow-hidden"
    {...uiMeta({
      id: 'producto.tabs',
      component: 'ProductTabs',
      source: SOURCE,
    })}
  >
    <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-950/60 px-2 sm:px-8 pt-2 sm:pt-3 gap-1 sm:gap-4 overflow-x-auto hide-scrollbar">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => onSelectTab(tab.id)}
            className={`pb-3 px-3 sm:px-4 text-xs sm:text-sm font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap cursor-pointer ${
              isActive
                ? 'border-brand text-brand'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100'
            }`}
            {...uiMeta({
              id: `producto.tabs.tab.${tab.id}`,
              component: 'ProductTabs',
              source: SOURCE,
            })}
          >
            <i className={`${tab.icon} text-sm ${tab.id === 'reviews' && isActive ? 'text-amber-500' : ''}`} />
            <span>{tab.label}</span>
            {tab.id === 'specs' ? (
              <span className="text-[10px] px-2 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 font-semibold">
                Técnico
              </span>
            ) : null}
            {tab.id === 'reviews' ? (
              <span
                className={`text-[10px] px-2 rounded-full font-semibold ${
                  isActive
                    ? 'bg-amber-100 text-amber-800'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300'
                }`}
              >
                {reviewsCount}
              </span>
            ) : null}
          </button>
        )
      })}
    </div>

    <div className="p-4 sm:p-10">
      {activeTab === 'overview' ? <ProductOverviewTab product={product} /> : null}
      {activeTab === 'specs' ? (
        <ProductSpecsTab product={product} availableStock={availableStock} />
      ) : null}
      {activeTab === 'reviews' ? <ProductReviewsTab product={product} /> : null}
    </div>
  </div>
)
