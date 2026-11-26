import type { Brand, Category, Product } from '@/00-director-modelos'
import { aCategoria, aMarca, aProducto, type CategoriaApi, type MarcaApi, type ProductoApi } from './02-adaptadores'
import { obtenerTodas } from './01-cliente-api'

/**
 * Catálogo público precargado al arrancar (decisión L07B): las vistas lo leen de
 * forma síncrona, igual que antes leían los mocks. Se rellena en el mismo arreglo
 * para que los módulos que ya lo importaron vean los datos; para ver cambios del
 * admin basta con recargar la página.
 */
export const products: Product[] = []
export const categories: Category[] = []
export const brands: Brand[] = []

const reemplazar = <T>(destino: T[], filas: T[]) => {
  destino.splice(0, destino.length, ...filas)
}

export async function cargarCatalogo(): Promise<void> {
  const [productos, categorias, marcas] = await Promise.all([
    obtenerTodas<ProductoApi>('/tienda/productos'),
    obtenerTodas<CategoriaApi>('/tienda/categorias'),
    obtenerTodas<MarcaApi>('/tienda/marcas'),
  ])
  reemplazar(products, productos.map(aProducto))
  reemplazar(categories, categorias.map(aCategoria))
  reemplazar(brands, marcas.map(aMarca))
}
