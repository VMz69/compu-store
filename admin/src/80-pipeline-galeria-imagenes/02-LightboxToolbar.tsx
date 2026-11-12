import type { LightboxState } from '@/80-pipeline-galeria-imagenes/04-useLightbox'
import { tracer } from '@/00-trazabilidad'
import { IconButton } from '../66-pipeline-acciones-administrativas/02-IconButton'

const t = tracer('LightboxToolbar', 'src/shared/ui/lightbox/LightboxToolbar.tsx')

interface LightboxToolbarProps {
  lightbox: LightboxState
  title: string
  traceId: string
  onClose: () => void
}

/** Barra superior: título, contador, zoom, pantalla completa y cerrar. */
export function LightboxToolbar({ lightbox, title, traceId, onClose }: LightboxToolbarProps) {
  const { zoom, index, count } = lightbox
  return (
    <div className="flex items-center justify-between gap-3 px-4 py-3 text-white shrink-0" {...t(`${traceId}.toolbar`)}>
      <div className="min-w-0">
        <p className="text-sm font-bold truncate">{title}</p>
        <p className="text-[11px] text-white/60" aria-live="polite">
          Imagen {index + 1} de {count}
        </p>
      </div>

      <div className="flex items-center gap-1">
        <IconButton
          icon="fa-solid fa-magnifying-glass-minus"
          label="Alejar (−)"
          tone="overlay"
          disabled={!zoom.canZoomOut}
          onClick={zoom.zoomOut}
          {...t(`${traceId}.zoom-out`)}
        />
        <button
          type="button"
          title="Restablecer zoom (0)"
          className="min-w-14 h-8 px-2 rounded-lg text-[11px] font-bold tabular-nums text-white/80 hover:bg-white/10"
          onClick={zoom.reset}
          {...t(`${traceId}.zoom-reset`)}
        >
          {Math.round(zoom.scale * 100)}%
        </button>
        <IconButton
          icon="fa-solid fa-magnifying-glass-plus"
          label="Acercar (+)"
          tone="overlay"
          disabled={!zoom.canZoomIn}
          onClick={zoom.zoomIn}
          {...t(`${traceId}.zoom-in`)}
        />
        {lightbox.canFullscreen && (
          <IconButton
            icon={lightbox.isFullscreen ? 'fa-solid fa-compress' : 'fa-solid fa-expand'}
            label={lightbox.isFullscreen ? 'Salir de pantalla completa (F)' : 'Pantalla completa (F)'}
            tone="overlay"
            onClick={lightbox.toggleFullscreen}
            {...t(`${traceId}.fullscreen`)}
          />
        )}
        <span className="w-px h-5 bg-white/20 mx-1" aria-hidden="true" />
        <IconButton
          icon="fa-solid fa-xmark"
          label="Cerrar (Esc)"
          tone="overlay"
          iconClass="text-sm"
          autoFocus
          onClick={onClose}
          {...t(`${traceId}.close`)}
        />
      </div>
    </div>
  )
}
