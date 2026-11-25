import { prisma } from '../03-pipeline-conexiones/00-director-conexiones.js'

/** Conteo de productos: todos (admin) o solo los publicados (tienda). */
const CONTEO_TODOS = { _count: { select: { productos: true } } } as const
const CONTEO_PUBLICADOS = { _count: { select: { productos: { where: { publicado: true } } } } } as const

interface Rango {
  skip: number
  take: number
}

/** Quita las claves `undefined` (PATCH parcial) para que Prisma solo actualice lo enviado. */
const definidos = <T extends object>(objeto: T) =>
  Object.fromEntries(Object.entries(objeto).filter(([, valor]) => valor !== undefined)) as {
    [K in keyof T]?: Exclude<T[K], undefined>
  }

/* ---------- Categorías ---------- */

export const listarCategorias = (rango: Rango, soloPublicados: boolean) => {
  const orden = { orderBy: { nombre: 'asc' as const }, ...rango }
  return Promise.all([
    soloPublicados
      ? prisma.categoria.findMany({ ...orden, include: CONTEO_PUBLICADOS })
      : prisma.categoria.findMany({ ...orden, include: CONTEO_TODOS }),
    prisma.categoria.count(),
  ])
}

export const buscarCategoria = (slug: string) => prisma.categoria.findUnique({ where: { slug }, include: CONTEO_TODOS })

/** Otra categoría con ese nombre (la intercalación de la BD ignora acentos y mayúsculas). */
export const categoriaConNombre = (nombre: string, exceptoSlug?: string) =>
  prisma.categoria.findFirst({ where: { nombre, ...(exceptoSlug ? { NOT: { slug: exceptoSlug } } : {}) }, select: { id: true } })

export const slugsDeCategoria = async (prefijo: string) =>
  (await prisma.categoria.findMany({ where: { slug: { startsWith: prefijo } }, select: { slug: true } })).map((c) => c.slug)

export const crearCategoria = (datos: { slug: string; nombre: string; icono: string; descripcion: string }) =>
  prisma.categoria.create({ data: datos, include: CONTEO_TODOS })

export const editarCategoria = (
  slug: string,
  datos: { nombre?: string | undefined; icono?: string | undefined; descripcion?: string | undefined },
) => prisma.categoria.update({ where: { slug }, data: definidos(datos), include: CONTEO_TODOS })

export const eliminarCategoria = (slug: string) => prisma.categoria.delete({ where: { slug } })

/* ---------- Marcas ---------- */

/** `publico`: solo marcas activas y conteo de productos publicados. */
export const listarMarcas = (rango: Rango, publico: boolean) => {
  const where = publico ? { activa: true } : {}
  const consulta = { where, orderBy: { nombre: 'asc' as const }, ...rango }
  return Promise.all([
    publico
      ? prisma.marca.findMany({ ...consulta, include: CONTEO_PUBLICADOS })
      : prisma.marca.findMany({ ...consulta, include: CONTEO_TODOS }),
    prisma.marca.count({ where }),
  ])
}

export const buscarMarca = (slug: string) => prisma.marca.findUnique({ where: { slug }, include: CONTEO_TODOS })

export const marcaConNombre = (nombre: string, exceptoSlug?: string) =>
  prisma.marca.findFirst({ where: { nombre, ...(exceptoSlug ? { NOT: { slug: exceptoSlug } } : {}) }, select: { id: true } })

export const slugsDeMarca = async (prefijo: string) =>
  (await prisma.marca.findMany({ where: { slug: { startsWith: prefijo } }, select: { slug: true } })).map((m) => m.slug)

export const crearMarca = (datos: { slug: string; nombre: string; sitioWeb: string | null; descripcion: string; activa: boolean }) =>
  prisma.marca.create({ data: datos, include: CONTEO_TODOS })

export const editarMarca = (
  slug: string,
  datos: {
    nombre?: string | undefined
    sitioWeb?: string | null | undefined
    descripcion?: string | undefined
    activa?: boolean | undefined
  },
) => prisma.marca.update({ where: { slug }, data: definidos(datos), include: CONTEO_TODOS })

export const eliminarMarca = (slug: string) => prisma.marca.delete({ where: { slug } })
