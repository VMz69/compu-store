import { useMemo } from 'react'
import { usePermission } from '@/features/access'
import { openModal } from '@/shared/store/modal.store'
import { countByCategory } from '../lib/catalog.service'
import { CATALOG_MODALS } from '../modals'
import { useCatalogStore } from '../store'
import { useShowCategoryProducts } from './useShowCategoryProducts'

/** Datos de la vista Categorías: tarjetas con conteo de artículos y acciones. */
export function useCategories() {
  const categories = useCatalogStore((s) => s.categories)
  const products = useCatalogStore((s) => s.products)
  const canCreate = usePermission('canCreateProduct')
  const showProducts = useShowCategoryProducts()

  const items = useMemo(
    () => categories.map((category) => ({ category, count: countByCategory(products, category.id) })),
    [categories, products],
  )

  return {
    items,
    canCreate,
    showProducts,
    openCreate: () => openModal(CATALOG_MODALS.categoryForm),
  }
}
