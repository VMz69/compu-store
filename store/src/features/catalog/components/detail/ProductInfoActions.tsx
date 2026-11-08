import { uiMeta } from '@/ui-traceability'

const SOURCE = 'src/features/catalog/components/detail/ProductInfoActions.tsx'

const ACTION_BTN =
  'w-10 h-10 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 flex items-center justify-center transition-all cursor-pointer hover:border-brand-300 hover:shadow-soft-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand'

interface ProductInfoActionsProps {
  productId: number
  productName: string
  isFavorite: boolean
  onToggleFavorite: () => void
  onShare: () => void
}

export const ProductInfoActions = ({
  productId,
  productName,
  isFavorite,
  onToggleFavorite,
  onShare,
}: ProductInfoActionsProps) => (
  <div className="flex shrink-0 items-center gap-2">
    <button
      type="button"
      onClick={onShare}
      title="Copiar enlace del producto"
      aria-label={`Compartir ${productName}: copiar enlace`}
      className={`${ACTION_BTN} text-slate-500 dark:text-slate-300 hover:text-brand`}
      {...uiMeta({ id: `producto.detalle.${productId}.compartir`, component: 'ProductInfoActions', source: SOURCE })}
    >
      <i className="fa-solid fa-share-nodes text-sm" />
    </button>
    <button
      type="button"
      onClick={onToggleFavorite}
      title={isFavorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
      aria-label={
        isFavorite ? `Quitar ${productName} de favoritos` : `Agregar ${productName} a favoritos`
      }
      aria-pressed={isFavorite}
      className={`${ACTION_BTN} ${
        isFavorite
          ? 'text-red-500 border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40'
          : 'text-slate-500 dark:text-slate-300 hover:text-red-500'
      }`}
      {...uiMeta({ id: `producto.detalle.${productId}.favorito`, component: 'ProductInfoActions', source: SOURCE })}
    >
      <i className={`${isFavorite ? 'fa-solid' : 'fa-regular'} fa-heart text-base`} />
    </button>
  </div>
)
