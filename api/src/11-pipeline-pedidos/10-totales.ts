import { Prisma } from '../../generated/prisma/client.js'

/**
 * Importes del pedido (L13), exactos en Decimal y redondeados a centavos con medio centavo hacia
 * arriba (como `ROUND` de MariaDB en el precio efectivo de L12). Todo con IVA incluido.
 * El navegador nunca envía importes: solo cantidades, descuentos y cargos.
 */
const D = Prisma.Decimal
const centavos = (valor: Prisma.Decimal) => valor.toDecimalPlaces(2, D.ROUND_HALF_UP)

export interface LineaACalcular {
  precioUnitario: string
  cantidad: number
  /** Porcentaje 0–100 como string decimal. */
  descuento: string
}

/** round(precio × cantidad × (100 − descuento) / 100, 2). */
export const importeLinea = ({ precioUnitario, cantidad, descuento }: LineaACalcular): string =>
  centavos(new D(precioUnitario).mul(cantidad).mul(new D(100).minus(descuento)).div(100)).toFixed(2)

/** Total = Σ importes de las líneas + Σ cargos. */
export function totalPedido(lineas: LineaACalcular[], cargos: { monto: string }[]): string {
  const productos = lineas.reduce((acc, l) => acc.plus(importeLinea(l)), new D(0))
  const extras = cargos.reduce((acc, c) => acc.plus(c.monto), new D(0))
  return centavos(productos.plus(extras)).toFixed(2)
}
