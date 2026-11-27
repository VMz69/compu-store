import { obtenerProductosVendibles, type ProductoVendible } from '../06-pipeline-catalogo/00-director-catalogo.js'
import { liberar, moverReserva, obtenerDisponibilidad } from '../07-pipeline-inventario/00-director-inventario.js'
import { obtenerClienteParaPedido } from '../09-pipeline-clientes/00-director-clientes.js'
import { ErrorApp, meta, type MetaPaginacion, type Paginacion } from '../04-pipeline-http/00-director-http.js'
import type { EstadoPedido } from './02-ajustes-ventas.schema.js'
import * as ajustes from './04-ajustes-ventas.repository.js'
import { motivoNoEditable, motivoNoEliminable, puedeTransicionar } from './05-flujo.js'
import type { CambioEstado, DatosPedido } from './07-pedidos.schema.js'
import * as repo from './09-pedidos.repository.js'
import type { ContenidoPedido, PedidoFila, Tx } from './09-pedidos.repository.js'
import { importeLinea, totalPedido } from './10-totales.js'
import { alDia, errorStock, reservarEnTx } from './11-reservas.service.js'

/** Quien opera (el nombre queda como snapshot en el historial; nunca el `by` del navegador). */
export interface Operador {
  id: number
  nombre: string
}

/** Contrato del pedido (L13). El admin lo traduce a `Order` (id `ORD-AAAA-###`). Dinero como string (D-05). */
export interface PedidoDto {
  id: number
  cliente: { id: number | null; nombre: string; telefono: string; correo: string }
  ciudad: string
  /** Nombre actual del canal (por la FK): renombrar un canal se refleja en sus pedidos. */
  canal: { id: number; nombre: string }
  formaPago: string
  formaEntrega: string
  notas: string
  estado: EstadoPedido
  /** Último día de la reserva (`YYYY-MM-DD`, inclusive) mientras está Reservado (L14). */
  reservadoHasta: string | null
  /** Factura activa que cerró la venta (L15); null si no tiene o si se anuló. */
  factura: { id: number; numeroControl: string; correlativo: number } | null
  lineas: { productoId: number; sku: string; nombre: string; cantidad: number; precioUnitario: string; descuento: string; importe: string }[]
  cargos: { id: number; concepto: string; monto: string }[]
  total: string
  creadoEn: string
  historial: { estado: EstadoPedido; fecha: string; por: string; nota: string | null }[]
}

const aPedido = (p: PedidoFila): PedidoDto => ({
  id: p.id,
  cliente: { id: p.clienteId, nombre: p.clienteNombre, telefono: p.clienteTelefono, correo: p.clienteCorreo },
  ciudad: p.ciudad,
  canal: { id: p.canalId, nombre: p.canal.nombre },
  formaPago: p.formaPago,
  formaEntrega: p.formaEntrega,
  notas: p.notas,
  estado: p.estado,
  reservadoHasta: p.reservadoHasta ? p.reservadoHasta.toISOString().slice(0, 10) : null,
  factura: p.facturas[0] ?? null,
  lineas: p.lineas.map((l) => ({
    productoId: l.productoId,
    sku: l.sku,
    nombre: l.nombre,
    cantidad: l.cantidad,
    precioUnitario: l.precioUnitario.toFixed(2),
    descuento: l.descuento.toFixed(2),
    importe: l.importe.toFixed(2),
  })),
  cargos: p.cargos.map((c) => ({ id: c.id, concepto: c.concepto, monto: c.monto.toFixed(2) })),
  total: p.total.toFixed(2),
  creadoEn: p.creadoEn.toISOString(),
  historial: p.historial.map((e) => ({ estado: e.estado, fecha: e.fecha.toISOString(), por: e.por, nota: e.nota })),
})

const noExiste = () => new ErrorApp('NOT_FOUND', 404, 'El pedido no existe o fue eliminado.')
const regla = (mensaje: string, details?: unknown) => new ErrorApp('BUSINESS_RULE', 422, mensaje, details)

/** Nombre visible de cada estado (etiquetas configurables de Ajustes). */
async function nombresEstado(): Promise<Record<EstadoPedido, string>> {
  const filas = await ajustes.listarEtiquetas()
  return Object.fromEntries(filas.map((f) => [f.estado, f.nombre])) as Record<EstadoPedido, string>
}

/* ---------- Reglas al armar el contenido ---------- */

/** Un canal nuevo para el pedido debe existir y estar activo. */
async function canalAsignable(canalId: number): Promise<{ id: number; nombre: string }> {
  const canal = await ajustes.buscarCanal(canalId)
  if (!canal) throw regla('El canal de venta no existe.')
  if (!canal.activo) throw regla(`El canal "${canal.nombre}" está inactivo: elige otro.`)
  return canal
}

type SnapshotCliente = Pick<ContenidoPedido, 'clienteId' | 'clienteNombre' | 'clienteTelefono' | 'clienteCorreo'>

