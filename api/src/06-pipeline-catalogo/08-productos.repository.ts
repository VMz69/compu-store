import { prisma } from '../03-pipeline-conexiones/00-director-conexiones.js'
import { Prisma, type CondicionProducto } from '../../generated/prisma/client.js'
import { sqlPrecioVigente } from '../10-pipeline-ofertas/00-director-ofertas.js'
import type { OrdenTienda } from './06-productos.schema.js'

/** Cliente de Prisma dentro o fuera de una transacción. */
export type Tx = Prisma.TransactionClient

/** Relaciones que forman el contrato del producto (contratos-A §4.1 y §4.2). */
const DETALLE = {
  categoria: { select: { slug: true, nombre: true } },
  marca: { select: { slug: true, nombre: true } },
  imagenes: { orderBy: { orden: 'asc' } },
  especificaciones: { orderBy: { orden: 'asc' } },
  lotes: { orderBy: { id: 'asc' } },
} as const satisfies Prisma.ProductoInclude

export type ProductoDetalle = Prisma.ProductoGetPayload<{ include: typeof DETALLE }>

interface Rango {
  skip: number
  take: number
}

/** Columnas escalares que se escriben desde el admin. */
export interface DatosProducto {
  nombre?: string
  sku?: string
  categoriaId?: number
  marcaId?: number
  modelo?: string
  condicion?: CondicionProducto
  costo?: string | null
  precio?: string
  precioAnterior?: string | null
  tasaIva?: string
  puntoReorden?: number
  publicado?: boolean
  descripcion?: string
  compatibilidad?: string
  conectividad?: string
}

export interface ImagenNueva {
  url: string
  publicId: string | null
}

export interface EspecificacionNueva {
  clave: string
  valor: string
}

/* ---------- Lectura ---------- */

/** Más recientes primero; `soloPublicados` para la tienda. */
export const listar = (rango: Rango, soloPublicados: boolean) => {
  const where = soloPublicados ? { publicado: true } : {}
  return Promise.all([
    prisma.producto.findMany({ where, include: DETALLE, orderBy: { id: 'desc' }, ...rango }),
    prisma.producto.count({ where }),
  ])
}

/* ---------- Tienda: búsqueda, filtros y orden ---------- */

export type Orden = OrdenTienda

export interface FiltrosTienda {
  q?: string | undefined
  categoria?: string | undefined
  marca?: string | undefined
  ofertas: boolean
}

/** Precio y precio anterior efectivos de hoy (L12): los de la oferta vigente, o los del producto. */
type Vigente = ReturnType<typeof sqlPrecioVigente>

/**
 * Desempate por id para que la paginación sea estable. `<=>` evita que una etiqueta NULL quede al final.
 * Precio y descuento se ordenan por los valores efectivos, los mismos que muestra la tienda.
 */
const ordenSql = (orden: Orden, { precio, precioAnterior }: Vigente): Prisma.Sql =>
  ({
    destacados: Prisma.sql`(p.etiqueta <=> 'Destacado') DESC, p.id ASC`,
    'precio-asc': Prisma.sql`${precio} ASC, p.id ASC`,
    'precio-desc': Prisma.sql`${precio} DESC, p.id ASC`,
    descuento: Prisma.sql`(CASE WHEN ${precioAnterior} > ${precio} THEN ${precioAnterior} - ${precio} ELSE 0 END) DESC, p.id ASC`,
    'nombre-asc': Prisma.sql`p.nombre ASC, p.id ASC`,
  })[orden]

/** Escapa los comodines de LIKE para que `%` y `_` se busquen literalmente. */
const patronLike = (texto: string) => `%${texto.replace(/[\\%_]/g, (c) => `\\${c}`)}%`

/**
 * WHERE del listado público. La intercalación utf8mb4_unicode_ci hace que LIKE
 * ignore mayúsculas y acentos. Todos los valores van parametrizados.
 */
function condicionesTienda({ q, categoria, marca, ofertas }: FiltrosTienda, { precio, precioAnterior }: Vigente): Prisma.Sql {
  const condiciones = [Prisma.sql`p.publicado = TRUE`]
  if (categoria) condiciones.push(Prisma.sql`c.slug = ${categoria}`)
  if (marca) condiciones.push(Prisma.sql`m.slug = ${marca}`)
  if (ofertas) condiciones.push(Prisma.sql`${precioAnterior} IS NOT NULL AND ${precioAnterior} > ${precio}`)
  if (q) {
    const patron = patronLike(q)
    condiciones.push(Prisma.sql`(
      p.nombre LIKE ${patron} OR p.descripcion LIKE ${patron}
      OR c.nombre LIKE ${patron} OR c.slug LIKE ${patron}
      OR m.nombre LIKE ${patron} OR m.slug LIKE ${patron}
      OR EXISTS (SELECT 1 FROM especificaciones e
                 WHERE e.productoId = p.id AND (e.clave LIKE ${patron} OR e.valor LIKE ${patron}))
    )`)
  }
  return Prisma.join(condiciones, ' AND ')
}

const desdeTienda = (vigente: Vigente) => Prisma.sql`FROM productos p
  JOIN categorias c ON c.id = p.categoriaId
  JOIN marcas m ON m.id = p.marcaId
  ${vigente.join}`

/** Ids de la página pedida, en el orden solicitado (`hoy` decide qué ofertas rigen). */
export async function idsPublicos(filtros: FiltrosTienda, orden: Orden, rango: Rango, hoy: string): Promise<number[]> {
  const vigente = sqlPrecioVigente(hoy)
  const filas = await prisma.$queryRaw<{ id: number }[]>`
    SELECT p.id ${desdeTienda(vigente)}
    WHERE ${condicionesTienda(filtros, vigente)}
    ORDER BY ${ordenSql(orden, vigente)}
    LIMIT ${rango.take} OFFSET ${rango.skip}`
  return filas.map((fila) => Number(fila.id))
}

