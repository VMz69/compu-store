import { ProductBuyBoxHeader } from '@/components/product/ProductBuyBoxHeader'
import { ProductBuyBoxSpecs } from '@/components/product/ProductBuyBoxSpecs'
import { QuantitySelector } from '@/components/ui/QuantitySelector'
import { formatCurrency } from '@/services/formatters'
import { uiMeta } from '@/ui-traceability'
import type { Product } from '@/types'

const SOURCE = 'src/components/product/ProductBuyBox.tsx'

interface ProductBuyBoxProps {
  product: Product
  availableStock: number
  quantity: number
  reviewsCount: number
  whatsappUrl: string
  onIncrement: () => void
  onDecrement: () => void
  onAddToCart: () => void
  onShowReviews: () => void
}

export const ProductBuyBox = ({
  product,
  availableStock,
  quantity,
  reviewsCount,
  whatsappUrl,
  onIncrement,
  onDecrement,
  onAddToCart,
  onShowReviews,
}: ProductBuyBoxProps) => {
  const isOutOfStock = product.stock <= 0
  const traceId = `producto.detalle.${product.id}`

  return (
    <div
      className="lg:col-span-7 space-y-5"
      {...uiMeta({ id: `${traceId}.buybox`, component: 'ProductBuyBox', source: SOURCE })}
    >
      <ProductBuyBoxHeader
        product={product}
        reviewsCount={reviewsCount}
        onShowReviews={onShowReviews}
      />

      <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex flex-wrap items-baseline gap-4">
        <span className="text-3xl sm:text-4xl font-black text-brand-dark dark:text-sky-400">
          {formatCurrency(product.price)}
        </span>
        {product.originalPrice ? (
          <>
            <span className="text-sm text-slate-400 line-through font-bold">
              {formatCurrency(product.originalPrice)}
            </span>
            <span className="text-xs font-black text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
              Ahorras {formatCurrency(product.originalPrice - product.price)}
            </span>
          </>
        ) : null}
      </div>

      <ProductBuyBoxSpecs product={product} availableStock={availableStock} />

      {!isOutOfStock ? (
        <div className="space-y-3 pt-1">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="flex w-full items-center justify-between gap-3 sm:w-auto">
              <span className="pl-1 text-[11px] font-bold uppercase tracking-wider text-slate-400 sm:hidden">
                Cantidad
              </span>
              <QuantitySelector
                value={quantity}
                max={Math.max(1, availableStock)}
                onIncrement={onIncrement}
                onDecrement={onDecrement}
                traceId={`${traceId}.cantidad`}
              />
            </div>
            <button
              type="button"
              onClick={onAddToCart}
              disabled={availableStock <= 0}
              className="w-full sm:w-auto sm:flex-1 shrink-0 bg-brand hover:bg-brand-hover text-white font-bold h-12 rounded-xl flex items-center justify-center gap-2 text-sm shadow-md transition-all active:scale-95 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              {...uiMeta({
                id: `${traceId}.agregar`,
                component: 'ProductBuyBox',
                source: SOURCE,
              })}
            >
              <i className="fa-solid fa-cart-plus text-base" />
              <span>Agregar al Carrito</span>
            </button>
          </div>

          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full bg-whatsapp hover:bg-whatsapp-hover text-white font-bold h-12 rounded-xl flex items-center justify-center gap-2 text-xs sm:text-sm shadow-md transition-all active:scale-95"
            {...uiMeta({
              id: `${traceId}.whatsapp`,
              component: 'ProductBuyBox',
              source: SOURCE,
            })}
          >
            <i className="fa-brands fa-whatsapp text-lg" />
            <span>Comprar Ahora por WhatsApp</span>
          </a>
        </div>
      ) : null}
    </div>
  )
}
