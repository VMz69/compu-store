import type { Product } from '../25-pipeline-persistencia-catalogo/04-types'

const SECTION_TITLE = 'text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5'
const PANEL =
  'text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-white dark:bg-slate-900/60 p-3 rounded-xl border border-slate-100 dark:border-slate-800'

/** Descripción comercial, compatibilidad/conectividad y ficha técnica clave/valor. */
export function DetailSpecs({ product }: { product: Product }) {
  return (
    <>
      <div>
        <h4 className={SECTION_TITLE}>Descripción Comercial</h4>
        <p className={PANEL}>{product.description || 'Sin descripción detallada registrada para este artículo.'}</p>
      </div>

      {(product.compatibility || product.connectivity) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {product.compatibility && (
            <div>
              <h4 className={SECTION_TITLE}>Compatibilidad</h4>
              <p className={PANEL}>{product.compatibility}</p>
            </div>
          )}
          {product.connectivity && (
            <div>
              <h4 className={SECTION_TITLE}>Conectividad / Puertos</h4>
              <p className={PANEL}>{product.connectivity}</p>
            </div>
          )}
        </div>
      )}

      {product.specs.length > 0 && (
        <div>
          <h4 className={SECTION_TITLE}>Ficha Técnica</h4>
          <dl className="rounded-xl border border-slate-100 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 overflow-hidden">
            {product.specs.map((spec) => (
              <div
                key={`${spec.key}-${spec.value}`}
                className="grid grid-cols-[minmax(110px,35%)_1fr] gap-3 px-3 py-2 text-[11px] even:bg-slate-50/70 dark:even:bg-slate-800/30"
              >
                <dt className="font-bold text-slate-500 dark:text-slate-400">{spec.key}</dt>
                <dd className="font-medium text-slate-800 dark:text-slate-100">{spec.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}
    </>
  )
}
