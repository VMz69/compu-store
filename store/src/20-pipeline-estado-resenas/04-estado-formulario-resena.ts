import { useState } from 'react'
import { useToastStore } from '@/03-pipeline-notificaciones/00-director-notificaciones'
import { useReviewStore } from './02-resenas.store'
import { STORE_CONFIG } from '@/01-pipeline-identidad-tienda/00-director-identidad-tienda'

const RATING_LABELS: Record<number, string> = {
  1: 'Malo',
  2: 'Regular',
  3: 'Bueno',
  4: 'Muy bueno',
  5: '¡Excelente!',
}

/** Mínimo de caracteres para que la opinión sea útil a otros clientes. */
const MIN_COMMENT = 10
/** Máximos que acepta la API (L17). */
const MAX_NAME = 60
const MAX_CITY = 60
const MAX_COMMENT = 1000

/**
 * Formulario controlado de reseñas. Al enviar, la opinión queda PENDIENTE de
 * moderación en el back office: no se publica hasta que se apruebe.
 */
export const useReviewForm = (productId: number) => {
  const submitReview = useReviewStore((state) => state.submitReview)
  const pushToast = useToastStore((state) => state.pushToast)
  const [rating, setRating] = useState(5)
  const [author, setAuthor] = useState('')
  const [city, setCity] = useState('')
  const [comment, setComment] = useState('')
  /** Se acaba de enviar una opinión: se muestra el aviso "en revisión". */
  const [sentForReview, setSentForReview] = useState(false)
  /** Evita el doble envío mientras responde la API. */
  const [sending, setSending] = useState(false)

  const submit = async () => {
    if (sending) return
    if (!author.trim() || !comment.trim()) {
      pushToast('Por favor ingresa tu nombre y tu comentario.', 'warning')
      return
    }
    if (comment.trim().length < MIN_COMMENT) {
      pushToast(`Cuéntanos un poco más (mínimo ${MIN_COMMENT} caracteres).`, 'warning')
      return
    }

    if (author.trim().length > MAX_NAME || city.trim().length > MAX_CITY) {
      pushToast(`El nombre y la ciudad admiten hasta ${MAX_NAME} caracteres.`, 'warning')
      return
    }
    if (comment.trim().length > MAX_COMMENT) {
      pushToast(`Tu comentario admite hasta ${MAX_COMMENT} caracteres.`, 'warning')
      return
    }

    setSending(true)
    try {
      await submitReview(productId, { rating, author: author.trim(), city: city.trim(), comment: comment.trim() })
    } catch (error) {
      // Se conserva lo escrito para reintentar (p. ej. tras el límite de envíos).
      pushToast(error instanceof Error ? error.message : 'No se pudo enviar tu opinión. Intenta de nuevo.', 'warning')
      return
    } finally {
      setSending(false)
    }

    pushToast('¡Gracias! Tu opinión fue enviada y se publicará tras ser revisada.', 'success')
    setSentForReview(true)
    setAuthor('')
    setCity('')
    setComment('')
    setRating(5)
  }

  return {
    rating,
    setRating,
    ratingLabel: RATING_LABELS[rating],
    author,
    setAuthor,
    city,
    setCity,
    /** Ejemplo de ciudad desde la identidad de la tienda (L10). */
    cityPlaceholder: `Ej. ${STORE_CONFIG.city}`,
    comment,
    setComment,
    sentForReview,
    dismissNotice: () => setSentForReview(false),
    submit: () => void submit(),
  }
}
