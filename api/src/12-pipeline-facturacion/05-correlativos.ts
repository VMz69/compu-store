import { ErrorApp } from '../04-pipeline-http/00-director-http.js'
import type { Tx } from './04-facturas.repository.js'

/**
 * Correlativos sin huecos ni duplicados (D-12, L15): una fila por secuencia en `correlativos`, bloqueada con
 * `SELECT … FOR UPDATE` dentro de la transacción del documento. Si la transacción se revierte, el número
 * vuelve con ella (no hay huecos); una factura anulada conserva el suyo (nunca se reutiliza). L16 añade la
 * secuencia de cotizaciones.
 */

export const FACTURA_CONTROL = 'factura-control'
export const FACTURA_INTERNO = 'factura-interno'

/** Prefijo del número de control: DTE-01 (Factura) · establecimiento M001 · punto de venta P001 (= `CONTROL_PREFIX`). */
export const PREFIJO_CONTROL = 'DTE-01-M001P001-'
/** El correlativo interno se imprime con 6 dígitos. */
export const MAX_INTERNO = 999_999

export const numeroControl = (n: number) => `${PREFIJO_CONTROL}${String(n).padStart(15, '0')}`
export const textoInterno = (n: number) => String(n).padStart(6, '0')

/**
 * Toma el siguiente número de la secuencia: máx(último + 1, semilla). La semilla (Ajustes › Identidad)
 * solo puede adelantar la numeración, nunca repetir un número.
 */
export async function siguiente(tx: Tx, clave: string, semilla: number | null = null, maximo = Number.MAX_SAFE_INTEGER): Promise<number> {
  const [fila] = await tx.$queryRaw<{ ultimo: number | bigint }[]>`SELECT ultimo FROM correlativos WHERE clave = ${clave} FOR UPDATE`
  if (!fila) throw new Error(`Falta la secuencia «${clave}» (migración facturacion).`)
  const numero = Math.max(Number(fila.ultimo) + 1, semilla ?? 0)
  if (numero > maximo) throw new ErrorApp('BUSINESS_RULE', 422, 'Se agotó la numeración de facturas: revisa la semilla en Ajustes › Identidad.')
  await tx.correlativo.update({ where: { clave }, data: { ultimo: numero } })
  return numero
}
