import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { STORAGE_KEYS } from '@/84-pipeline-persistencia-demo/02-storage'
import { onAuthenticated } from '@/84-pipeline-persistencia-demo/05-api.client'
import { toast } from '@/76-pipeline-avisos-globales/02-toast.store'
import { deductFromProducts, restockProducts, type StockLine } from '../24-pipeline-inventario-productos/03-inventory'
import { isDataUrl } from '../17-pipeline-ficha-producto/03-productImages'
import { productsInCategory, productsOfBrand } from './03-taxonomy'
import {
  adjustStockApi,
  deleteBrandApi,
  deleteCategoryApi,
  deleteProductApi,
  discardImageApi,
  fetchInventoryMetrics,
  fetchProducts,
  fetchTaxonomy,
  saveBrandApi,
  saveCategoryApi,
  saveProductApi,
  saveStockApi,
  setBrandActiveApi,
  setProductPublishedApi,
  uploadImageApi,
  type ProductStock,
} from './05-catalogo.api'
import type { Brand, BrandDraft, Category, CategoryDraft, InventoryMetrics, Product, ProductDraft } from './04-types'

interface CatalogState {
  products: Product[]
  categories: Category[]
  brands: Brand[]
  /** Métricas de inventario calculadas por la API (L06); `null` hasta la primera carga. */
  inventoryMetrics: InventoryMetrics | null
  isLoading: boolean
  saveProduct: (draft: ProductDraft) => Promise<'created' | 'updated'>
  deleteProduct: (id: string) => void
  /** Ajuste rápido ±n (optimista; si la API lo rechaza se revierte). Devuelve si se aplicó. */
  adjustStock: (id: string, delta: number) => boolean
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

const lotsKey = (p: ProductStock) => JSON.stringify(p.lots.map((l) => [l.id, l.lotNumber, l.quantity, l.expiresAt]))

/** ¿La ficha cambió las existencias? (modo, stock manual o lotes). */
const stockChanged = (current: ProductStock, draft: ProductStock) =>
  current.lotControl !== draft.lotControl || (draft.lotControl ? lotsKey(current) !== lotsKey(draft) : current.stock !== draft.stock)

/** Sube las imágenes locales (data URL) y devuelve la galería con URLs; anota los ids subidos para descartarlos si algo falla. */
async function uploadLocalImages(images: string[], uploaded: number[]): Promise<string[]> {
  const urls: string[] = []
  for (const src of images) {
    if (!isDataUrl(src)) {
      urls.push(src)
      continue
    }
    const image = await uploadImageApi(src)
    uploaded.push(image.id)
    urls.push(image.url)
  }
  return urls
}

/**
 * Versión del esquema persistido.
 * v1: modelo original del demo · v2: SKU, costo, IVA, especificaciones clave/valor y lotes.
 * v3: galería de imágenes (`images[]`); `imageUrl` pasa a ser la portada derivada.
 * v4: marcas como entidad (`brands[]`), derivadas de las marcas escritas en los productos.
 *
 * L04: categorías y marcas vienen de la API (05-catalogo.api) y lo persistido es solo caché.
 * v5 (L05): los productos también vienen de la API; se descarta la caché anterior (datos demo).
 */
const CATALOG_SCHEMA_VERSION = 5

export const useCatalogStore = create<CatalogState>()(
  persist(
    (set, get) => ({
      products: [],
      categories: [],
      brands: [],
      inventoryMetrics: null,
      isLoading: false,

      saveProduct: async (draft) => {
        const { products, brands } = get()
        const current = draft.id ? products.find((p) => p.id === draft.id) : undefined
        set({ isLoading: true })
        const uploaded: number[] = []
        const store = (saved: Product) =>
          set((s) => ({ products: current ? s.products.map((p) => (p.id === saved.id ? saved : p)) : [saved, ...s.products] }))
        try {
          const brandSlug = brands.find((b) => b.name === draft.brand)?.slug
          if (!brandSlug) throw new Error(`La marca "${draft.brand}" no existe en el catálogo.`)
          const images = await uploadLocalImages(draft.images, uploaded)
          let saved = await saveProductApi({ ...draft, images }, brandSlug)
          uploaded.length = 0 // Las imágenes ya pertenecen al producto: no se descartan aunque falle lo que sigue.
          // Al editar, las existencias van por el inventario (L06), con el stock que se vio al abrir la ficha.
          if (current && stockChanged(current, draft)) {
            try {
              saved = { ...saved, ...(await saveStockApi(saved.id, draft, current.stock)) }
            } catch (error) {
              store(saved) // Los datos del producto sí se guardaron.
              throw error
            }
          }
          store(saved)
          set({ isLoading: false })
          void refreshInventoryMetrics()
          return current ? 'updated' : 'created'
        } catch (error) {
          set({ isLoading: false })
          // Lo subido para este guardado no quedó en ningún producto: se descarta para no dejar huérfanas.
          uploaded.forEach((id) => void discardImageApi(id).catch(() => {}))
          toast(errorMessage(error, 'No se pudo guardar el producto.'), 'danger')
          throw error
        }
      },

      // Optimista: se quita al instante; si la API lo rechaza (p. ej. 409 con historial), se restaura.
      deleteProduct: (id) => {
        const { products } = get()
        const index = products.findIndex((p) => p.id === id)
        if (index < 0) return
        const removed = products[index]
        set({ products: products.filter((p) => p.id !== id) })
        deleteProductApi(id)
          .then(() => void refreshInventoryMetrics())
          .catch((error: unknown) => {
            set((s) => ({ products: restoreAt(s.products, removed, index) }))
            toast(`No se eliminó "${removed.name}": ${errorMessage(error, 'error del servidor.')}`, 'danger')
          })
      },

      // Optimista: el ±n se ve al instante; la respuesta trae el stock real y, si falla, se deshace solo este ajuste.
      adjustStock: (id, delta) => {
        const product = get().products.find((p) => p.id === id)
        if (!product) return false
        if (product.stock + delta < 0) {
          toast('No hay existencias suficientes para restar.', 'warning')
          return false
        }
        set((s) => ({ products: updateProduct(s.products, id, (p) => ({ stock: p.stock + delta })) }))
        adjustStockApi(id, delta)
          .then((stock) => {
            set((s) => ({ products: updateProduct(s.products, id, () => stock) }))
            void refreshInventoryMetrics()
          })
          .catch((error: unknown) => {
            set((s) => ({ products: updateProduct(s.products, id, (p) => ({ stock: Math.max(0, p.stock - delta) })) }))
            toast(`No se actualizó el stock de "${product.name}": ${errorMessage(error, 'error del servidor.')}`, 'danger')
          })
        return true
      },

      toggleActive: (id) => {
        const next = !get().products.find((p) => p.id === id)?.active
        const setActive = (active: boolean) => set((s) => ({ products: updateProduct(s.products, id, () => ({ active })) }))
        setActive(next)
        setProductPublishedApi(id, next)
          .then((product) => {
            set((s) => ({ products: s.products.map((p) => (p.id === id ? product : p)) }))
            void refreshInventoryMetrics()
          })
          .catch((error: unknown) => {
            setActive(!next)
            toast(`No se cambió la visibilidad: ${errorMessage(error, 'error del servidor.')}`, 'danger')
          })
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
          // Cascada en la caché local: los productos del admin guardan el nombre de la marca (el servidor usa la FK).
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

      // Mantenimiento: el catálogo se relee de la API (no hay mocks que restaurar).
      reset: () => {
        void loadCatalog()
      },
    }),
    {
      name: STORAGE_KEYS.CATALOG,
      version: CATALOG_SCHEMA_VERSION,
      partialize: (s) => ({ products: s.products, categories: s.categories, brands: s.brands }),
      // Toda versión anterior era caché o demo: se descarta y se relee de la API al autenticarse.
      migrate: () => ({ products: [], categories: [], brands: [] }),
    },
  ),
)

/** Relee las métricas de inventario de la API; si falla, se conservan las últimas (no se calculan en el cliente). */
async function refreshInventoryMetrics(): Promise<void> {
  try {
    useCatalogStore.setState({ inventoryMetrics: await fetchInventoryMetrics() })
  } catch {
    // Silencioso: el tablero sigue mostrando la última lectura válida.
  }
}

/** Carga categorías, marcas, productos y métricas desde la API (al iniciar o restaurar la sesión). */
async function loadCatalog(): Promise<void> {
  void refreshInventoryMetrics()
  try {
    const [taxonomy, products] = await Promise.all([fetchTaxonomy(), fetchProducts()])
    useCatalogStore.setState({ ...taxonomy, products })
  } catch (error) {
    toast(`No se pudo cargar el catálogo: ${errorMessage(error, 'error del servidor.')}`, 'danger')
  }
}

onAuthenticated(() => void loadCatalog())

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
