import { ProductCardActions } from './ProductCardActions'
import { ProductCardInfo } from './ProductCardInfo'
import { ProductCardMedia } from './ProductCardMedia'
import { useProductCard } from '../../hooks/useProductCard'
import { uiMeta } from '@/ui-traceability'
import type { Product } from '@/shared/types'

const SOURCE = 'src/features/catalog/components/grid/ProductCard.tsx'

export const ProductCard = ({ product }: { product: Product }) => {
  const card = useProductCard(product)

  return (
    <div
      className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-3 sm:p-5 border border-slate-200/80 dark:border-slate-800 shadow-soft-card dark:shadow-none hover:shadow-soft-hover dark:hover:border-slate-700 transition-all flex flex-col justify-between group overflow-hidden"
      {...uiMeta({
        id: `producto.card.${product.id}`,
        component: 'ProductCard',
        source: SOURCE,
      })}
    >
      <div>
        <ProductCardMedia
          product={product}
          discount={card.discount}
          isFavorite={card.isFavorite}
          isOutOfStock={card.isOutOfStock}
          onToggleFavorite={card.toggleFavorite}
          onGoToDetail={card.goToDetail}
        />
        <ProductCardInfo product={product} />
      </div>
      <ProductCardActions
        product={product}
        availableStock={card.availableStock}
        isOutOfStock={card.isOutOfStock}
        onAddToCart={card.addToCart}
      />
    </div>
  )
}
