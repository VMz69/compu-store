import type { Product } from '@/features/catalog'
import { cn } from '@/shared/lib/cn'
import { formatCurrency } from '@/shared/lib/currency'
import { Badge, EmptyState, SafeImage, SearchInput, Select } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { ProductPickerApi } from '../../hooks/useProductPicker'

const t = tracer('ProductPicker', 'src/features/quotes/components/builder/ProductPicker.tsx')

interface ProductPickerProps {
  picker: ProductPickerApi
  onAdd: (product: Product) => void
}

/** Catálogo para cotizar: clic en un producto lo agrega (o suma 1 si ya está). */
export function ProductPicker({ picker, onAdd }: ProductPickerProps) {
  return (
    <section className="flex flex-col min-h-0" aria-label="Catálogo de productos" {...t('quotes.builder.picker')}>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <SearchInput
          wrapperClassName="flex-1 min-w-48"
          value={picker.search}
          onChange={picker.onSearch}
          placeholder="Buscar por nombre, SKU, marca o modelo…"
          aria-label="Buscar productos"
          autoFocus
          {...t('quotes.builder.picker.search')}
        />
        <Select tone="filter" options={picker.categoryOptions} value={picker.category} onChange={picker.onCategory} aria-label="Filtrar por categoría" {...t('quotes.builder.picker.category')} />
      </div>

      {picker.items.length === 0 ? (
        <EmptyState icon="fa-solid fa-magnifying-glass" title="Sin resultados" hint="Prueba con otro término o categoría." className="py-10" />
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-2.5">
          {picker.items.map(({ product: p, inQuote }) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onAdd(p)}
                aria-label={`Agregar ${p.name} a la cotización`}
                className={cn(
                  'w-full h-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all group',
                  inQuote > 0
                    ? 'border-brand/50 bg-brand-50/60 dark:bg-brand-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand/40 hover:shadow-soft-card',
                )}
                {...t(`quotes.builder.picker.add.${p.id}`)}
              >
                <SafeImage src={p.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight">{p.name}</p>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">{p.sku}</p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="text-xs font-black text-brand">{formatCurrency(p.price)}</span>
                    {p.stock === 0 && <Badge tone="warning">Bajo pedido</Badge>}
                    {!p.active && <Badge tone="neutral">Oculto web</Badge>}
                  </div>
                </div>
                <span
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 transition-colors',
                    inQuote > 0 ? 'bg-brand text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-hover:bg-brand group-hover:text-white',
                  )}
                  aria-hidden="true"
                >
                  {inQuote > 0 ? inQuote : <i className="fa-solid fa-plus" />}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
