import { randomUUID } from 'node:crypto'
import type { ProveedorImagenes } from '../03-pipeline-conexiones/00-director-conexiones.js'
import { ErrorApp, meta, rango, type Paginacion } from '../04-pipeline-http/00-director-http.js'
import type { CrearProducto, EditarProducto } from './06-productos.schema.js'
import { slugUnico, type Pagina } from './03-taxonomia.service.js'
import * as repo from './08-productos.repository.js'
import * as imagenes from './09-imagenes.service.js'

/* ---------- Contrato (docs/fase-1/contratos-A.md §4.1 y §4.2) ---------- */

export interface ProductoPublicoDto {
  id: number
  slug: string
  sku: string
  nombre: string
  descripcion: string
  categoria: { slug: string; nombre: string }
  marca: { slug: string; nombre: string }
  precio: string
  precioAnterior: string | null
  /** En A es el stock físico; en L14 pasa a físico − reservado sin cambiar el contrato. */
  disponible: number
  etiqueta: string | null
  imagenes: string[]
  especificaciones: { clave: string; valor: string }[]
  /** Reseñas: Fase B (L17). */
  calificacion: null
  totalResenas: number
}

export interface ProductoAdminDto extends ProductoPublicoDto {
  modelo: string
  condicion: string
  costo: string | null
  tasaIva: string
  stock: number
  puntoReorden: number
  controlLotes: boolean
  lotes: { id: number; numero: string; cantidad: number; vence: string | null }[]
  publicado: boolean
  compatibilidad: string
  conectividad: string
}

const importe = (valor: { toFixed: (decimales: number) => string }) => valor.toFixed(2)
const importeOpcional = (valor: { toFixed: (decimales: number) => string } | null) => (valor ? valor.toFixed(2) : null)

const aPublico = (p: repo.ProductoDetalle): ProductoPublicoDto => ({
  id: p.id,
  slug: p.slug,
  sku: p.sku,
  nombre: p.nombre,
  descripcion: p.descripcion,
  categoria: p.categoria,
  marca: p.marca,
  precio: importe(p.precio),
  precioAnterior: importeOpcional(p.precioAnterior),
  disponible: p.stock,
  etiqueta: p.etiqueta,
  imagenes: p.imagenes.map((img) => img.url),
  especificaciones: p.especificaciones.map(({ clave, valor }) => ({ clave, valor })),
  calificacion: null,
  totalResenas: 0,
})

const aAdmin = (p: repo.ProductoDetalle): ProductoAdminDto => ({
  ...aPublico(p),
  modelo: p.modelo,
  condicion: p.condicion,
  costo: importeOpcional(p.costo),
  tasaIva: importe(p.tasaIva),
  stock: p.stock,
  puntoReorden: p.puntoReorden,
  controlLotes: p.controlLotes,
  lotes: p.lotes.map((l) => ({ id: l.id, numero: l.numero, cantidad: l.cantidad, vence: l.vence ? l.vence.toISOString().slice(0, 10) : null })),
  publicado: p.publicado,
  compatibilidad: p.compatibilidad,
  conectividad: p.conectividad,
})

/* ---------- Reglas ---------- */

const MOTIVO_ALTA = 'Alta de producto'
const MENSAJE_CON_HISTORIAL = 'Tiene historial de inventario: ocúltalo de la tienda y, si corresponde, ajusta su stock a 0.'

/** SKU automático cuando el admin no indica uno (equivale al id del admin, `PRD-###`). */
const skuAutomatico = (id: number) => `PRD-${String(id).padStart(3, '0')}`

const noEncontrado = (id: number) => new ErrorApp('NOT_FOUND', 404, `El producto ${id} no existe.`)

async function exigirProducto(id: number): Promise<repo.ProductoDetalle> {
  const producto = await repo.buscar(id)
  if (!producto) throw noEncontrado(id)
  return producto
}

async function idCategoria(slug: string): Promise<number> {
  const categoria = await repo.categoriaPorSlug(slug)
  if (!categoria) throw new ErrorApp('BUSINESS_RULE', 422, `La categoría "${slug}" no existe.`)
  return categoria.id
}

/** Una marca inactiva no se asigna (§2 de contratos), salvo que el producto ya la tenga. */
async function idMarca(slug: string, actual?: number): Promise<number> {
  const marca = await repo.marcaPorSlug(slug)
  if (!marca) throw new ErrorApp('BUSINESS_RULE', 422, `La marca "${slug}" no existe.`)
  if (!marca.activa && marca.id !== actual) throw new ErrorApp('BUSINESS_RULE', 422, `La marca "${slug}" está inactiva.`)
  return marca.id
}

async function exigirSkuLibre(sku: string, exceptoId?: number) {
  if (await repo.productoConSku(sku, exceptoId)) throw new ErrorApp('CONFLICT', 409, 'Este SKU ya está asignado a otro producto.')
}

/** El precio anterior se muestra tachado como ahorro: debe superar al precio. */
function exigirPrecioAnterior(precio: string, precioAnterior: string | null) {
  if (precioAnterior !== null && Number(precioAnterior) <= Number(precio)) {
    throw new ErrorApp('VALIDATION_ERROR', 400, 'Datos inválidos.', [
      { campo: 'precioAnterior', mensaje: 'Debe ser mayor al precio de venta para mostrarse como ahorro.' },
    ])
  }
}

