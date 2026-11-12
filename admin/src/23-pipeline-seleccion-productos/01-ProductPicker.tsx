import { cn } from '@/83-pipeline-recursos-publicos/02-cn'
import { formatCurrency } from '@/82-pipeline-calculo-importes/02-currency'
import { Badge, EmptyState, LiveSearch, SafeImage, Select } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { ProductPickerApi } from './02-useProductPicker'
import type { Product } from '../25-pipeline-persistencia-catalogo/04-types'

const t = tracer('ProductPicker', 'src/23-pipeline-seleccion-productos/01-ProductPicker.tsx')

interface ProductPickerProps {
  picker: ProductPickerApi
  onAdd: (product: Product) => void
  /** Prefijo de trazabilidad (ej. "quotes.builder.picker"). */
  traceId: string
  /** Documento destino para el texto accesible (ej. "la cotización"). */
  target: string
}

/** Catálogo seleccionable: clic agrega el producto (o suma 1 si ya está). */
export function ProductPicker({ picker, onAdd, traceId, target }: ProductPickerProps) {
  return (
    <section className="flex flex-col min-h-0" aria-label="Catálogo de productos" {...t(traceId)}>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <LiveSearch
          wrapperClassName="flex-1 min-w-48"
          value={picker.search}
          onChange={picker.onSearch}
          onClear={picker.clearSearch}
          resultCount={picker.items.length}
          placeholder="Buscar por nombre, SKU, marca o modelo…"
          aria-label="Buscar productos"
          autoFocus
          {...t(`${traceId}.search`)}
        />
        <Select tone="filter" options={picker.categoryOptions} value={picker.category} onChange={picker.onCategory} aria-label="Filtrar por categoría" {...t(`${traceId}.category`)} />
      </div>

      {picker.items.length === 0 ? (
        <EmptyState icon="fa-solid fa-magnifying-glass" title="Sin resultados" hint="Prueba con otro término o categoría." className="py-10" />
      ) : (
        <ul className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-2.5">
          {picker.items.map(({ product: p, selected, available, blockedReason, price, offerTitle }) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => onAdd(p)}
                disabled={Boolean(blockedReason)}
                title={blockedReason ?? undefined}
                aria-label={`Agregar ${p.name} a ${target}`}
                className={cn(
                  'w-full h-full flex items-center gap-3 p-2.5 rounded-xl border text-left transition-all group disabled:cursor-not-allowed',
                  selected > 0
                    ? 'border-brand/50 bg-brand-50/60 dark:bg-brand-950/30'
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-brand/40 hover:shadow-soft-card',
                  blockedReason && selected === 0 && 'opacity-55 hover:border-slate-200 hover:shadow-none',
                )}
                {...t(`${traceId}.add.${p.id}`)}
              >
                <SafeImage src={p.imageUrl} alt="" className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-200 dark:border-slate-700" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight">{p.name}</p>
                  <p className="text-[10px] font-mono text-slate-400 mt-0.5">{p.sku}</p>
                  <div className="flex flex-wrap items-center gap-1.5 mt-1">
                    <span className="text-xs font-black text-brand">{formatCurrency(price)}</span>
                    {offerTitle && (
                      <>
                        <s className="text-[10px] text-slate-400">{formatCurrency(p.price)}</s>
                        <Badge tone="highlight" title={offerTitle}>Oferta</Badge>
                      </>
                    )}
                    {picker.limitToStock ? (
                      <Badge tone={available === 0 ? 'danger' : available <= p.reorderPoint ? 'warning' : 'success'}>
                        {available === 0 ? blockedReason : `${available} disp.`}
                      </Badge>
                    ) : (
                      p.stock === 0 && <Badge tone="warning">Bajo pedido</Badge>
                    )}
                    {!p.active && <Badge tone="neutral">Oculto web</Badge>}
                  </div>
                </div>
                <span
                  className={cn(
                    'w-7 h-7 rounded-lg flex items-center justify-center text-[11px] font-black shrink-0 transition-colors',
                    selected > 0 ? 'bg-brand text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500 group-enabled:group-hover:bg-brand group-enabled:group-hover:text-white',
                  )}
                  aria-hidden="true"
                >
                  {selected > 0 ? selected : <i className={blockedReason ? 'fa-solid fa-ban' : 'fa-solid fa-plus'} />}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
