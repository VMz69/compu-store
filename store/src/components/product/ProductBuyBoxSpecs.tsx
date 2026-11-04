import type { Product } from '@/types'

interface ProductBuyBoxSpecsProps {
  product: Product
  availableStock: number
}

export const ProductBuyBoxSpecs = ({ product, availableStock }: ProductBuyBoxSpecsProps) => {
  const isOutOfStock = product.stock <= 0

  return (
    <>
      <div className="space-y-1.5">
        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
          Aspectos Clave:
        </span>
        <div className="flex flex-wrap gap-1.5">
          {product.specs.slice(0, 3).map((spec) => (
            <span
              key={spec}
              className="text-xs bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium px-2.5 py-1 rounded-lg border border-slate-200/60 dark:border-slate-700 flex items-center gap-1.5"
            >
              <i className="fa-solid fa-check text-emerald-500 text-[10px]" />
              {spec}
            </span>
          ))}
        </div>
      </div>

      {isOutOfStock ? (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 font-bold flex items-center gap-2 text-xs">
          <i className="fa-solid fa-ban text-sm" />
          <span>Producto agotado temporalmente en sala de ventas.</span>
        </div>
      ) : (
        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 font-bold flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="flex items-center gap-2">
            <i className="fa-solid fa-circle-check text-emerald-600 text-sm" />
            <span>Disponible en sala de ventas: {availableStock} unidad(es)</span>
          </span>
          <span className="text-[11px] font-normal">Entrega inmediata en Cojutepeque</span>
        </div>
      )}
    </>
  )
}