export async function contarPublicos(filtros: FiltrosTienda, hoy: string): Promise<number> {
  const vigente = sqlPrecioVigente(hoy)
  const [fila] = await prisma.$queryRaw<{ total: number | bigint }[]>`
    SELECT COUNT(*) AS total ${desdeTienda(vigente)}
    WHERE ${condicionesTienda(filtros, vigente)}`
  return Number(fila?.total ?? 0)
}

/** Detalle de varios productos, en el orden de `ids`. */
export async function buscarVarios(ids: number[]): Promise<ProductoDetalle[]> {
  if (ids.length === 0) return []
  const filas = await prisma.producto.findMany({ where: { id: { in: ids } }, include: DETALLE })
  const porId = new Map(filas.map((fila) => [fila.id, fila]))
  return ids.flatMap((id) => porId.get(id) ?? [])
}

/** Publicados de la misma categoría o marca, sin el propio producto (regla de `getRelatedProducts` del store). */
export const relacionados = (producto: { id: number; categoriaId: number; marcaId: number }, limite: number) =>
  prisma.producto.findMany({
    where: {
      publicado: true,
      id: { not: producto.id },
      OR: [{ categoriaId: producto.categoriaId }, { marcaId: producto.marcaId }],
    },
    include: DETALLE,
    orderBy: { id: 'asc' },
    take: limite,
  })

/** Datos mínimos para vender (§5): los ids inexistentes no aparecen. */
export const vendibles = (ids: number[]) =>
  ids.length === 0
    ? Promise.resolve([])
    : prisma.producto.findMany({
        where: { id: { in: ids } },
        select: { id: true, sku: true, nombre: true, precio: true, publicado: true },
      })

export const buscar = (id: number, cliente: Tx = prisma) => cliente.producto.findUnique({ where: { id }, include: DETALLE })

export const categoriaPorSlug = (slug: string) => prisma.categoria.findUnique({ where: { slug }, select: { id: true } })

export const marcaPorSlug = (slug: string) => prisma.marca.findUnique({ where: { slug }, select: { id: true, activa: true } })

/** Otro producto con ese SKU (la intercalación de la BD ignora mayúsculas). */
export const productoConSku = (sku: string, exceptoId?: number) =>
  prisma.producto.findFirst({ where: { sku, ...(exceptoId ? { NOT: { id: exceptoId } } : {}) }, select: { id: true } })

export const slugsDeProducto = async (prefijo: string) =>
  (await prisma.producto.findMany({ where: { slug: { startsWith: prefijo } }, select: { slug: true } })).map((p) => p.slug)

export const contarMovimientos = (productoId: number) => prisma.movimientoInventario.count({ where: { productoId } })

/* ---------- Escritura (dentro de una transacción) ---------- */

export const crear = (tx: Tx, datos: Required<Omit<DatosProducto, 'publicado'>> & { slug: string; publicado: boolean }) =>
  tx.producto.create({ data: datos, select: { id: true } })

export const actualizar = (tx: Tx, id: number, datos: DatosProducto) => tx.producto.update({ where: { id }, data: datos })

/** Reemplaza la galería completa; el orden del arreglo es el orden de la galería (0 = portada). */
export async function reemplazarImagenes(tx: Tx, productoId: number, imagenes: ImagenNueva[]) {
  await tx.imagenProducto.deleteMany({ where: { productoId } })
  if (imagenes.length > 0) {
    await tx.imagenProducto.createMany({ data: imagenes.map((img, orden) => ({ productoId, orden, ...img })) })
  }
}

export async function reemplazarEspecificaciones(tx: Tx, productoId: number, especificaciones: EspecificacionNueva[]) {
  await tx.especificacion.deleteMany({ where: { productoId } })
  if (especificaciones.length > 0) {
    await tx.especificacion.createMany({ data: especificaciones.map((e, orden) => ({ productoId, orden, ...e })) })
  }
}

export const eliminar = (tx: Tx, id: number) => tx.producto.delete({ where: { id } })

export const transaccion = <T>(trabajo: (tx: Tx) => Promise<T>) => prisma.$transaction(trabajo)

/* ---------- Imágenes pendientes (subidas a Cloudinary sin producto) ---------- */

export const crearPendiente = (datos: { publicId: string; url: string }) =>
  prisma.imagenPendiente.create({ data: datos, select: { id: true, url: true } })

export const buscarPendiente = (id: number) => prisma.imagenPendiente.findUnique({ where: { id } })

export const pendientesPorUrl = (tx: Tx, urls: string[]) =>
  urls.length === 0 ? Promise.resolve([]) : tx.imagenPendiente.findMany({ where: { url: { in: urls } } })

export const consumirPendientes = (tx: Tx, ids: number[]) =>
  ids.length === 0 ? Promise.resolve() : tx.imagenPendiente.deleteMany({ where: { id: { in: ids } } }).then(() => undefined)

export const pendientesAnterioresA = (fecha: Date, limite: number) =>
  prisma.imagenPendiente.findMany({ where: { creadaEn: { lt: fecha } }, orderBy: { creadaEn: 'asc' }, take: limite })

export const borrarPendientes = (ids: number[]) => prisma.imagenPendiente.deleteMany({ where: { id: { in: ids } } })

/** Vuelve a encolar imágenes que no se pudieron destruir, con una fecha ya vencida para el próximo barrido. */
export const reencolar = (imagenes: { publicId: string; url: string }[], creadaEn: Date) =>
  prisma.imagenPendiente.createMany({ data: imagenes.map((img) => ({ ...img, creadaEn })), skipDuplicates: true })
