import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { delay } from '@/84-pipeline-persistencia-demo/04-delay'
import { STORAGE_KEYS } from '@/84-pipeline-persistencia-demo/02-storage'
import { onAuthenticated } from '@/84-pipeline-persistencia-demo/05-api.client'
import { toast } from '@/76-pipeline-avisos-globales/02-toast.store'
import { nextSequentialId, slugify } from '@/85-pipeline-identificadores-texto/00-director-identificadores-texto'
import { deductFromProducts, restockProducts, type StockLine } from '../24-pipeline-inventario-productos/03-inventory'
import { normalizeProduct } from '../20-pipeline-validacion-producto/03-normalize'
import { deriveBrands, productsInCategory, productsOfBrand } from './03-taxonomy'
import { deleteBrandApi, deleteCategoryApi, fetchTaxonomy, saveBrandApi, saveCategoryApi, setBrandActiveApi } from './05-catalogo.api'
import { BRANDS_MOCK } from '../87-pipeline-datos-demo-productos/03-brands.mock'
import { CATEGORIES_MOCK } from '../87-pipeline-datos-demo-productos/02-categories.mock'
import { PRODUCTS_MOCK } from '../87-pipeline-datos-demo-productos/00-director-datos-demo-productos'
import type { Brand, BrandDraft, Category, CategoryDraft, Product, ProductDraft } from './04-types'

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

const errorMessage = (error: unknown, fallback: string) => (error instanceof Error ? error.message : fallback)

/** Reinsertar en su posición original un elemento cuya eliminación optimista falló. */
const restoreAt = <T extends { id: string }>(items: T[], item: T, index: number): T[] =>
  items.some((i) => i.id === item.id) ? items : [...items.slice(0, index), item, ...items.slice(index)]

const updateProduct = (products: Product[], id: string, patch: (p: Product) => Partial<Product>) =>
  products.map((p) => (p.id === id ? { ...p, ...patch(p) } : p))

/**
 * Versión del esquema persistido.
 * v1: modelo original del demo · v2: SKU, costo, IVA, especificaciones clave/valor y lotes.
 * v3: galería de imágenes (`images[]`); `imageUrl` pasa a ser la portada derivada.
 * v4: marcas como entidad (`brands[]`), derivadas de las marcas escritas en los productos.
 *
 * L04: categorías y marcas vienen de la API (05-catalogo.api) y lo persistido es solo caché;
 * los productos siguen siendo datos de demostración hasta L05.
 */
const CATALOG_SCHEMA_VERSION = 4

export const useCatalogStore = create<CatalogState>()(
  persist(
    (set, get) => ({
      products: PRODUCTS_MOCK,
      categories: [],
      brands: [],
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

      saveCategory: async (draft) => {
        set({ isLoading: true })
        try {
          const category = await saveCategoryApi(draft)
          set((s) => ({
            categories: draft.id ? s.categories.map((c) => (c.id === category.id ? category : c)) : [...s.categories, category],
            isLoading: false,
          }))
          return { category, created: !draft.id }
        } catch (error) {
          set({ isLoading: false })
          toast(errorMessage(error, 'No se pudo guardar la categoría.'), 'danger')
          throw error
        }
      },

      // Optimista: se quita al instante; si la API la rechaza (p. ej. 409 con productos), se restaura.
      deleteCategory: (id) => {
        if (productsInCategory(get().products, id).length > 0) throw new Error('La categoría tiene productos asignados.')
        const { categories } = get()
        const index = categories.findIndex((c) => c.id === id)
        if (index < 0) return
        const removed = categories[index]
        set({ categories: categories.filter((c) => c.id !== id) })
        deleteCategoryApi(id).catch((error: unknown) => {
          set((s) => ({ categories: restoreAt(s.categories, removed, index) }))
          toast(`No se eliminó "${removed.name}": ${errorMessage(error, 'error del servidor.')}`, 'danger')
        })
      },

      saveBrand: async (draft) => {
        set({ isLoading: true })
        try {
          const current = draft.id ? get().brands.find((b) => b.id === draft.id) : undefined
          const brand = await saveBrandApi(draft)
          const { brands, products } = get()
          // Cascada local: los productos de demostración guardan el nombre de la marca (hasta L05).
          const affected = current && current.name !== brand.name ? productsOfBrand(products, current.name).map((p) => p.id) : []
          set({
            brands: current ? brands.map((b) => (b.id === brand.id ? brand : b)) : [...brands, brand],
            products: affected.length ? products.map((p) => (affected.includes(p.id) ? { ...p, brand: brand.name } : p)) : products,
            isLoading: false,
          })
          return { brand, created: !current, renamed: affected.length }
        } catch (error) {
          set({ isLoading: false })
          toast(errorMessage(error, 'No se pudo guardar la marca.'), 'danger')
          throw error
        }
      },

      deleteBrand: (id) => {
        const { brands, products } = get()
        const index = brands.findIndex((b) => b.id === id)
        if (index < 0) return
        const removed = brands[index]
        if (productsOfBrand(products, removed.name).length > 0) throw new Error('La marca tiene productos asignados.')
        set({ brands: brands.filter((b) => b.id !== id) })
        deleteBrandApi(id).catch((error: unknown) => {
          set((s) => ({ brands: restoreAt(s.brands, removed, index) }))
          toast(`No se eliminó "${removed.name}": ${errorMessage(error, 'error del servidor.')}`, 'danger')
        })
      },

      toggleBrand: (id) => {
        const next = !get().brands.find((b) => b.id === id)?.active
        const setActive = (active: boolean) => set((s) => ({ brands: s.brands.map((b) => (b.id === id ? { ...b, active } : b)) }))
        setActive(next)
        setBrandActiveApi(id, next)
          .then((brand) => set((s) => ({ brands: s.brands.map((b) => (b.id === id ? brand : b)) })))
          .catch((error: unknown) => {
            setActive(!next)
            toast(`No se cambió el estado de la marca: ${errorMessage(error, 'error del servidor.')}`, 'danger')
          })
        return next
      },

      // Mantenimiento: los productos vuelven a la demo; la taxonomía se relee de la API (no hay mocks que restaurar).
      reset: () => {
        set({ products: PRODUCTS_MOCK })
        void loadTaxonomy()
      },
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

/** Carga categorías y marcas desde la API (al iniciar o restaurar la sesión). */
async function loadTaxonomy(): Promise<void> {
  try {
    useCatalogStore.setState(await fetchTaxonomy())
  } catch (error) {
    toast(`No se pudieron cargar categorías y marcas: ${errorMessage(error, 'error del servidor.')}`, 'danger')
  }
}

onAuthenticated(() => void loadTaxonomy())

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
