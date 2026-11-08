import { cn } from '@/shared/lib/cn'
import { SafeImage } from '@/shared/ui'
import type { Product } from '../../types'

/** Cabecera visual de la tarjeta: imagen, categoría e insignia comercial. */
export function CardMedia({ product }: { product: Product }) {
  return (
    <div className="relative h-36 bg-slate-50 dark:bg-slate-800 overflow-hidden flex items-center justify-center">
      <span className="absolute top-2 left-2 bg-brand text-white text-[9px] font-black px-2 py-0.5 rounded-md shadow-xs z-10 uppercase tracking-wider">
        {product.category}
      </span>
      {product.badge && (
        <span className="absolute top-2 right-2 bg-amber-400 text-amber-950 text-[9px] font-bold px-2 py-0.5 rounded-md shadow-xs z-10">
          {product.badge}
        </span>
      )}
      <SafeImage
        src={product.imageUrl}
        alt={product.name}
        className={cn(
          'w-full h-full object-cover group-hover:scale-105 transition-transform duration-300',
          !product.active && 'grayscale opacity-60',
        )}
      />
    </div>
  )
}
