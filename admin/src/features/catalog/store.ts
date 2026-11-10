import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { delay } from '@/shared/lib/delay'
import { STORAGE_KEYS } from '@/shared/lib/storage'
import { nextSequentialId, slugify } from '@/shared/lib/text'
import { deductFromProducts, restockProducts, type StockLine } from './lib/inventory'
import { normalizeProduct } from './lib/normalize'
import { deriveBrands, productsInCategory, productsOfBrand, uniqueSlug } from './lib/taxonomy'
import { BRANDS_MOCK } from './mocks/brands.mock'
import { CATEGORIES_MOCK } from './mocks/categories.mock'
import { PRODUCTS_MOCK } from './mocks/products.mock'
import type { Brand, BrandDraft, Category, CategoryDraft, Product, ProductDraft } from './types'

interface CatalogState {
  products: Product[]
  categories: Category[]
  brands: Brand[]
  isLoading: boolean
  saveProduct: (draft: ProductDraft) => Promise<'created' | 'updated'>
  deleteProduct: (id: string) => void
  /** Ajuste rápido ±n. Ignorado en productos con control de lotes (su stock se deriva). */
  adjustStock: (id: string, delta: number) => void
  /** Alterna la visibilidad web y devuelve el nuevo estado. */
  toggleActive: (id: string) => boolean
  /** Crea (sin `id`) o edita una categoría. El id y el slug son inmutables. */
  saveCategory: (draft: CategoryDraft) => Promise<{ category: Category; created: boolean }>
  /** Lanza error si la categoría tiene productos (la regla completa vive en la vista). */
  deleteCategory: (id: string) => void
  /** Crea o edita una marca. Renombrar actualiza en cascada `brand` de sus productos. */
  saveBrand: (draft: BrandDraft) => Promise<{ brand: Brand; created: boolean; renamed: number }>
  /** Lanza error si la marca tiene productos (en ese caso se desactiva). */
  deleteBrand: (id: string) => void
  toggleBrand: (id: string) => boolean
  reset: () => void
}

const updateProduct = (products: Product[], id: string, patch: (p: Product) => Partial<Product>) =>
  products.map((p) => (p.id === id ? { ...p, ...patch(p) } : p))

/**
 * Versión del esquema persistido.
 * v1: modelo original del demo · v2: SKU, costo, IVA, especificaciones clave/valor y lotes.
 * v3: galería de imágenes (`images[]`); `imageUrl` pasa a ser la portada derivada.
 * v4: marcas como entidad (`brands[]`), derivadas de las marcas escritas en los productos.
 */
const CATALOG_SCHEMA_VERSION = 4

export const useCatalogStore = create<CatalogState>()(
  persist(
    (set, get) => ({
      products: PRODUCTS_MOCK,
      categories: CATEGORIES_MOCK,
      brands: BRANDS_MOCK,
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

      saveCategory: async ({ id, ...data }) => {
        set({ isLoading: true })
        await delay()
        const { categories } = get()
        const current = id ? categories.find((c) => c.id === id) : undefined
        if (current) {
          const category = { ...current, ...data }
          set({ categories: categories.map((c) => (c.id === id ? category : c)), isLoading: false })
          return { category, created: false }
        }
        const slug = uniqueSlug(data.name, categories.map((c) => c.id), 'categoria')
        const category: Category = { id: slug, slug, ...data }
        set({ categories: [...categories, category], isLoading: false })
        return { category, created: true }
      },

      deleteCategory: (id) => {
        if (productsInCategory(get().products, id).length > 0) throw new Error('La categoría tiene productos asignados.')
        set((s) => ({ categories: s.categories.filter((c) => c.id !== id) }))
      },

      saveBrand: async ({ id, ...data }) => {
        set({ isLoading: true })
        await delay()
        const { brands, products } = get()
        const current = id ? brands.find((b) => b.id === id) : undefined
        if (current) {
          const brand = { ...current, ...data }
          // Cascada: los productos guardan el nombre de la marca.
          const affected = current.name === brand.name ? [] : productsOfBrand(products, current.name).map((p) => p.id)
          set({
            brands: brands.map((b) => (b.id === id ? brand : b)),
            products: affected.length ? products.map((p) => (affected.includes(p.id) ? { ...p, brand: brand.name } : p)) : products,
            isLoading: false,
          })
          return { brand, created: false, renamed: affected.length }
        }
        const slug = uniqueSlug(data.name, brands.map((b) => b.id), 'marca')
        const brand: Brand = { id: slug, slug, ...data, createdAt: new Date().toISOString() }
        set({ brands: [...brands, brand], isLoading: false })
        return { brand, created: true, renamed: 0 }
      },

      deleteBrand: (id) => {
        const brand = get().brands.find((b) => b.id === id)
        if (brand && productsOfBrand(get().products, brand.name).length > 0) throw new Error('La marca tiene productos asignados.')
        set((s) => ({ brands: s.brands.filter((b) => b.id !== id) }))
      },

      toggleBrand: (id) => {
        const next = !get().brands.find((b) => b.id === id)?.active
        set((s) => ({ brands: s.brands.map((b) => (b.id === id ? { ...b, active: next } : b)) }))
        return next
      },

      reset: () => set({ products: PRODUCTS_MOCK, categories: CATEGORIES_MOCK, brands: BRANDS_MOCK }),
    }),
    {
      name: STORAGE_KEYS.CATALOG,
      version: CATALOG_SCHEMA_VERSION,
      partialize: (s) => ({ products: s.products, categories: s.categories, brands: s.brands }),
      // Completa los productos guardados con el modelo anterior en vez de descartarlos.
      migrate: (persisted) => {
        const state = persisted as Partial<Pick<CatalogState, 'products' | 'categories' | 'brands'>>
        const products = (state.products ?? PRODUCTS_MOCK).map(normalizeProduct)
        return {
          products,
          categories: state.categories ?? CATEGORIES_MOCK,
          // v4: las marcas escritas a mano en los productos guardados pasan a ser entidades.
          brands: state.brands ?? (state.products ? deriveBrands(products) : BRANDS_MOCK),
        }
      },
    },
  ),
)

/** Lecturas fuera de React para otros features (respaldo, registro de pedidos). */
export const getCatalogSnapshot = () => {
  const { products, categories, brands } = useCatalogStore.getState()
  return { products, categories, brands }
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
