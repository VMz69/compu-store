/** Claves de modales del feature (resueltas por el ModalHost de la app). */
export const CATALOG_MODALS = {
  productForm: 'product-form',
  productDetail: 'product-detail',
  /** Alta/edición de categoría. Payload: `Category` a editar o `null`. */
  categoryForm: 'category-form',
  /** Alta/edición de marca. Payload: `Brand` a editar o `null`. */
  brandForm: 'brand-form',
} as const
