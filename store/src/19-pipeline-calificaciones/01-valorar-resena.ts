import { useState } from 'react'

/**
 * Marca local de reseñas útiles durante la sesión.
 */
export const useHelpfulReview = () => {
  const [helpful, setHelpful] = useState(false)
  const markHelpful = () => setHelpful((current) => !current)
  return { helpful, markHelpful }
}
