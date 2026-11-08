import { useCallback, useEffect, useRef, useState } from 'react'

interface PdfLike {
  output(type: 'blob'): Blob
}

/**
 * Genera un PDF a partir de `source` y lo expone como blob URL para mostrarlo
 * en un <iframe> (visor nativo del navegador: zoom, imprimir, descargar).
 *
 * - Se regenera si cambia `source` (p. ej. al anular una factura).
 * - El blob se libera al desmontar para no acumular memoria.
 * - `build` debe ser una función estable (definida a nivel de módulo).
 * - El iframe se conecta con `attachFrame` (callback ref): exponer el objeto ref
 *   en el estado hace que React Compiler trate todo el objeto como ref.
 *
 * @example const pdf = usePdfDocument(quote, buildQuotePdf)
 */
export function usePdfDocument<T>(source: T | undefined, build: (source: T) => Promise<PdfLike>) {
  const frameRef = useRef<HTMLIFrameElement>(null)
  const attachFrame = useCallback((node: HTMLIFrameElement | null) => {
    frameRef.current = node
  }, [])
  const [state, setState] = useState<{ url: string | null; error: string | null }>({ url: null, error: null })

  useEffect(() => {
    if (!source) return
    let cancelled = false
    let url: string | null = null
    build(source)
      .then((doc) => {
        if (cancelled) return
        url = URL.createObjectURL(doc.output('blob'))
        setState({ url, error: null })
      })
      .catch((err: unknown) => {
        if (!cancelled) setState({ url: null, error: err instanceof Error ? err.message : 'No se pudo generar el PDF.' })
      })
    return () => {
      cancelled = true
      if (url) URL.revokeObjectURL(url)
    }
  }, [source, build])

  return {
    url: state.url,
    error: state.error,
    isGenerating: !state.url && !state.error,
    attachFrame,
    /** Imprime desde el visor del iframe (mismo origen: blob URL). */
    print: () => frameRef.current?.contentWindow?.print(),
    openInNewTab: () => {
      if (state.url) window.open(state.url, '_blank', 'noopener')
    },
  }
}

export type PdfDocumentState = ReturnType<typeof usePdfDocument>
