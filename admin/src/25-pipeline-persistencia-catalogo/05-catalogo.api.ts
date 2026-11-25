import { apiClient } from '@/84-pipeline-persistencia-demo/05-api.client'
import { PLACEHOLDER_IMAGE } from '../17-pipeline-ficha-producto/03-productImages'
import type {
  Brand,
  BrandDraft,
  Category,
  CategoryDraft,
  InventoryMetrics,
  Product,
  ProductCondition,
  ProductDraft,
  ProductLot,
} from './04-types'

/**
 * Adaptador de catálogo (D-14): traduce el contrato de la API (español,
 * contratos-A §4.2 y §4.3) a los tipos del admin. L04: categorías y marcas; L05: productos e imágenes.
 * El slug es el id en el admin y nunca cambia (D-04).
 */

interface CategoryDto {
  slug: string
  nombre: string
  icono: string
  descripcion: string
  totalProductos: number
}

interface BrandDto {
  slug: string
  nombre: string
  sitioWeb: string | null
  descripcion: string
  icono: string | null
  activa: boolean
  creadaEn: string
  totalProductos: number
}

interface ProductDto {
  id: number
  slug: string
  sku: string
  nombre: string
  descripcion: string
  categoria: { slug: string; nombre: string }
  marca: { slug: string; nombre: string }
  precio: string
  precioAnterior: string | null
  etiqueta: string | null
  imagenes: string[]
  especificaciones: { clave: string; valor: string }[]
  calificacion: number | null
  modelo: string
  condicion: ProductCondition
  costo: string | null
  tasaIva: string
  stock: number
  puntoReorden: number
  controlLotes: boolean
  lotes: LotDto[]
  publicado: boolean
  compatibilidad: string
  conectividad: string
}

interface LotDto {
  id: number
  numero: string
  cantidad: number
  vence: string | null
}

/** Existencias que devuelve el inventario (L06) tras un ajuste o una edición. */
interface StockDto {
  productoId: number
  stock: number
  controlLotes: boolean
  lotes: LotDto[]
}

interface InventoryMetricsDto {
  total: number
  publicados: number
  stockBajo: number
  agotados: number
  valoracion: string
}

interface Envelope<T> {
  data: T
}

interface PagedEnvelope<T> extends Envelope<T[]> {
  meta: { page: number; totalPages: number }
}

/** Los adaptadores de A piden la página completa (limit ≤ 100, D-06). */
const FULL_PAGE = { params: { limit: 100 } }

const toCategory = (dto: CategoryDto): Category => ({
  id: dto.slug,
  slug: dto.slug,
  name: dto.nombre,
  icon: dto.icono,
  description: dto.descripcion,
})

const toBrand = (dto: BrandDto): Brand => ({
  id: dto.slug,
  slug: dto.slug,
  name: dto.nombre,
  website: dto.sitioWeb ?? '',
  description: dto.descripcion,
  active: dto.activa,
  createdAt: dto.creadaEn,
})

const categoryBody = ({ name, icon, description }: Omit<CategoryDraft, 'id'>) => ({ nombre: name, icono: icon, descripcion: description })

const brandBody = ({ name, website, description, active }: Omit<BrandDraft, 'id'>) => ({
  nombre: name,
  sitioWeb: website || null,
  descripcion: description,
  activa: active,
})

const path = (resource: 'categorias' | 'marcas', slug?: string) =>
  slug ? `/admin/${resource}/${encodeURIComponent(slug)}` : `/admin/${resource}`

export async function fetchTaxonomy(): Promise<{ categories: Category[]; brands: Brand[] }> {
  const [categories, brands] = await Promise.all([
    apiClient.get<Envelope<CategoryDto[]>>(path('categorias'), FULL_PAGE),
    apiClient.get<Envelope<BrandDto[]>>(path('marcas'), FULL_PAGE),
  ])
  return { categories: categories.data.data.map(toCategory), brands: brands.data.data.map(toBrand) }
}

