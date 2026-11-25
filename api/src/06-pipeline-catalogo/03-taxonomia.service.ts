import { ErrorApp, meta, rango, type MetaPaginacion, type Paginacion } from '../04-pipeline-http/00-director-http.js'
import { slugify, type CrearCategoria, type CrearMarca, type EditarCategoria, type EditarMarca } from './02-taxonomia.schema.js'
import * as repo from './04-taxonomia.repository.js'

/** Contrato de categoría y marca (docs/fase-1/contratos-A.md §4.3). */
export interface CategoriaDto {
  slug: string
  nombre: string
  icono: string
  descripcion: string
  totalProductos: number
}

export interface MarcaPublicaDto {
  slug: string
  nombre: string
  sitioWeb: string | null
  descripcion: string
  icono: string | null
  totalProductos: number
}

export interface MarcaDto extends MarcaPublicaDto {
  activa: boolean
  creadaEn: string
}

export interface Pagina<T> {
  data: T[]
  meta: MetaPaginacion
}

type ConConteo = { _count: { productos: number } }

const aCategoria = (c: Omit<CategoriaDto, 'totalProductos'> & ConConteo): CategoriaDto => ({
  slug: c.slug,
  nombre: c.nombre,
  icono: c.icono,
  descripcion: c.descripcion,
  totalProductos: c._count.productos,
})

type MarcaFila = Omit<MarcaPublicaDto, 'totalProductos'> & ConConteo & { activa: boolean; creadaEn: Date }

const aMarcaPublica = (m: MarcaFila): MarcaPublicaDto => ({
  slug: m.slug,
  nombre: m.nombre,
  sitioWeb: m.sitioWeb,
  descripcion: m.descripcion,
  icono: m.icono,
  totalProductos: m._count.productos,
})

const aMarca = (m: MarcaFila): MarcaDto => ({ ...aMarcaPublica(m), activa: m.activa, creadaEn: m.creadaEn.toISOString() })

/** Slug único e inmutable (D-04): si ya existe, se agrega un sufijo -2, -3… */
async function slugUnico(nombre: string, respaldo: string, existentes: (prefijo: string) => Promise<string[]>): Promise<string> {
  const base = slugify(nombre) || respaldo
  const tomados = new Set(await existentes(base))
  if (!tomados.has(base)) return base
  let n = 2
  while (tomados.has(`${base}-${n}`)) n++
  return `${base}-${n}`
}

const noEncontrada = (tipo: 'La categoría' | 'La marca', slug: string) => new ErrorApp('NOT_FOUND', 404, `${tipo} "${slug}" no existe.`)

/* ---------- Categorías ---------- */

export async function listarCategorias(paginacion: Paginacion, publico: boolean): Promise<Pagina<CategoriaDto>> {
  const [filas, total] = await repo.listarCategorias(rango(paginacion), publico)
  return { data: filas.map(aCategoria), meta: meta(paginacion, total) }
}

export async function obtenerCategoria(slug: string): Promise<CategoriaDto> {
  const categoria = await repo.buscarCategoria(slug)
  if (!categoria) throw noEncontrada('La categoría', slug)
  return aCategoria(categoria)
}

async function exigirNombreCategoriaLibre(nombre: string, exceptoSlug?: string) {
  if (await repo.categoriaConNombre(nombre, exceptoSlug)) throw new ErrorApp('CONFLICT', 409, 'Ya existe una categoría con ese nombre.')
}

export async function crearCategoria(datos: CrearCategoria): Promise<CategoriaDto> {
  await exigirNombreCategoriaLibre(datos.nombre)
  const slug = await slugUnico(datos.nombre, 'categoria', repo.slugsDeCategoria)
  return aCategoria(await repo.crearCategoria({ slug, ...datos }))
}

/** El slug no cambia al renombrar: forma parte de las URLs de la tienda. */
export async function editarCategoria(slug: string, datos: EditarCategoria): Promise<CategoriaDto> {
  await obtenerCategoria(slug)
  if (datos.nombre !== undefined) await exigirNombreCategoriaLibre(datos.nombre, slug)
  return aCategoria(await repo.editarCategoria(slug, datos))
}

export async function eliminarCategoria(slug: string): Promise<void> {
  const { totalProductos } = await obtenerCategoria(slug)
  if (totalProductos > 0) {
    throw new ErrorApp('CONFLICT', 409, `Tiene ${totalProductos} producto(s). Reasígnalos a otra categoría antes de eliminarla.`)
  }
  await repo.eliminarCategoria(slug)
}

/* ---------- Marcas ---------- */

export async function listarMarcas(paginacion: Paginacion): Promise<Pagina<MarcaDto>> {
  const [filas, total] = await repo.listarMarcas(rango(paginacion), false)
  return { data: filas.map(aMarca), meta: meta(paginacion, total) }
}

/** Tienda: solo marcas activas, contando solo productos publicados. */
export async function listarMarcasPublicas(paginacion: Paginacion): Promise<Pagina<MarcaPublicaDto>> {
  const [filas, total] = await repo.listarMarcas(rango(paginacion), true)
  return { data: filas.map(aMarcaPublica), meta: meta(paginacion, total) }
}

export async function obtenerMarca(slug: string): Promise<MarcaDto> {
  const marca = await repo.buscarMarca(slug)
  if (!marca) throw noEncontrada('La marca', slug)
  return aMarca(marca)
}

async function exigirNombreMarcaLibre(nombre: string, exceptoSlug?: string) {
  if (await repo.marcaConNombre(nombre, exceptoSlug)) throw new ErrorApp('CONFLICT', 409, 'Esta marca ya está registrada.')
}

export async function crearMarca(datos: CrearMarca): Promise<MarcaDto> {
  await exigirNombreMarcaLibre(datos.nombre)
  const slug = await slugUnico(datos.nombre, 'marca', repo.slugsDeMarca)
  return aMarca(await repo.crearMarca({ slug, ...datos }))
}

export async function editarMarca(slug: string, datos: EditarMarca): Promise<MarcaDto> {
  await obtenerMarca(slug)
  if (datos.nombre !== undefined) await exigirNombreMarcaLibre(datos.nombre, slug)
  return aMarca(await repo.editarMarca(slug, datos))
}

/** Una marca inactiva conserva sus productos, pero no se ofrece para productos nuevos (L05). */
export const activarMarca = (slug: string, activa: boolean): Promise<MarcaDto> => editarMarca(slug, { activa })

export async function eliminarMarca(slug: string): Promise<void> {
  const { totalProductos } = await obtenerMarca(slug)
  if (totalProductos > 0) {
    throw new ErrorApp('CONFLICT', 409, `Tiene ${totalProductos} producto(s). Desactívala para dejar de ofrecerla en productos nuevos.`)
  }
  await repo.eliminarMarca(slug)
}