/** Cliente del directorio (snapshot desde la BD, activo y no eliminado) u ocasional (del cuerpo). */
async function clienteAsignable(datos: DatosPedido): Promise<SnapshotCliente> {
  if (datos.clienteId === null) {
    const ocasional = datos.cliente as NonNullable<DatosPedido['cliente']>
    return { clienteId: null, clienteNombre: ocasional.nombre, clienteTelefono: ocasional.telefono, clienteCorreo: ocasional.correo }
  }
  const cliente = await obtenerClienteParaPedido(datos.clienteId)
  if (!cliente) throw regla('El cliente no existe.')
  if (cliente.eliminado) throw regla('El cliente fue eliminado del directorio.')
  if (!cliente.activo) throw regla(`El cliente ${cliente.nombre} está inactivo.`)
  return { clienteId: cliente.id, clienteNombre: cliente.nombre, clienteTelefono: cliente.telefono, clienteCorreo: cliente.correo ?? '' }
}

interface Catalogo {
  vendibles: Map<number, ProductoVendible>
  disponibles: Map<number, number>
}

async function leerCatalogo(datos: DatosPedido): Promise<Catalogo> {
  const ids = datos.lineas.map((l) => l.productoId)
  const [vendibles, disponibles] = await Promise.all([obtenerProductosVendibles(ids), obtenerDisponibilidad(ids)])
  return { vendibles: new Map(vendibles.map((p) => [p.id, p])), disponibles }
}

type Previa = { sku: string; nombre: string; precioUnitario: string }

/**
 * Líneas con precio del servidor: las que ya estaban en el pedido conservan su snapshot (SKU, nombre y
 * precio, aunque cambie la cantidad); las nuevas toman el precio efectivo de hoy (L12).
 * 422 si un producto no existe o la cantidad supera el disponible. Un pedido reservado (`conReserva`)
 * valida el stock al mover su reserva, con las filas bloqueadas (L14).
 */
function armarLineas(
  datos: DatosPedido,
  { vendibles, disponibles }: Catalogo,
  previas: Map<number, Previa>,
  conReserva = false,
): ContenidoPedido['lineas'] {
  const faltantes = datos.lineas.filter((l) => !previas.has(l.productoId) && !vendibles.has(l.productoId))
  if (faltantes.length > 0) {
    throw regla(
      'Hay productos que ya no existen.',
      faltantes.map((l) => ({ campo: `lineas.${l.productoId}`, mensaje: 'El producto no existe.' })),
    )
  }
  const cortas = conReserva
    ? []
    : datos.lineas
        .map((l) => ({ productoId: l.productoId, cantidad: l.cantidad, disponible: disponibles.get(l.productoId) ?? 0 }))
        .filter(({ cantidad, disponible }) => cantidad > disponible)
  if (cortas.length > 0) throw errorStock(cortas)
  return datos.lineas.map((l) => {
    const previa = previas.get(l.productoId)
    const producto = vendibles.get(l.productoId) as ProductoVendible
    const base = previa ?? { sku: producto.sku, nombre: producto.nombre, precioUnitario: producto.precio }
    return { productoId: l.productoId, ...base, cantidad: l.cantidad, descuento: l.descuento, importe: importeLinea({ ...base, ...l }) }
  })
}

function contenido(
  datos: DatosPedido,
  cliente: SnapshotCliente,
  canal: { id: number; nombre: string },
  lineas: ContenidoPedido['lineas'],
): ContenidoPedido {
  return {
    ...cliente,
    ciudad: datos.ciudad,
    canalId: canal.id,
    canalNombre: canal.nombre,
    formaPago: datos.formaPago,
    formaEntrega: datos.formaEntrega,
    notas: datos.notas,
    lineas,
    cargos: datos.cargos,
    total: totalPedido(lineas, datos.cargos),
  }
}

/* ---------- Lectura ---------- */

export async function listarPedidos(
  estado: EstadoPedido | undefined,
  paginacion: Paginacion,
): Promise<{ data: PedidoDto[]; meta: MetaPaginacion }> {
  const [filas, total] = await repo.listar(estado, paginacion)
  return { data: filas.map(aPedido), meta: meta(paginacion, total) }
}

export async function obtenerPedido(id: number): Promise<PedidoDto> {
  const pedido = await repo.buscar(id)
  if (!pedido) throw noExiste()
  return aPedido(pedido)
}

/* ---------- Escritura ---------- */

export async function crearPedido(datos: DatosPedido, operador: Operador): Promise<PedidoDto> {
  const canal = await canalAsignable(datos.canalId)
  const cliente = await clienteAsignable(datos)
  const lineas = armarLineas(datos, await leerCatalogo(datos), new Map())
  const id = await repo.transaccion((tx) =>
    repo.crear(tx, contenido(datos, cliente, canal, lineas), { estado: 'registrado', usuarioId: operador.id, por: operador.nombre }),
  )
  return obtenerPedido(id)
}