/** Sin `id` crea (201); con `id` edita (el slug no cambia). */
export async function saveCategoryApi({ id, ...draft }: CategoryDraft): Promise<Category> {
  const { data } = id
    ? await apiClient.patch<Envelope<CategoryDto>>(path('categorias', id), categoryBody(draft))
    : await apiClient.post<Envelope<CategoryDto>>(path('categorias'), categoryBody(draft))
  return toCategory(data.data)
}

export async function deleteCategoryApi(id: string): Promise<void> {
  await apiClient.delete(path('categorias', id))
}

export async function saveBrandApi({ id, ...draft }: BrandDraft): Promise<Brand> {
  const { data } = id
    ? await apiClient.patch<Envelope<BrandDto>>(path('marcas', id), brandBody(draft))
    : await apiClient.post<Envelope<BrandDto>>(path('marcas'), brandBody(draft))
  return toBrand(data.data)
}

export async function deleteBrandApi(id: string): Promise<void> {
  await apiClient.delete(path('marcas', id))
}

export async function setBrandActiveApi(id: string, active: boolean): Promise<Brand> {
  const { data } = await apiClient.patch<Envelope<BrandDto>>(`${path('marcas', id)}/activa`, { activa: active })
  return toBrand(data.data)
}

/* ---------- Productos (L05) ---------- */

const PRODUCT_PREFIX = 'PRD-'

/** Id numérico de la API ↔ id del admin `PRD-###` (D-04). */
const toProductId = (id: number) => `${PRODUCT_PREFIX}${String(id).padStart(3, '0')}`
const toApiId = (id: string) => Number(id.slice(PRODUCT_PREFIX.length))

const money = (value: number) => value.toFixed(2)
const optionalMoney = (value: number | null) => (value === null ? null : money(value))
const optionalNumber = (value: string | null) => (value === null ? null : Number(value))

const toLots = (lotes: LotDto[]): ProductLot[] =>
  lotes.map((lot) => ({ id: String(lot.id), lotNumber: lot.numero, quantity: lot.cantidad, expiresAt: lot.vence }))

const toProduct = (dto: ProductDto): Product => ({
  id: toProductId(dto.id),
  sku: dto.sku,
  name: dto.nombre,
  slug: dto.slug,
  brand: dto.marca.nombre,
  model: dto.modelo,
  condition: dto.condicion,
  category: dto.categoria.slug,
  cost: optionalNumber(dto.costo),
  price: Number(dto.precio),
  originalPrice: optionalNumber(dto.precioAnterior),
  taxRate: Number(dto.tasaIva),
  stock: dto.stock,
  reorderPoint: dto.puntoReorden,
  lotControl: dto.controlLotes,
  lots: toLots(dto.lotes),
  active: dto.publicado,
  badge: dto.etiqueta,
  rating: dto.calificacion ?? 0,
  imageUrl: dto.imagenes[0] ?? PLACEHOLDER_IMAGE,
  images: dto.imagenes,
  description: dto.descripcion,
  compatibility: dto.compatibilidad,
  connectivity: dto.conectividad,
  specs: dto.especificaciones.map((spec) => ({ key: spec.clave, value: spec.valor })),
})

/** Cuerpo de escritura (§4.2). Stock y lotes solo viajan en el alta; al editar van por el inventario (`saveStockApi`). */
const productBody = (draft: ProductDraft, brandSlug: string) => ({
  sku: draft.sku || null,
  nombre: draft.name,
  categoria: draft.category,
  marca: brandSlug,
  modelo: draft.model,
  condicion: draft.condition,
  costo: optionalMoney(draft.cost),
  precio: money(draft.price),
  precioAnterior: optionalMoney(draft.originalPrice),
  tasaIva: money(draft.taxRate),
  puntoReorden: draft.reorderPoint,
  publicado: draft.active,
  descripcion: draft.description,
  compatibilidad: draft.compatibility,
  conectividad: draft.connectivity,
  especificaciones: draft.specs.map((spec) => ({ clave: spec.key, valor: spec.value })),
  imagenes: draft.images,
})

const productPath = (id?: string) => (id ? `/admin/productos/${toApiId(id)}` : '/admin/productos')

