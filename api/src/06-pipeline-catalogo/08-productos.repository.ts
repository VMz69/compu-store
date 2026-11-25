import { prisma } from '../03-pipeline-conexiones/00-director-conexiones.js'
import type { CondicionProducto, Prisma } from '../../generated/prisma/client.js'

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