/** Pedido vigente bloqueado hasta el final de la transacción; si su reserva caducó, se vence en línea (D-07). */
async function bloquearAlDia(tx: Tx, id: number) {
  const fila = await repo.bloquear(tx, id)
  if (!fila) throw noExiste()
  return alDia(tx, fila)
}

/** Como `bloquearAlDia`, con el detalle completo. */
async function bloqueado(tx: Tx, id: number): Promise<PedidoFila> {
  await bloquearAlDia(tx, id)
  return (await repo.buscar(id, tx)) as PedidoFila
}

const reservaDe = (lineas: { productoId: number; cantidad: number }[]) => lineas.map(({ productoId, cantidad }) => ({ productoId, cantidad }))

/**
 * Reemplaza los datos editables de un pedido sin factura. Conserva id, fecha, estado e historial;
 * el canal y el cliente que ya tenía se conservan aunque hoy estén inactivos.
 */
export async function editarPedido(id: number, datos: DatosPedido, operador: Operador): Promise<PedidoDto> {
  const catalogo = await leerCatalogo(datos)
  const nombres = await nombresEstado()
  await repo.transaccion(async (tx) => {
    const actual = await bloqueado(tx, id)
    const motivo = motivoNoEditable(actual.estado, nombres[actual.estado])
    if (motivo) throw regla(motivo)
    const canal = datos.canalId === actual.canalId ? { id: actual.canalId, nombre: actual.canalNombre } : await canalAsignable(datos.canalId)
    const cliente: SnapshotCliente =
      datos.clienteId !== null && datos.clienteId === actual.clienteId
        ? { clienteId: actual.clienteId, clienteNombre: actual.clienteNombre, clienteTelefono: actual.clienteTelefono, clienteCorreo: actual.clienteCorreo }
        : await clienteAsignable(datos)
    const previas = new Map(actual.lineas.map((l) => [l.productoId, { sku: l.sku, nombre: l.nombre, precioUnitario: l.precioUnitario.toFixed(2) }]))
    const reservado = actual.estado === 'confirmado'
    const nuevo = contenido(datos, cliente, canal, armarLineas(datos, catalogo, previas, reservado))
    if (reservado) {
      // La reserva pasa de las líneas anteriores a las nuevas; el disponible excluye al propio pedido.
      const faltantes = await moverReserva(tx, reservaDe(actual.lineas), reservaDe(nuevo.lineas))
      if (faltantes.length > 0) throw errorStock(faltantes)
    }
    const antes = actual.total.toFixed(2)
    const nota = nuevo.total === antes ? 'Pedido editado' : `Pedido editado · total ${antes} → ${nuevo.total}`
    await repo.reemplazar(tx, id, nuevo, { estado: actual.estado, usuarioId: operador.id, por: operador.nombre, nota })
  })
  return obtenerPedido(id)
}

/** Cancelar o entregar (L13). Las transiciones inválidas se rechazan con 422. Cancelar un reservado libera su stock. */
export async function cambiarEstado(id: number, { estado, nota }: CambioEstado, operador: Operador): Promise<PedidoDto> {
  const nombres = await nombresEstado()
  await repo.transaccion(async (tx) => {
    const actual = await bloquearAlDia(tx, id)
    if (!puedeTransicionar(actual.estado, estado)) {
      throw regla(`No se puede pasar de "${nombres[actual.estado]}" a "${nombres[estado]}".`)
    }
    if (actual.estado === 'confirmado') await liberar(tx, reservaDe(await repo.lineasDe(tx, id)))
    await repo.cambiarEstado(tx, id, { estado, usuarioId: operador.id, por: operador.nombre, ...(nota ? { nota } : {}) })
  })
  return obtenerPedido(id)
}

/** Eliminación lógica: sale de listados y métricas, se conserva para auditoría y su id no se reutiliza. */
export async function eliminarPedido(id: number, motivo: string, operador: Operador): Promise<void> {
  const nombres = await nombresEstado()
  await repo.transaccion(async (tx) => {
    const actual = await bloquearAlDia(tx, id)
    const bloqueo = motivoNoEliminable(actual.estado, nombres[actual.estado])
    if (bloqueo) throw regla(bloqueo)
    if (actual.estado === 'confirmado') await liberar(tx, reservaDe(await repo.lineasDe(tx, id)))
    await repo.marcarEliminado(tx, id, motivo, {
      estado: actual.estado,
      usuarioId: operador.id,
      por: operador.nombre,
      nota: `Pedido eliminado · ${motivo}`,
    })
  })
}

/** «Confirmar y reservar» (L14): Registrado → Reservado hasta `hasta` (ver `11-reservas.service`). */
export async function reservarPedido(id: number, hasta: string, operador: Operador): Promise<PedidoDto> {
  await repo.transaccion((tx) => reservarEnTx(tx, id, hasta, operador))
  return obtenerPedido(id)
}
