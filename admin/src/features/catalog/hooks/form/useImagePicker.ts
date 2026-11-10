import { useState, type ChangeEvent, type DragEvent } from 'react'
import { toast } from '@/shared/store/toast.store'
import { ACCEPTED_IMAGE_TYPES, formatMegabytes, MAX_IMAGE_BYTES } from '../../lib/productImages'

const readAsDataUrl = (file: File): Promise<string | null> =>
  new Promise((resolve) => {
    const reader = new FileReader()
    reader.onload = () => resolve(typeof reader.result === 'string' ? reader.result : null)
    reader.onerror = () => resolve(null)
    reader.readAsDataURL(file)
  })

/**
 * Selección de VARIAS imágenes por clic o arrastrar-y-soltar.
 * Valida tipo y peso por archivo; las reglas de la galería (máximo, duplicados,
 * presupuesto) las aplica quien recibe `onPick`.
 */
export function useImagePicker(onPick: (dataUrls: string[]) => void, disabled = false) {
  const [isDragging, setIsDragging] = useState(false)

  const readFiles = async (list: FileList | null) => {
    const files = Array.from(list ?? [])
    if (!files.length || disabled) return
    const valid = files.filter((f) => ACCEPTED_IMAGE_TYPES.includes(f.type) && f.size <= MAX_IMAGE_BYTES)
    const invalidType = files.filter((f) => !ACCEPTED_IMAGE_TYPES.includes(f.type)).length
    const tooHeavy = files.length - valid.length - invalidType
    if (invalidType) toast(`${invalidType} archivo(s) ignorado(s): solo JPG, PNG o WebP.`, 'warning')
    if (tooHeavy) toast(`${tooHeavy} imagen(es) superan ${formatMegabytes(MAX_IMAGE_BYTES)}. Usa una más liviana o pega una URL.`, 'warning')

    const dataUrls = (await Promise.all(valid.map(readAsDataUrl))).filter((src): src is string => Boolean(src))
    if (dataUrls.length) onPick(dataUrls)
  }

  return {
    isDragging,
    disabled,
    inputProps: {
      type: 'file' as const,
      multiple: true,
      disabled,
      accept: ACCEPTED_IMAGE_TYPES.join(', '),
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        void readFiles(e.target.files)
        e.target.value = '' // permite volver a elegir los mismos archivos
      },
    },
    dropProps: {
      onDragOver: (e: DragEvent) => {
        e.preventDefault()
        if (!disabled) setIsDragging(true)
      },
      onDragLeave: () => setIsDragging(false),
      onDrop: (e: DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        void readFiles(e.dataTransfer.files)
      },
    },
  }
}

export type ImagePicker = ReturnType<typeof useImagePicker>
