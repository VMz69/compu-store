import { uiMeta } from '@/04-trazabilidad-ui'
import type { Product } from '@/00-director-modelos'

const SOURCE = 'src/features/catalog/components/grid/ProductCardMedia.tsx'

interface ProductCardMediaProps {
  product: Product
  discount: number
  isFavorite: boolean
  isOutOfStock: boolean
  onToggleFavorite: () => void
  onGoToDetail: () => void
}

export const ProductCardMedia = ({
  product,
  discount,
  isFavorite,
  isOutOfStock,
  onToggleFavorite,
  onGoToDetail,
}: ProductCardMediaProps) => {
  const traceId = `producto.card.${product.id}`

  return (
    <div
      className="relative w-full h-36 sm:h-48 rounded-xl sm:rounded-2xl bg-slate-50 dark:bg-slate-800/60 p-3 sm:p-4 flex items-center justify-center overflow-hidden border border-slate-100 dark:border-slate-800"
      {...uiMeta({
        id: `${traceId}.media`,
        component: 'ProductCardMedia',
        source: SOURCE,
      })}
    >
      {discount > 0 ? (
        <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-amber-400 text-amber-950 text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs z-10">
          -{discount}%
        </span>
      ) : product.badge ? (
        <span className="absolute top-2 left-2 sm:top-3 sm:left-3 bg-brand text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs z-10">
          {product.badge}
        </span>
      ) : null}

      <button
        type="button"
        onClick={onToggleFavorite}
        title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        className={`absolute top-2 right-2 sm:top-3 sm:right-3 z-10 w-8 h-8 rounded-full bg-white/90 dark:bg-slate-800 text-slate-400 hover:text-red-500 shadow-sm flex items-center justify-center transition-all cursor-pointer ${
          isFavorite ? 'text-red-500' : ''
        }`}
        {...uiMeta({
          id: `${traceId}.favorito`,
          component: 'ProductCardMedia',
          source: SOURCE,
        })}
      >
        <i className={`${isFavorite ? 'fa-solid' : 'fa-regular'} fa-heart text-sm`} />
      </button>

      <button
        type="button"
        onClick={onGoToDetail}
        disabled={isOutOfStock}
        className="max-h-full max-w-full cursor-pointer disabled:cursor-not-allowed"
        {...uiMeta({
          id: `${traceId}.imagen`,
          component: 'ProductCardMedia',
          source: SOURCE,
        })}
      >
        <img
          src={product.imageUrl}
          alt={product.name}
          className="max-h-32 sm:max-h-40 max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
        />
      </button>
    </div>
  )
}
