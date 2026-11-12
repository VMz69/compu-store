// API pública del feature `interactions`. Desde fuera solo se importa este archivo.
export { InteractionsPage } from './features/interactions/pages/InteractionsPage'
export { usePendingReviewsCount, useReviewsStore } from './features/interactions/store'
export type { ProductReview, ReviewStatus } from './features/interactions/types'
