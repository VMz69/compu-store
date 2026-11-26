import { ErrorApp } from '../04-pipeline-http/00-director-http.js'
import { obtenerProductosVendibles } from '../06-pipeline-catalogo/00-director-catalogo.js'
import { obtenerDisponibilidad } from '../07-pipeline-inventario/00-director-inventario.js'
import type { LineaCarrito } from './02-tienda.schema.js'
import * as repo from './04-tienda.repository.js'

/* ---------- Identidad pública ---------- */

export interface IdentidadDto {
  nombre: string
  eslogan: string
  ciudad: string
  pais: string
  direccion: string
  direccionCorta: string
  telefonos: string[]
  whatsapp: string
  correo: string
  horario: string
  horarioCorto: string
  acercaDe: string
  mision: string
  vision: string
  valores: string[]
  redes: Record<string, string>
  moneda: { codigo: string; simbolo: string; locale: string }
}

const listaTexto = (valor: unknown): string[] => (Array.isArray(valor) ? valor.filter((v): v is string => typeof v === 'string') : [])

const mapaTexto = (valor: unknown): Record<string, string> =>
  valor && typeof valor === 'object' && !Array.isArray(valor)
    ? Object.fromEntries(Object.entries(valor).filter((par): par is [string, string] => typeof par[1] === 'string'))
    : {}

export async function obtenerIdentidad(): Promise<IdentidadDto> {
  const c = await repo.configuracion()
  if (!c) throw new ErrorApp('NOT_FOUND', 404, 'La tienda aún no está configurada.')
  return {
    nombre: c.nombre,
    eslogan: c.eslogan,
    ciudad: c.ciudad,
    pais: c.pais,
    direccion: c.direccion,
    direccionCorta: c.direccionCorta,
    telefonos: listaTexto(c.telefonos),
    whatsapp: c.whatsapp,
    correo: c.correo,
    horario: c.horario,
    horarioCorto: c.horarioCorto,
    acercaDe: c.acercaDe,
    mision: c.mision,
    vision: c.vision,
    valores: listaTexto(c.valores),
    redes: mapaTexto(c.redes),
    moneda: { codigo: c.monedaCodigo, simbolo: c.monedaSimbolo, locale: c.monedaLocale },
  }
}

/* ---------- Validación del carrito (contratos-A §4.5) ---------- */

export type EstadoLinea = 'ok' | 'ajustada' | 'agotado' | 'no-disponible'

export interface LineaValidadaDto {
  productoId: number
  /** null si el producto no existe. */
  nombre: string | null
  /** null si el producto no existe o no está publicado. */
  precioUnitario: string | null
  cantidadSolicitada: number
  cantidadDisponible: number
  subtotal: string
  estado: EstadoLinea
}

export interface CarritoValidadoDto {
  lineas: LineaValidadaDto[]
  total: string
  valido: boolean
}

/** Importes en centavos enteros para no acumular errores de coma flotante. */
const aCentavos = (importe: string) => Math.round(Number(importe) * 100)
const aImporte = (centavos: number) => (centavos / 100).toFixed(2)

/**
 * Recalcula precios y existencias en el servidor antes de WhatsApp.
 * No reserva stock ni crea pedidos; ignora cualquier dato comercial del navegador.
 */
export async function validarCarrito(lineas: LineaCarrito[]): Promise<CarritoValidadoDto> {
  const ids = lineas.map((l) => l.productoId)
  const [productos, disponibilidad] = await Promise.all([obtenerProductosVendibles(ids), obtenerDisponibilidad(ids)])
  const porId = new Map(productos.map((p) => [p.id, p]))

  let totalCentavos = 0
  const validadas = lineas.map(({ productoId, cantidad }): LineaValidadaDto => {
    const producto = porId.get(productoId)
    const base = { productoId, nombre: producto?.nombre ?? null, cantidadSolicitada: cantidad }
    if (!producto?.publicado) {
      return { ...base, precioUnitario: null, cantidadDisponible: 0, subtotal: '0.00', estado: 'no-disponible' }
    }
    const disponible = disponibilidad.get(productoId) ?? 0
    const cantidadFinal = Math.min(cantidad, disponible)
    const estado: EstadoLinea = disponible === 0 ? 'agotado' : cantidadFinal < cantidad ? 'ajustada' : 'ok'
    const subtotal = aCentavos(producto.precio) * cantidadFinal
    totalCentavos += subtotal
    return { ...base, precioUnitario: producto.precio, cantidadDisponible: disponible, subtotal: aImporte(subtotal), estado }
  })

  return { lineas: validadas, total: aImporte(totalCentavos), valido: validadas.every((l) => l.estado === 'ok') }
}
