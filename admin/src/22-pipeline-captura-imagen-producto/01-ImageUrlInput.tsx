import { IconButton, Input } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { ImageUrlEntry } from './02-useImageUrlEntry'

const t = tracer('ImageUrlInput', 'src/features/catalog/components/form/tabs/images/ImageUrlInput.tsx')

/** Agrega una imagen remota a la galería pegando su URL (Enter o botón). */
export function ImageUrlInput({ entry, disabled }: { entry: ImageUrlEntry; disabled: boolean }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1.5">
        <Input
          type="url"
          inputMode="url"
          placeholder={disabled ? 'Galería completa' : 'o pega una URL https://…'}
          aria-label="URL de imagen para agregar a la galería"
          invalid={Boolean(entry.error)}
          disabled={disabled}
          {...entry.inputProps}
          {...t('catalog.product-form.image.url')}
        />
        <IconButton
          icon="fa-solid fa-plus"
          label="Agregar URL"
          tone="brand"
          disabled={disabled || !entry.canSubmit}
          className="disabled:opacity-40 disabled:pointer-events-none"
          onClick={entry.submit}
          {...t('catalog.product-form.image.url-add')}
        />
      </div>
      {entry.error && <p className="text-[10px] font-medium text-red-500">{entry.error}</p>}
    </div>
  )
}
