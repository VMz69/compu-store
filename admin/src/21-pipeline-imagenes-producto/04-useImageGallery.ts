import { useEffect, useRef } from 'react'
import { useImageViewer } from '@/81-pipeline-visualizacion-imagenes/02-useImageViewer'
import { toast } from '@/76-pipeline-avisos-globales/02-toast.store'
import {
  appendImages,
  formatMegabytes,
  makeCover,
  MAX_LOCAL_GALLERY_BYTES,
  MAX_PRODUCT_IMAGES,
  moveImage,
  removeImage,
  type AppendResult,
  type ImageRow,
} from '../17-pipeline-ficha-producto/03-productImages'
import { useImagePicker } from '../22-pipeline-captura-imagen-producto/03-useImagePicker'
import { useImageUrlEntry } from '../22-pipeline-captura-imagen-producto/02-useImageUrlEntry'

type RowsUpdater = (update: (rows: ImageRow[]) => ImageRow[]) => void

/** Avisa qué imágenes no entraron y por qué. */
function notifyRejected({ duplicates, overflow, overBudget }: AppendResult) {
  if (duplicates) toast(`${duplicates} imagen(es) ya estaban en la galería.`, 'info')
  if (overflow) toast(`Máximo ${MAX_PRODUCT_IMAGES} imágenes por producto: ${overflow} no se agregaron.`, 'warning')
  if (overBudget) {
    toast(`Límite de ${formatMegabytes(MAX_LOCAL_GALLERY_BYTES)} en imágenes locales: ${overBudget} no se agregaron. Usa URLs.`, 'warning')
  }
}

/**
 * Galería del formulario de producto: alta por archivos (múltiples), por URL,
 * reordenamiento, portada, eliminación y vista ampliada.
 */
export function useImageGallery(rows: ImageRow[], update: RowsUpdater) {
  // Los archivos se leen de forma asíncrona: se valida contra la galería más
  // reciente (no la del render que inició la lectura) para no rebasar el máximo.
  const latest = useRef(rows)
  useEffect(() => {
    latest.current = rows
  }, [rows])

  const add = (sources: string[]): boolean => {
    const result = appendImages(latest.current, sources)
    notifyRejected(result)
    if (!result.added) return false
    latest.current = result.rows
    update(() => result.rows)
    return true
  }

  const isFull = rows.length >= MAX_PRODUCT_IMAGES
  const viewer = useImageViewer()

  return {
    rows,
    sources: rows.map((r) => r.src),
    count: rows.length,
    max: MAX_PRODUCT_IMAGES,
    isFull,
    picker: useImagePicker(add, isFull),
    urlEntry: useImageUrlEntry((url) => add([url])),
    viewer,
    remove: (id: string) => update((list) => removeImage(list, id)),
    move: (id: string, offset: number) => update((list) => moveImage(list, id, offset)),
    makeCover: (id: string) => {
      update((list) => makeCover(list, id))
      toast('Portada actualizada', 'success')
    },
  }
}

export type ImageGalleryApi = ReturnType<typeof useImageGallery>
