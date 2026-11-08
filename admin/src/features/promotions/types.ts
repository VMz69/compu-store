export interface Promotion {
  id: string
  title: string
  badge: string
  discountText: string
  /** Id de la categoría destino (ej. "audio"). */
  targetCategory: string
  active: boolean
  description: string
}

export type PromotionDraft = Omit<Promotion, 'id' | 'active'>
