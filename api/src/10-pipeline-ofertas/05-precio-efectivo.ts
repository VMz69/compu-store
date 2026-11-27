import { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../03-pipeline-conexiones/00-director-conexiones.js'

/**
 * Precio efectivo (L12): el ÚNICO cálculo del precio de oferta, para admin, tienda y carrito.
 * Se expresa en SQL sobre DECIMAL (aritmética exacta, redondeo a centavos) y todos los
 * consumidores lo reutilizan: el DTO del admin, los productos públicos, la validación del
 * carrito, el filtro y orden de la tienda, y las reglas al guardar una oferta.
 */

/** Las fechas de las ofertas son de calendario y se evalúan con el «hoy» del negocio (§10, L12). */
export const ZONA_HORARIA_NEGOCIO = 'America/El_Salvador'

const formatoFecha = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_HORARIA_NEGOCIO,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

/** Fecha de hoy en El Salvador, `YYYY-MM-DD`. */
export const hoyNegocio = (ahora: Date = new Date()): string => formatoFecha.format(ahora)

/**
 * Precio con el descuento aplicado, nunca negativo:
 * porcentaje → ROUND(precio × (100 − valor) / 100, 2) · monto → precio − valor (IVA incluido).
 */
export const sqlPrecioOferta = (precio: Prisma.Sql, tipo: Prisma.Sql, valor: Prisma.Sql): Prisma.Sql =>
  Prisma.sql`GREATEST(0, CASE ${tipo} WHEN 'porcentaje' THEN ROUND(${precio} * (100 - ${valor}) / 100, 2) ELSE ${precio} - ${valor} END)`

/** Condición «la oferta `o` rige hoy»: no pausada y dentro de su vigencia (ambas fechas inclusive). */
const rigeHoy = (alias: string, hoy: string) =>
  Prisma.sql`${Prisma.raw(alias)}.pausada = FALSE AND ${Prisma.raw(alias)}.inicio <= ${hoy} AND ${Prisma.raw(alias)}.fin >= ${hoy}`

/**
 * Subconsulta (productoId, ofertaId, precioOferta) de las ofertas que rigen hoy. Si un producto
 * tuviera dos (el solapamiento está prohibido), gana la de menor id.
 */
const sqlOfertasVigentes = (hoy: string) => Prisma.sql`(
  SELECT op.productoId, o.id AS ofertaId,
         ${sqlPrecioOferta(Prisma.sql`pv.precio`, Prisma.sql`o.tipoDescuento`, Prisma.sql`o.valor`)} AS precioOferta
  FROM ofertas_productos op
  JOIN ofertas o ON o.id = op.ofertaId
  JOIN productos pv ON pv.id = op.productoId
  WHERE ${rigeHoy('o', hoy)}
    AND NOT EXISTS (
      SELECT 1 FROM ofertas_productos op2 JOIN ofertas o2 ON o2.id = op2.ofertaId
      WHERE op2.productoId = op.productoId AND o2.id < o.id AND ${rigeHoy('o2', hoy)}
    )
)`

/**
 * Fragmentos para consultas de productos con alias `p`: el LEFT JOIN con la oferta vigente y las
 * expresiones del precio y el precio anterior efectivos (con oferta: precio de oferta y precio base).
 */
export const sqlPrecioVigente = (hoy: string = hoyNegocio()) => ({
  join: Prisma.sql`LEFT JOIN ${sqlOfertasVigentes(hoy)} ov ON ov.productoId = p.id`,
  precio: Prisma.sql`COALESCE(ov.precioOferta, p.precio)`,
  precioAnterior: Prisma.sql`(CASE WHEN ov.productoId IS NULL THEN p.precioAnterior ELSE p.precio END)`,
})

/** DECIMAL de una consulta cruda → string con 2 decimales (D-05). */
export const aImporte = (valor: unknown): string => new Prisma.Decimal(String(valor)).toFixed(2)

export interface PrecioEfectivo {
  /** Precio que se cobra hoy (con IVA). */
  precio: string
  precioBase: string
  /** Oferta que fija el precio, o null si rige el precio base. */
  ofertaId: number | null
}

/** Precio efectivo de cada producto existente (los ids inexistentes no aparecen). */
export async function precioEfectivo(ids: number[], hoy: string = hoyNegocio()): Promise<Map<number, PrecioEfectivo>> {
  if (ids.length === 0) return new Map()
  const vigente = sqlPrecioVigente(hoy)
  const filas = await prisma.$queryRaw<{ id: number; precioBase: unknown; precio: unknown; ofertaId: number | null }[]>`
    SELECT p.id, p.precio AS precioBase, ${vigente.precio} AS precio, ov.ofertaId
    FROM productos p ${vigente.join}
    WHERE p.id IN (${Prisma.join(ids)})`
  return new Map(
    filas.map((f) => [
      Number(f.id),
      { precio: aImporte(f.precio), precioBase: aImporte(f.precioBase), ofertaId: f.ofertaId === null ? null : Number(f.ofertaId) },
    ]),
  )
}

/** Precio de oferta de cada producto de las ofertas indicadas, con su precio base actual (DTO del admin). */
export async function preciosDeOfertas(ofertaIds: number[]): Promise<Map<number, { productoId: number; precioOferta: string }[]>> {
  const porOferta = new Map<number, { productoId: number; precioOferta: string }[]>()
  if (ofertaIds.length === 0) return porOferta
  const filas = await prisma.$queryRaw<{ ofertaId: number; productoId: number; precioOferta: unknown }[]>`
    SELECT op.ofertaId, op.productoId,
           ${sqlPrecioOferta(Prisma.sql`p.precio`, Prisma.sql`o.tipoDescuento`, Prisma.sql`o.valor`)} AS precioOferta
    FROM ofertas_productos op
    JOIN ofertas o ON o.id = op.ofertaId
    JOIN productos p ON p.id = op.productoId
    WHERE op.ofertaId IN (${Prisma.join(ofertaIds)})
    ORDER BY op.ofertaId, op.productoId`
  for (const f of filas) {
    const lista = porOferta.get(Number(f.ofertaId)) ?? []
    lista.push({ productoId: Number(f.productoId), precioOferta: aImporte(f.precioOferta) })
    porOferta.set(Number(f.ofertaId), lista)
  }
  return porOferta
}
