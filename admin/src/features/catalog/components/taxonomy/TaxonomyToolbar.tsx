import { cn } from '@/shared/lib/cn'
import { Button, SearchInput } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { TaxonomyPageApi, TaxonomyTab } from '../../hooks/taxonomy/useTaxonomyPage'

const t = tracer('TaxonomyToolbar', 'src/features/catalog/components/taxonomy/TaxonomyToolbar.tsx')

const TABS: { id: TaxonomyTab; label: string; icon: string }[] = [
  { id: 'categorias', label: 'Categorías', icon: 'fa-solid fa-layer-group' },
  { id: 'marcas', label: 'Marcas', icon: 'fa-solid fa-copyright' },
]

const TAB = 'px-3 py-1.5 rounded-lg text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5'

/** Pestañas (con conteo) + búsqueda de la pestaña activa + alta contextual. */
export function TaxonomyToolbar({ page }: { page: TaxonomyPageApi }) {
  return (
    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3" {...t('catalog.taxonomy.toolbar')}>
      <div className="flex items-center gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 self-start" role="tablist" aria-label="Taxonomía del catálogo">
        {TABS.map((tab) => {
          const active = page.tab === tab.id
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              aria-controls={`taxonomy-panel-${tab.id}`}
              onClick={() => page.selectTab(tab.id)}
              className={cn(TAB, active ? 'bg-white dark:bg-slate-900 text-brand shadow-xs' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200')}
              {...t(`catalog.taxonomy.tab.${tab.id}`)}
            >
              <i className={tab.icon} aria-hidden="true" />
              {tab.label}
              <span className={cn('text-[10px] px-1.5 rounded-md tabular-nums', active ? 'bg-brand/10' : 'bg-slate-200/70 dark:bg-slate-700')}>{page.counts[tab.id]}</span>
            </button>
          )
        })}
      </div>

      <div className="flex items-center gap-2">
        <SearchInput
          wrapperClassName="w-full lg:w-72"
          placeholder={page.tab === 'marcas' ? 'Buscar marca o sitio web…' : 'Buscar categoría…'}
          aria-label={page.tab === 'marcas' ? 'Buscar marcas' : 'Buscar categorías'}
          value={page.search}
          onChange={page.onSearch}
          {...t('catalog.taxonomy.search')}
        />
        {page.canCreate && (
          <Button
            icon={page.tab === 'marcas' ? 'fa-solid fa-plus' : 'fa-solid fa-folder-plus'}
            className="whitespace-nowrap"
            onClick={page.create}
            {...t(`catalog.taxonomy.create.${page.tab}`)}
          >
            {page.createLabel}
          </Button>
        )}
      </div>
    </div>
  )
}
