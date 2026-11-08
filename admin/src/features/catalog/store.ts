import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { delay } from '@/shared/lib/delay'
import { STORAGE_KEYS } from '@/shared/lib/storage'
import { nextSequentialId, slugify } from '@/shared/lib/text'
import { deductFromProducts, restockProducts, type StockLine } from './lib/inventory'
import { normalizeProduct } from './lib/normalize'
import { CATEGORIES_MOCK } from './mocks/categories.mock'
import { PRODUCTS_MOCK } from './mocks/products.mock'
import type { Category, CategoryDraft, Product, ProductDraft } from './types'

interface CatalogState {
  products: Product[]
  categories: Category[]
  isLoading: boolean
  saveProduct: (draft: ProductDraft) => Promise<'created' | 'updated'>
  deleteProduct: (id: string) => void
  /** Ajuste rápido ±n. Ignorado en productos con control de lotes (su stock se deriva). */
  adjustStock: (id: string, delta: number) => void
  /** Alterna la visibilidad web y devuelve el nuevo estado. */
  toggleActive: (id: string) => boolean
  addCategory: (draft: CategoryDraft) => Promise<Category>
  reset: () => void
}

const updateProduct = (products: Product[], id: string, patch: (p: Product) => Partial<Product>) =>
  products.map((p) => (p.id === id ? { ...p, ...patch(p) } : p))

/**
 * Versión del esquema persistido.
 * v1: modelo original del demo · v2: SKU, costo, IVA, especificaciones clave/valor y lotes.
 */
const CATALOG_SCHEMA_VERSION = 2

export const useCatalogStore = create<CatalogState>()(
  persist(
    (set, get) => ({
      products: PRODUCTS_MOCK,
      categories: CATEGORIES_MOCK,
      isLoading: false,

      saveProduct: async (draft) => {
        set({ isLoading: true })
        await delay()
        const { products } = get()
        const current = draft.id ? products.find((p) => p.id === draft.id) : undefined
        if (current) {
          const updated = normalizeProduct({ ...current, ...draft, id: current.id })
          set({ products: products.map((p) => (p.id === current.id ? updated : p)), isLoading: false })
          return 'updated'
        }
        const id = nextSequentialId(products.map((p) => p.id), 'PRD-')
        const created = normalizeProduct({
          ...draft,
          id,
          sku: draft.sku || id,
          slug: slugify(draft.name),
          badge: null,
          rating: 5.0,
        })
        set({ products: [created, ...products], isLoading: false })
        return 'created'
      },

      deleteProduct: (id) => set((s) => ({ products: s.products.filter((p) => p.id !== id) })),

      adjustStock: (id, delta) =>
        set((s) => ({
          products: updateProduct(s.products, id, (p) =>
            p.lotControl ? {} : { stock: Math.max(0, p.stock + delta) },
          ),
        })),

      toggleActive: (id) => {
        const next = !get().products.find((p) => p.id === id)?.active
        set((s) => ({ products: updateProduct(s.products, id, () => ({ active: next })) }))
        return next
      },

      addCategory: async (draft) => {
        set({ isLoading: true })
        await delay()
        const { categories } = get()
        const base = slugify(draft.name) || 'categoria'
        const slug = categories.some((c) => c.id === base) ? `${base}-${categories.length + 1}` : base
        const category: Category = { id: slug, slug, ...draft }
        set({ categories: [...categories, category], isLoading: false })
        return category
      },

      reset: () => set({ products: PRODUCTS_MOCK, categories: CATEGORIES_MOCK }),
    }),
    {
      name: STORAGE_KEYS.CATALOG,
      version: CATALOG_SCHEMA_VERSION,
      partialize: (s) => ({ products: s.products, categories: s.categories }),
      // Completa los productos guardados con el modelo anterior en vez de descartarlos.
      migrate: (persisted) => {
        const state = persisted as Partial<Pick<CatalogState, 'products' | 'categories'>>
        return {
          products: (state.products ?? PRODUCTS_MOCK).map(normalizeProduct),
          categories: state.categories ?? CATEGORIES_MOCK,
        }
      },
    },
  ),
)

/** Lecturas fuera de React para otros features (respaldo, registro de pedidos). */
export const getCatalogSnapshot = () => {
  const { products, categories } = useCatalogStore.getState()
  return { products, categories }
}

export const findProduct = (id: string): Product | undefined =>
  useCatalogStore.getState().products.find((p) => p.id === id)

export const resetCatalog = (): void => useCatalogStore.getState().reset()

/** Salida de inventario por venta facturada (respeta lotes: vence primero, sale primero). */
export const deductStock = (lines: StockLine[]): void => {
  useCatalogStore.setState((s) => ({ products: deductFromProducts(s.products, lines) }))
}

/** Reingreso de inventario por anulación de factura. */
export const restoreStock = (lines: StockLine[]): void => {
  useCatalogStore.setState((s) => ({ products: restockProducts(s.products, lines) }))
}
