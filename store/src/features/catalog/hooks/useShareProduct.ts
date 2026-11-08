import { useToastStore } from '@/shared/store/toast.store'

/** Respaldo para navegadores sin Clipboard API o en contextos no seguros (http). */
const copyWithTextarea = (text: string): boolean => {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  try {
    return document.execCommand('copy')
  } catch {
    return false
  } finally {
    document.body.removeChild(textarea)
  }
}

/**
 * Copia al portapapeles el enlace del producto actual y confirma con un toast.
 */
export const useShareProduct = () => {
  const pushToast = useToastStore((state) => state.pushToast)

  const shareProduct = async () => {
    const url = window.location.href
    const copied = await (navigator.clipboard?.writeText(url) ?? Promise.reject())
      .then(() => true)
      .catch(() => copyWithTextarea(url))
    pushToast(
      copied ? 'Enlace del producto copiado al portapapeles' : 'No se pudo copiar el enlace',
      copied ? 'success' : 'warning',
    )
  }

  return { shareProduct }
}
