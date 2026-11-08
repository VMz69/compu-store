import { uiMeta } from '@/ui-traceability'

const SOURCE = 'src/features/catalog/components/detail/ProductGalleryThumbs.tsx'

const THUMB_BASE =
  'relative shrink-0 w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800/60 p-1.5 flex items-center justify-center transition-all cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900'
const THUMB_ACTIVE = 'border-2 border-brand shadow-brand-glow'
const THUMB_IDLE =
  'border border-slate-200 dark:border-slate-700 opacity-70 hover:opacity-100 hover:border-brand-300'

interface ProductGalleryThumbsProps {
  images: string[]
  activeIndex: number
  productName: string
  traceId: string
  onSelect: (index: number) => void
  /** `rail`: columna vertical (desktop) que pasa a fila en móvil. `strip`: siempre fila. */
  variant?: 'rail' | 'strip'
}

export const ProductGalleryThumbs = ({
  images,
  activeIndex,
  productName,
  traceId,
  onSelect,
  variant = 'rail',
}: ProductGalleryThumbsProps) => (
  <div
    className={`flex gap-2.5 overflow-auto hide-scrollbar p-0.5 ${
      variant === 'rail' ? 'flex-row sm:flex-col sm:max-h-[28rem]' : 'flex-row justify-center'
    }`}
    role="group"
    aria-label={`Fotos de ${productName}`}
    {...uiMeta({ id: traceId, component: 'ProductGalleryThumbs', source: SOURCE })}
  >
    {images.map((image, index) => {
      const isActive = index === activeIndex
      return (
        <button
          key={image}
          type="button"
          onClick={() => onSelect(index)}
          onMouseEnter={variant === 'rail' ? () => onSelect(index) : undefined}
          aria-label={`Ver foto ${index + 1} de ${images.length}`}
          aria-current={isActive}
          className={`${THUMB_BASE} ${isActive ? THUMB_ACTIVE : THUMB_IDLE}`}
          {...uiMeta({
            id: `${traceId}.item.${index}`,
            component: 'ProductGalleryThumbs',
            source: SOURCE,
          })}
        >
          <img
            src={image}
            alt=""
            loading="lazy"
            className="max-h-full max-w-full object-contain rounded-lg"
          />
        </button>
      )
    })}
  </div>
)
