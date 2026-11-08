import type { SortBy } from '@/shared/types'

export const SORT_OPTIONS: { value: SortBy; label: string }[] = [
  { value: 'featured', label: 'Destacados' },
  { value: 'price-asc', label: 'Menor a mayor precio' },
  { value: 'price-desc', label: 'Mayor a menor precio' },
  { value: 'discount', label: 'Mayor descuento' },
  { value: 'name-asc', label: 'Nombre (A - Z)' },
]
