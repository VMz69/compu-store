import { ProductTrustChips } from './01-garantias-producto'
import { QuantitySelector } from '@/05-pipeline-controles-compra/00-director-controles-compra'
import { formatCurrency } from '@/01-pipeline-identidad-tienda/00-director-identidad-tienda'
import { STORE_CONFIG } from '@/01-pipeline-identidad-tienda/00-director-identidad-tienda'
import { uiMeta } from '@/04-trazabilidad-ui'
import type { Product } from '@/00-director-modelos'

const SOURCE = 'src/features/catalog/components/detail/ProductBuyBox.tsx'

interface ProductBuyBoxProps {
  product: Product
  /** Porcentaje de descuento entero (0 = sin oferta). */
  discount: number
  availableStock: number
  quantity: number
  whatsappUrl: string
  onIncrement: () => void
  onDecrement: () => void
  onAddToCart: () => void
}

export const ProductBuyBox = ({
  product,
  discount,
  availableStock,
  quantity,
  whatsappUrl,
  onIncrement,
  onDecrement,
  onAddToCart,
}: ProductBuyBoxProps) => {
  const isOutOfStock = product.stock <= 0
  const traceId = `producto.detalle.${product.id}`

  return (
    <aside
      className="lg:col-span-4 xl:col-span-3 lg:sticky lg:top-36 xl:static xl:flex xl:flex-col bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/90 dark:border-slate-800 shadow-soft-card dark:shadow-none space-y-4 sm:space-y-5"
      aria-label="Opciones de compra"
      {...uiMeta({ id: `${traceId}.buybox`, component: 'ProductBuyBox', source: SOURCE })}
    >
      {/* Único precio en desktop: monto → % de descuento → precio anterior y ahorro. */}
      <div className="hidden lg:block space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-3xl xl:text-4xl font-black tracking-tight text-brand-dark dark:text-sky-400">
            {formatCurrency(product.price)}
          </span>
          {discount > 0 ? (
            <span className="text-xs font-black text-amber-950 bg-amber-400 px-2 py-0.5 rounded-md">
              -{discount}%
            </span>
          ) : null}
        </div>
        {product.originalPrice ? (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500 dark:text-slate-400">
            <span>
              Antes <span className="line-through font-semibold">{formatCurrency(product.originalPrice)}</span>
            </span>
            <span className="inline-flex items-center gap-1 font-bold text-emerald-700 dark:text-emerald-400">
              <i className="fa-solid fa-tag text-[10px]" />
              Ahorras {formatCurrency(product.originalPrice - product.price)}
            </span>
          </p>
        ) : null}
      </div>

      {isOutOfStock ? (
        <div className="p-3 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-300 font-bold flex items-center gap-2 text-xs">
          <i className="fa-solid fa-ban text-sm" />
          <span>Producto agotado temporalmente en sala de ventas.</span>
        </div>
      ) : (
        <div className="space-y-1.5">
          <span className="inline-flex items-center gap-1.5 text-[11px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/70 dark:border-emerald-900/60 px-2.5 py-1 rounded-full">
            <i className="fa-solid fa-circle-check" />
            {availableStock} disponible(s) en sala
          </span>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <i className="fa-solid fa-bolt-lightning text-amber-500 mr-1.5" />
            Entrega inmediata en Cojutepeque
          </p>
        </div>
      )}

      {!isOutOfStock ? (
        <div className="lg:space-y-3">
          <div className="flex items-center justify-between gap-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Cantidad</span>
            <QuantitySelector
              value={quantity}
              max={Math.max(1, availableStock)}
              onIncrement={onIncrement}
              onDecrement={onDecrement}
              traceId={`${traceId}.cantidad`}
            />
          </div>

          {/* En < lg las acciones viven en ProductMobileBar (barra inferior fija). */}
          <div className="hidden lg:block space-y-3">
            <button
              type="button"
              onClick={onAddToCart}
              disabled={availableStock <= 0}
              className="w-full bg-brand hover:bg-brand-hover text-white font-bold h-12 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              {...uiMeta({ id: `${traceId}.agregar`, component: 'ProductBuyBox', source: SOURCE })}
            >
              <i className="fa-solid fa-cart-plus text-base" />
              <span>Agregar al Carrito</span>
            </button>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full bg-whatsapp hover:bg-whatsapp-hover text-white font-bold h-12 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all active:scale-95"
              {...uiMeta({ id: `${traceId}.whatsapp`, component: 'ProductBuyBox', source: SOURCE })}
            >
              <i className="fa-brands fa-whatsapp text-lg" />
              <span>Comprar por WhatsApp</span>
            </a>
          </div>
        </div>
      ) : null}

      <div className="xl:mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Vendido y garantizado por{' '}
          <span className="font-bold text-brand">{STORE_CONFIG.name}</span>
        </p>
        <ProductTrustChips />
      </div>
    </aside>
  )
}
