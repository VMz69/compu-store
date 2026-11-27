import { randomUUID } from 'node:crypto'
import type { ProveedorImagenes } from '../03-pipeline-conexiones/00-director-conexiones.js'
import { ErrorApp, meta, rango, type Paginacion } from '../04-pipeline-http/00-director-http.js'
import { liberarVencidas, registrarExistenciasIniciales, type ExistenciasIniciales } from '../07-pipeline-inventario/00-director-inventario.js'
import { hoyNegocio, precioEfectivo, type PrecioEfectivo } from '../10-pipeline-ofertas/00-director-ofertas.js'
import type { ConsultaTienda, CrearProducto, EditarProducto } from './06-productos.schema.js'
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
  /** Físico − reservado (L14; en A era el físico, mismo contrato). */
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

/**
 * Contrato público. Con una oferta vigente (L12), `precio` es el precio efectivo y `precioAnterior`
 * el precio base; sin `vigente` (admin) se devuelven siempre el precio base y el anterior manual.
 */
const aPublico = (p: repo.ProductoDetalle, vigente?: PrecioEfectivo): ProductoPublicoDto => ({
  id: p.id,
  slug: p.slug,
  sku: p.sku,
  nombre: p.nombre,
  descripcion: p.descripcion,
  categoria: p.categoria,
  marca: p.marca,
  precio: vigente?.ofertaId ? vigente.precio : importe(p.precio),
  precioAnterior: vigente?.ofertaId ? vigente.precioBase : importeOpcional(p.precioAnterior),
  disponible: Math.max(0, p.stock - p.reservado),
  etiqueta: p.etiqueta,
  imagenes: p.imagenes.map((img) => img.url),
  especificaciones: p.especificaciones.map(({ clave, valor }) => ({ clave, valor })),
  calificacion: null,
  totalResenas: 0,
})

/** El admin edita el precio base: nunca recibe el de oferta (así guardar no lo convierte en base). */
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

/**
 * Liberación perezosa (D-07, L14): antes de mostrar el disponible se vencen las reservas caducadas
 * de esos productos y, si alguna se venció, se releen las filas.
 */
async function conReservasAlDia(filas: repo.ProductoDetalle[]): Promise<repo.ProductoDetalle[]> {
  const conReserva = filas.filter((p) => p.reservado > 0).map((p) => p.id)
  if (conReserva.length === 0) return filas
  await liberarVencidas(conReserva)
  return repo.buscarVarios(filas.map((p) => p.id))
}

export async function listar(paginacion: Paginacion): Promise<Pagina<ProductoAdminDto>> {
  const [filas, total] = await repo.listar(rango(paginacion), false)
  return { data: (await conReservasAlDia(filas)).map(aAdmin), meta: meta(paginacion, total) }
}

export const obtener = async (id: number): Promise<ProductoAdminDto> => aAdmin(await exigirProducto(id))

/** Contrato público con el precio efectivo de hoy (un solo «hoy» por petición). */
async function aPublicos(filas: repo.ProductoDetalle[], hoy: string = hoyNegocio()): Promise<ProductoPublicoDto[]> {
  const [precios, alDia] = await Promise.all([precioEfectivo(filas.map((p) => p.id), hoy), conReservasAlDia(filas)])
  return alDia.map((p) => aPublico(p, precios.get(p.id)))
}

/** Tienda: solo publicados, con búsqueda, filtros, orden y paginación (L07), con el precio efectivo (L12). */
export async function listarPublicos(consulta: ConsultaTienda): Promise<Pagina<ProductoPublicoDto>> {
  const { page, limit, orden, ...filtros } = consulta
  const hoy = hoyNegocio()
  const [ids, total] = await Promise.all([repo.idsPublicos(filtros, orden, rango({ page, limit }), hoy), repo.contarPublicos(filtros, hoy)])
  const filas = await repo.buscarVarios(ids)
  return { data: await aPublicos(filas, hoy), meta: meta({ page, limit }, total) }
}

async function exigirPublicado(id: number): Promise<repo.ProductoDetalle> {
  const producto = await repo.buscar(id)
  if (!producto?.publicado) throw noEncontrado(id)
  return producto
}

export const obtenerPublico = async (id: number): Promise<ProductoPublicoDto> =>
  (await aPublicos([await exigirPublicado(id)]))[0] as ProductoPublicoDto

/** Publicados de la misma categoría o marca (404 si el producto no está publicado). */
export async function relacionados(id: number, limite: number): Promise<ProductoPublicoDto[]> {
  const producto = await exigirPublicado(id)
  return aPublicos(await repo.relacionados(producto, limite))
}

/** Lo que otro dominio necesita para vender un producto (§5); los ids inexistentes no aparecen. */
export interface ProductoVendible {
  id: number
  sku: string
  nombre: string
  /** Precio efectivo de hoy como string decimal (D-05): el de la oferta vigente o el base (L12). */
  precio: string
  publicado: boolean
}

export async function obtenerProductosVendibles(ids: number[]): Promise<ProductoVendible[]> {
  const unicos = [...new Set(ids)]
  const [filas, precios] = await Promise.all([repo.vendibles(unicos), precioEfectivo(unicos)])
  return filas.map((p) => ({ id: p.id, sku: p.sku, nombre: p.nombre, precio: precios.get(p.id)?.precio ?? importe(p.precio), publicado: p.publicado }))
}

/* ---------- Escritura ---------- */

export async function crear(datos: CrearProducto, usuarioId: number): Promise<ProductoAdminDto> {
  const { sku, categoria, marca, imagenes: urls, especificaciones, stock, controlLotes, lotes, ...resto } = datos
  const existencias: ExistenciasIniciales = controlLotes && lotes ? { controlLotes: true, lotes } : { controlLotes: false, stock }
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
    await registrarExistenciasIniciales(tx, id, existencias, usuarioId)
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
