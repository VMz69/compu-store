import { create } from 'zustand'
import type { Brand, Category, Product } from '@/00-director-modelos'
import { aCategoria, aMarca, aProducto, type CategoriaApi, type MarcaApi, type ProductoApi } from './02-adaptadores'
import { obtenerTodas } from './01-cliente-api'

/**
 * Catálogo público en memoria (L07B): se precarga al arrancar y se refresca al navegar
 * (`06-refresco`). Es un store reactivo: cada recarga entrega arreglos nuevos y los
 * hooks que lo leen vuelven a calcular sus listados, conteos y relacionados.
 */
interface CatalogState {
  products: Product[]
  categories: Category[]
  brands: Brand[]
}

export const useCatalogStore = create<CatalogState>(() => ({ products: [], categories: [], brands: [] }))

export const useProducts = (): Product[] => useCatalogStore((state) => state.products)
export const useCategories = (): Category[] => useCatalogStore((state) => state.categories)
export const useBrands = (): Brand[] => useCatalogStore((state) => state.brands)

export async function cargarCatalogo(): Promise<void> {
  const [productos, categorias, marcas] = await Promise.all([
    obtenerTodas<ProductoApi>('/tienda/productos'),
    obtenerTodas<CategoriaApi>('/tienda/categorias'),
    obtenerTodas<MarcaApi>('/tienda/marcas'),
  ])
  useCatalogStore.setState({
    products: productos.map(aProducto),
    categories: categorias.map(aCategoria),
    brands: marcas.map(aMarca),
  })
}
