import { useState } from 'react'
import { useToastStore } from '@/03-pipeline-notificaciones/00-director-notificaciones'
import { useReviewStore } from '../reviews.store'

const RATING_LABELS: Record<number, string> = {
  1: 'Malo',
  2: 'Regular',
  3: 'Bueno',
  4: 'Muy bueno',
  5: '¡Excelente!',
}

/** Mínimo de caracteres para que la opinión sea útil a otros clientes. */
const MIN_COMMENT = 10

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

  const submit = () => {
    if (!author.trim() || !comment.trim()) {
      pushToast('Por favor ingresa tu nombre y tu comentario.', 'warning')
      return
    }
    if (comment.trim().length < MIN_COMMENT) {
      pushToast(`Cuéntanos un poco más (mínimo ${MIN_COMMENT} caracteres).`, 'warning')
      return
    }

    // TODO(API): será asíncrono (`await`) y con manejo de error de red.
    submitReview(productId, { rating, author: author.trim(), city: city.trim(), comment: comment.trim() })

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
    comment,
    setComment,
    sentForReview,
    dismissNotice: () => setSentForReview(false),
    submit,
  }
}
