import { useState } from 'react'
import { useToastStore } from '@/store/useToastStore'
import { useReviewStore } from '@/store/useReviewStore'

const RATING_LABELS: Record<number, string> = {
  1: 'Malo',
  2: 'Regular',
  3: 'Bueno',
  4: 'Muy bueno',
  5: '¡Excelente!',
}

/**
 * Formulario controlado de reseñas con validación mínima y publicación en el store.
 */
export const useReviewForm = (productId: number) => {
  const addReview = useReviewStore((state) => state.addReview)
  const pushToast = useToastStore((state) => state.pushToast)
  const [rating, setRating] = useState(5)
  const [author, setAuthor] = useState('')
  const [city, setCity] = useState('')
  const [comment, setComment] = useState('')

  const submit = () => {
    if (!author.trim() || !comment.trim()) {
      pushToast('Por favor ingresa tu nombre y tu comentario.', 'warning')
      return
    }

    addReview(productId, {
      id: Date.now(),
      author: author.trim(),
      city: city.trim() || 'El Salvador',
      rating,
      date: 'Hace un momento',
      title: 'Opinión verificada',
      comment: comment.trim(),
      verified: true,
    })

    pushToast('¡Muchas gracias! Tu opinión ha sido publicada exitosamente.', 'success')
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
    submit,
  }
}
