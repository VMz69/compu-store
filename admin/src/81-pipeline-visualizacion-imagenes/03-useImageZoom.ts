import { useEffect, useState, type PointerEvent } from 'react'

export const MIN_ZOOM = 1
export const MAX_ZOOM = 5
const STEP = 0.5
const DOUBLE_CLICK_ZOOM = 2.5

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

interface ZoomState {
  scale: number
  x: number
  y: number
}

const IDENTITY: ZoomState = { scale: 1, x: 0, y: 0 }

/** Limita el desplazamiento al área sobrante que genera la escala. */
function bound(next: ZoomState, stage: HTMLElement | null): ZoomState {
  const rect = stage?.getBoundingClientRect()
  if (!rect || next.scale <= 1) return { ...IDENTITY, scale: Math.max(1, next.scale) }
  const maxX = ((next.scale - 1) * rect.width) / 2
  const maxY = ((next.scale - 1) * rect.height) / 2
  return { scale: next.scale, x: clamp(next.x, -maxX, maxX), y: clamp(next.y, -maxY, maxY) }
}

/**
 * Zoom y arrastre de una imagen dentro de un "escenario".
 * - Rueda del ratón / botones / doble clic para acercar.
 * - Arrastre con puntero (ratón o táctil) cuando hay zoom.
 * El desplazamiento se limita para que la imagen nunca salga del escenario.
 */
export function useImageZoom() {
  // Callback ref con estado: el listener de rueda se re-engancha si cambia el nodo.
  const [stage, setStage] = useState<HTMLDivElement | null>(null)
  const [zoom, setZoom] = useState<ZoomState>(IDENTITY)
  /** Punto de anclaje del arrastre; `null` = sin arrastrar. */
  const [dragOrigin, setDragOrigin] = useState<{ x: number; y: number } | null>(null)

  const zoomTo = (scale: number) =>
    setZoom((z) => {
      const next = clamp(scale, MIN_ZOOM, MAX_ZOOM)
      const ratio = z.scale > 1 ? (next - 1) / (z.scale - 1) : 0
      return bound({ scale: next, x: z.x * ratio, y: z.y * ratio }, stage)
    })

  // Listener nativo no pasivo: React registra `wheel` como pasivo y no permite preventDefault.
  useEffect(() => {
    if (!stage) return
    const onWheel = (e: WheelEvent) => {
      e.preventDefault()
      const factor = e.deltaY < 0 ? 1.15 : 1 / 1.15
      setZoom((z) => bound({ ...z, scale: clamp(z.scale * factor, MIN_ZOOM, MAX_ZOOM) }, stage))
    }
    stage.addEventListener('wheel', onWheel, { passive: false })
    return () => stage.removeEventListener('wheel', onWheel)
  }, [stage])

  return {
    attachStage: setStage,
    scale: zoom.scale,
    isZoomed: zoom.scale > 1,
    canZoomIn: zoom.scale < MAX_ZOOM,
    canZoomOut: zoom.scale > MIN_ZOOM,
    imageStyle: {
      transform: `translate(${zoom.x}px, ${zoom.y}px) scale(${zoom.scale})`,
      transition: dragOrigin ? 'none' : 'transform 150ms ease-out',
    },
    zoomIn: () => zoomTo(zoom.scale + STEP),
    zoomOut: () => zoomTo(zoom.scale - STEP),
    reset: () => setZoom(IDENTITY),
    isDragging: dragOrigin !== null,
    stageProps: {
      onDoubleClick: () => zoomTo(zoom.scale > 1 ? 1 : DOUBLE_CLICK_ZOOM),
      onPointerDown: (e: PointerEvent<HTMLDivElement>) => {
        if (zoom.scale <= 1) return
        e.currentTarget.setPointerCapture(e.pointerId)
        setDragOrigin({ x: e.clientX - zoom.x, y: e.clientY - zoom.y })
      },
      onPointerMove: (e: PointerEvent<HTMLDivElement>) => {
        if (!dragOrigin) return
        const next = { scale: zoom.scale, x: e.clientX - dragOrigin.x, y: e.clientY - dragOrigin.y }
        setZoom(bound(next, e.currentTarget))
      },
      onPointerUp: () => setDragOrigin(null),
      onPointerCancel: () => setDragOrigin(null),
    },
  }
}

export type ImageZoom = ReturnType<typeof useImageZoom>
