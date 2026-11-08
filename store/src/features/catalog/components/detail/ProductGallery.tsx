import { ProductTrustChips } from '@/components/product/ProductTrustChips'
import { uiMeta } from '@/ui-traceability'
import type { Product } from '@/types'

const SOURCE = 'src/components/product/ProductGallery.tsx'

interface ProductGalleryProps {
  product: Product
  discount: number
  isFavorite: boolean
  onToggleFavorite: () => void
}

export const ProductGallery = ({
  product,
  discount,
  isFavorite,
  onToggleFavorite,
}: ProductGalleryProps) => (
  <div
    className="lg:col-span-5 flex flex-col items-center"
    {...uiMeta({ id: 'producto.detalle.galeria', component: 'ProductGallery', source: SOURCE })}
  >
    <div className="w-full h-80 sm:h-96 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 p-6 flex items-center justify-center relative overflow-hidden group">
      {discount > 0 ? (
        <span className="absolute top-4 left-4 bg-amber-400 text-amber-950 text-xs font-black px-2.5 py-1 rounded-md shadow-xs">
          Ahorras {discount}%
        </span>
      ) : null}

      <button
        type="button"
        onClick={onToggleFavorite}
        title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
        aria-label={
          isFavorite
            ? `Quitar ${product.name} de favoritos`
            : `Agregar ${product.name} a favoritos`
        }
        aria-pressed={isFavorite}
        className={`absolute top-4 right-4 w-10 h-10 rounded-full bg-white dark:bg-slate-800 text-slate-400 hover:text-red-500 shadow-sm flex items-center justify-center transition-all cursor-pointer ${
          isFavorite ? 'text-red-500' : ''
        }`}
        {...uiMeta({
          id: `producto.detalle.${product.id}.favorito`,
          component: 'ProductGallery',
          source: SOURCE,
        })}
      >
        <i className={`${isFavorite ? 'fa-solid' : 'fa-regular'} fa-heart text-lg`} />
      </button>

      <img
        src={product.imageUrl}
        alt={product.name}
        className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-500"
      />
    </div>

    <ProductTrustChips />
  </div>
)
