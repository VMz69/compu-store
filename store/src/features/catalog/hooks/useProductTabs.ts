import { useUIStore } from '@/shared/store/ui.store'
import type { ProductDetailTab } from '@/shared/store/ui.store'

/**
 * Pestaña activa del detalle de producto.
 */
export const useProductTabs = () => {
  const activeTab = useUIStore((state) => state.productDetailTab)
  const setActiveTab = useUIStore((state) => state.setProductDetailTab)

  const selectTab = (tab: ProductDetailTab) => setActiveTab(tab)

  return { activeTab, selectTab }
}
