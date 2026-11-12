import { useNavigate } from 'react-router-dom'
import { useProductFiltersStore } from '../13-pipeline-filtros-productos/02-filters.store'

/** Pre-filtra Productos por categoría y navega a la vista (usado por Categorías y Ofertas). */
export function useShowCategoryProducts() {
  const navigate = useNavigate()
  const setCategory = useProductFiltersStore((s) => s.setCategory)

  return (categoryId: string) => {
    setCategory(categoryId)
    navigate('/productos')
  }
}