/* ---------- Lectura ---------- */

export async function listar(paginacion: Paginacion): Promise<Pagina<ProductoAdminDto>> {
  const [filas, total] = await repo.listar(rango(paginacion), false)
  return { data: filas.map(aAdmin), meta: meta(paginacion, total) }
}

export const obtener = async (id: number): Promise<ProductoAdminDto> => aAdmin(await exigirProducto(id))

/** Tienda: solo publicados (filtros, búsqueda y orden llegan en L07). */
export async function listarPublicos(paginacion: Paginacion): Promise<Pagina<ProductoPublicoDto>> {
  const [filas, total] = await repo.listar(rango(paginacion), true)
  return { data: filas.map(aPublico), meta: meta(paginacion, total) }
}

export async function obtenerPublico(id: number): Promise<ProductoPublicoDto> {
  const producto = await repo.buscar(id)
  if (!producto?.publicado) throw noEncontrado(id)
  return aPublico(producto)
}

/* ---------- Escritura ---------- */

export async function crear(datos: CrearProducto, usuarioId: number): Promise<ProductoAdminDto> {
  const { sku, categoria, marca, imagenes: urls, especificaciones, stock, ...resto } = datos
  exigirPrecioAnterior(datos.precio, datos.precioAnterior)
  const categoriaId = await idCategoria(categoria)
  const marcaId = await idMarca(marca)
  if (sku) await exigirSkuLibre(sku)
  const slug = await slugUnico(datos.nombre, 'producto', repo.slugsDeProducto)

  const id = await repo.transaccion(async (tx) => {
    // Sin SKU se guarda uno provisional único y se reemplaza por PRD-### al conocer el id.
    const { id } = await repo.crear(tx, { ...resto, slug, categoriaId, marcaId, sku: sku ?? `TMP-${randomUUID().slice(0, 18)}` })
    if (!sku) await repo.actualizar(tx, id, { sku: skuAutomatico(id) })
    const galeria = await imagenes.resolverGaleria(tx, urls, [])
    await repo.reemplazarImagenes(tx, id, galeria.imagenes)
    await repo.reemplazarEspecificaciones(tx, id, especificaciones)
    if (stock > 0) {
      await repo.fijarStock(tx, id, stock)
      await repo.registrarStockInicial(tx, id, stock, usuarioId, MOTIVO_ALTA)
    }
    return id
  })
  return obtener(id)
}

/** PATCH parcial; `imagenes` y `especificaciones` reemplazan la lista completa. El slug no cambia. */
export async function editar(proveedor: ProveedorImagenes, id: number, datos: EditarProducto): Promise<ProductoAdminDto> {
  const actual = await exigirProducto(id)
  const { sku, categoria, marca, imagenes: urls, especificaciones, ...resto } = datos
  exigirPrecioAnterior(datos.precio ?? importe(actual.precio), datos.precioAnterior !== undefined ? datos.precioAnterior : importeOpcional(actual.precioAnterior))
  const categoriaId = categoria !== undefined ? await idCategoria(categoria) : undefined
  const marcaId = marca !== undefined ? await idMarca(marca, actual.marcaId) : undefined
  const nuevoSku = sku === undefined ? undefined : (sku ?? skuAutomatico(id))
  if (nuevoSku !== undefined) await exigirSkuLibre(nuevoSku, id)

  const retiradas = await repo.transaccion(async (tx) => {
    await repo.actualizar(tx, id, {
      ...definidos(resto),
      ...(categoriaId !== undefined ? { categoriaId } : {}),
      ...(marcaId !== undefined ? { marcaId } : {}),
      ...(nuevoSku !== undefined ? { sku: nuevoSku } : {}),
    })
    if (especificaciones) await repo.reemplazarEspecificaciones(tx, id, especificaciones)
    if (!urls) return []
    const galeria = await imagenes.resolverGaleria(tx, urls, actual.imagenes)
    await repo.reemplazarImagenes(tx, id, galeria.imagenes)
    return galeria.retiradas
  })
  await imagenes.destruir(proveedor, retiradas)
  return obtener(id)
}

export async function publicar(id: number, publicado: boolean): Promise<ProductoAdminDto> {
  await exigirProducto(id)
  await repo.transaccion((tx) => repo.actualizar(tx, id, { publicado }))
  return obtener(id)
}

/** Solo sin historial de inventario (§3.2: la eliminación se restringe si hay referencias). */
export async function eliminar(proveedor: ProveedorImagenes, id: number): Promise<void> {
  const actual = await exigirProducto(id)
  if ((await repo.contarMovimientos(id)) > 0) throw new ErrorApp('CONFLICT', 409, MENSAJE_CON_HISTORIAL)
  await repo.transaccion((tx) => repo.eliminar(tx, id))
  await imagenes.destruir(
    proveedor,
    actual.imagenes.filter((img): img is typeof img & { publicId: string } => img.publicId !== null),
  )
}

/** Quita las claves `undefined` (PATCH parcial) para que Prisma solo actualice lo enviado. */
const definidos = <T extends object>(objeto: T) =>
  Object.fromEntries(Object.entries(objeto).filter(([, valor]) => valor !== undefined)) as {
    [K in keyof T]?: Exclude<T[K], undefined>
  }
