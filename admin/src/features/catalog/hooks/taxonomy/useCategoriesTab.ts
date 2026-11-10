import { useMemo } from 'react'
import { ensurePermission, usePermission } from '@/features/access'
import { askConfirm } from '@/shared/store/confirm.store'
import { openModal } from '@/shared/store/modal.store'
import { toast } from '@/shared/store/toast.store'
import { categoryDeleteBlock, matchesText, productsInCategory } from '../../lib/taxonomy'
import { CATALOG_MODALS } from '../../modals'
import { useCatalogStore } from '../../store'
import type { Category } from '../../types'
import { useShowCategoryProducts } from '../useShowCategoryProducts'

/** Pestaña Categorías: tarjetas con uso (productos) y acciones con reglas de negocio. */
export function useCategoriesTab(search: string) {
  const categories = useCatalogStore((s) => s.categories)
  const products = useCatalogStore((s) => s.products)
  const deleteCategory = useCatalogStore((s) => s.deleteCategory)
  const canEdit = usePermission('canManageTaxonomy')
  const canDelete = usePermission('canManageTaxonomy')
  const showProducts = useShowCategoryProducts()

  const items = useMemo(
    () =>
      categories
        .filter((c) => matchesText([c.name, c.slug, c.description], search))
        .map((category) => {
          const inCategory = productsInCategory(products, category.id)
          return {
            category,
            productCount: inCategory.length,
            visibleCount: inCategory.filter((p) => p.active).length,
            deleteBlock: categoryDeleteBlock(inCategory.length),
          }
        }),
    [categories, products, search],
  )

  const remove = (category: Category, block: string | null) => {
    if (block) return toast(`No se puede eliminar "${category.name}". ${block}`, 'warning')
    askConfirm({
      title: `Eliminar categoría ${category.name}`,
      message: 'La categoría no tiene productos. Dejará de mostrarse en el catálogo y en el Front Office.',
      confirmText: 'Eliminar categoría',
      onConfirm: () => {
        if (!ensurePermission('canManageTaxonomy', 'No tienes permiso para eliminar categorías')) return
        try {
          deleteCategory(category.id)
          toast(`Categoría "${category.name}" eliminada`, 'info')
        } catch (error) {
          toast(error instanceof Error ? error.message : 'No se pudo eliminar la categoría.', 'danger')
        }
      },
    })
  }

  return {
    items,
    total: categories.length,
    canEdit,
    canDelete,
    showProducts,
    edit: (category: Category) => openModal(CATALOG_MODALS.categoryForm, category),
    remove,
  }
}

export type CategoriesTabApi = ReturnType<typeof useCategoriesTab>
