import { useUIStore } from '@/store/useUIStore'
import type { ProductDetailTab } from '@/store/useUIStore'

/**
 * Pestaña activa del detalle de producto.
 */
export const useProductTabs = () => {
  const activeTab = useUIStore((state) => state.productDetailTab)
  const setActiveTab = useUIStore((state) => state.setProductDetailTab)

  const selectTab = (tab: ProductDetailTab) => setActiveTab(tab)

  return { activeTab, selectTab }
}