/** Todo el catálogo: páginas de 100 (D-06) hasta la última. */
export async function fetchProducts(): Promise<Product[]> {
  const products: Product[] = []
  for (let page = 1; ; page++) {
    const { data } = await apiClient.get<PagedEnvelope<ProductDto>>(productPath(), { params: { limit: 100, page } })
    products.push(...data.data.map(toProduct))
    if (page >= data.meta.totalPages) return products
  }
}

/** Sin `id` crea (con sus existencias iniciales); con `id` edita. `brandSlug` traduce el nombre de marca del admin. */
export async function saveProductApi({ id, ...draft }: ProductDraft, brandSlug: string): Promise<Product> {
  const { data } = id
    ? await apiClient.patch<Envelope<ProductDto>>(productPath(id), productBody(draft, brandSlug))
    : await apiClient.post<Envelope<ProductDto>>(productPath(), { ...productBody(draft, brandSlug), ...stockBody(draft) })
  return toProduct(data.data)
}

/* ---------- Inventario (L06) ---------- */

/** Parte de inventario del producto que devuelve la API tras escribir existencias. */
export type ProductStock = Pick<Product, 'stock' | 'lotControl' | 'lots'>

const toStock = (dto: StockDto): ProductStock => ({ stock: dto.stock, lotControl: dto.controlLotes, lots: toLots(dto.lotes) })

/** Lotes con id numérico ya existen en la API; los de `uid()` (filas nuevas del formulario) se crean. */
const EXISTING_LOT_ID = /^\d+$/

const lotBody = (lot: ProductLot) => ({
  ...(EXISTING_LOT_ID.test(lot.id) ? { id: Number(lot.id) } : {}),
  numero: lot.lotNumber,
  cantidad: lot.quantity,
  vence: lot.expiresAt,
})

/** Stock manual o lotes (con lotes, el servidor calcula stock = Σ lotes). */
const stockBody = (draft: ProductStock) =>
  draft.lotControl ? { controlLotes: true, lotes: draft.lots.map(lotBody) } : { controlLotes: false, stock: draft.stock }

/** Ajuste rápido ±n; el motivo lo registra el servidor. */
export async function adjustStockApi(id: string, delta: number): Promise<ProductStock> {
  const { data } = await apiClient.post<Envelope<StockDto>>(`${productPath(id)}/ajustes`, { delta })
  return toStock(data.data)
}

/** Existencias editadas en la ficha. `expectedStock` es el stock que se vio al abrirla (409 si cambió). */
export async function saveStockApi(id: string, draft: ProductStock, expectedStock: number): Promise<ProductStock> {
  const { data } = await apiClient.put<Envelope<StockDto>>(`${productPath(id)}/existencias`, { ...stockBody(draft), stockEsperado: expectedStock })
  return toStock(data.data)
}

export async function fetchInventoryMetrics(): Promise<InventoryMetrics> {
  const { data } = await apiClient.get<Envelope<InventoryMetricsDto>>('/admin/inventario/metricas')
  const m = data.data
  return { total: m.total, active: m.publicados, lowStock: m.stockBajo, outOfStock: m.agotados, totalValuation: Number(m.valoracion) }
}

export async function deleteProductApi(id: string): Promise<void> {
  await apiClient.delete(productPath(id))
}

export async function setProductPublishedApi(id: string, published: boolean): Promise<Product> {
  const { data } = await apiClient.patch<Envelope<ProductDto>>(`${productPath(id)}/publicado`, { publicado: published })
  return toProduct(data.data)
}

/** Sube a la API (→ Cloudinary, D-17) una imagen elegida en el formulario (data URL) como binario. */
export async function uploadImageApi(dataUrl: string): Promise<{ id: number; url: string }> {
  const blob = await (await fetch(dataUrl)).blob()
  const { data } = await apiClient.post<Envelope<{ id: number; url: string }>>('/admin/imagenes', blob, {
    headers: { 'Content-Type': blob.type },
  })
  return data.data
}

/** Descarta una imagen subida que no llegó a guardarse en un producto (evita huérfanas). */
export async function discardImageApi(id: number): Promise<void> {
  await apiClient.delete(`/admin/imagenes/${id}`)
}
