import { apiClient } from '@/84-pipeline-persistencia-demo/05-api.client'
import type { Brand, BrandDraft, Category, CategoryDraft } from './04-types'

/**
 * Adaptador de catálogo (D-14): traduce el contrato de la API (español,
 * contratos-A §4.3) a los tipos del admin. L04: categorías y marcas.
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

interface Envelope<T> {
  data: T
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
