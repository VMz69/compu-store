import { useState, type ChangeEvent, type DragEvent } from 'react'
import { toast } from '@/shared/store/toast.store'

/**
 * Límite de tamaño. En modo demo la imagen se guarda como data URL en
 * localStorage (~5 MB por origen), por eso se restringe. Con API real se
 * subiría el archivo al servidor y se guardaría solo su URL.
 */
export const MAX_IMAGE_BYTES = 1.5 * 1024 * 1024

/** Selección de imagen por clic o arrastrar-y-soltar, con validación de tipo y tamaño. */
export function useImagePicker(onPick: (dataUrl: string) => void) {
  const [isDragging, setIsDragging] = useState(false)

  const readFile = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast('El archivo debe ser una imagen (JPG, PNG o WebP).', 'warning')
      return
    }
    if (file.size > MAX_IMAGE_BYTES) {
      toast('La imagen supera 1.5 MB. Usa una más liviana o pega una URL.', 'warning')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') onPick(reader.result)
    }
    reader.readAsDataURL(file)
  }

  return {
    isDragging,
    inputProps: {
      type: 'file' as const,
      accept: 'image/png, image/jpeg, image/webp',
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        readFile(e.target.files?.[0])
        e.target.value = '' // permite volver a elegir el mismo archivo
      },
    },
    dropProps: {
      onDragOver: (e: DragEvent) => {
        e.preventDefault()
        setIsDragging(true)
      },
      onDragLeave: () => setIsDragging(false),
      onDrop: (e: DragEvent) => {
        e.preventDefault()
        setIsDragging(false)
        readFile(e.dataTransfer.files[0])
      },
    },
  }
}

export type ImagePicker = ReturnType<typeof useImagePicker>
