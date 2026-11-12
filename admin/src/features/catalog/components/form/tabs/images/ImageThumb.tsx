import { cn } from '@/83-pipeline-recursos-publicos/02-cn'
import { IconButton, SafeImage } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { ImageRow } from '../../../../lib/productImages'

const t = tracer('ImageThumb', 'src/features/catalog/components/form/tabs/images/ImageThumb.tsx')

interface ImageThumbProps {
  row: ImageRow
  index: number
  count: number
  alt: string
  onView: () => void
  onMove: (offset: number) => void
  onCover: () => void
  onRemove: () => void
}

const ACTION = { tone: 'overlay', sizeClass: 'w-6 h-6', iconClass: 'text-[10px]' } as const

/**
 * Miniatura de la galería con acciones accesibles por teclado.
 * En pantallas táctiles la barra de acciones siempre es visible (no hay hover).
 */
export function ImageThumb({ row, index, count, alt, onView, onMove, onCover, onRemove }: ImageThumbProps) {
  const isCover = index === 0
  const id = `catalog.product-form.gallery.item.${row.id}`

  return (
    <li
      className={cn(
        'group relative aspect-square rounded-lg overflow-hidden border-2 bg-slate-100 dark:bg-slate-800',
        isCover ? 'border-brand' : 'border-slate-200 dark:border-slate-700',
      )}
      {...t(id)}
    >
      <button
        type="button"
        onClick={onView}
        aria-label={`Ampliar imagen ${index + 1}`}
        className="w-full h-full cursor-zoom-in"
        {...t(`${id}.view`)}
      >
        <SafeImage src={row.src} alt={`${alt || 'Producto'} — imagen ${index + 1}`} className="w-full h-full object-cover" />
      </button>

      <span
        className={cn(
          'absolute top-1 left-1 px-1.5 py-0.5 rounded text-[9px] font-black pointer-events-none',
          isCover ? 'bg-brand text-white uppercase tracking-wider' : 'bg-slate-900/60 text-white tabular-nums',
        )}
      >
        {isCover ? 'Portada' : index + 1}
      </span>

      <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-0.5 p-1 bg-slate-900/70 transition-opacity opacity-100 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100">
        <IconButton {...ACTION} icon="fa-solid fa-chevron-left" label="Mover a la izquierda" disabled={index === 0} onClick={() => onMove(-1)} {...t(`${id}.move-left`)} />
        {!isCover && (
          <IconButton {...ACTION} icon="fa-solid fa-star" label="Usar como portada" onClick={onCover} {...t(`${id}.cover`)} />
        )}
        <IconButton {...ACTION} icon="fa-solid fa-chevron-right" label="Mover a la derecha" disabled={index === count - 1} onClick={() => onMove(1)} {...t(`${id}.move-right`)} />
        <IconButton {...ACTION} icon="fa-solid fa-trash" label="Quitar imagen" onClick={onRemove} {...t(`${id}.remove`)} />
      </div>
    </li>
  )
}
