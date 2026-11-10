import { useState, type ChangeEvent, type KeyboardEvent } from 'react'
import { isValidImageUrl } from '../../lib/productImages'

/**
 * Campo "pegar URL" de la galería. Valida formato http(s) antes de delegar en
 * `onAdd`, que devuelve `true` si la imagen entró a la galería.
 * Enter agrega la URL sin enviar el formulario del producto.
 */
export function useImageUrlEntry(onAdd: (url: string) => boolean) {
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)

  const submit = () => {
    const url = value.trim()
    if (!url) return
    if (!isValidImageUrl(url)) {
      setError('Ingresa una URL válida que empiece con https://')
      return
    }
    if (onAdd(url)) setValue('')
  }

  return {
    error,
    canSubmit: value.trim() !== '',
    submit,
    inputProps: {
      value,
      onChange: (e: ChangeEvent<HTMLInputElement>) => {
        setValue(e.target.value)
        setError(null)
      },
      onKeyDown: (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key !== 'Enter') return
        e.preventDefault()
        submit()
      },
    },
  }
}

export type ImageUrlEntry = ReturnType<typeof useImageUrlEntry>
