import { useState } from 'react'

/** Estado de apertura del visor de imágenes: `null` = cerrado, número = índice inicial. */
export function useImageViewer() {
  const [viewerIndex, setViewerIndex] = useState<number | null>(null)
  return {
    viewerIndex,
    isOpen: viewerIndex !== null,
    openViewer: (index = 0) => setViewerIndex(index),
    closeViewer: () => setViewerIndex(null),
  }
}

export type ImageViewerState = ReturnType<typeof useImageViewer>
