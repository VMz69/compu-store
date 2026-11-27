import { ErrorApp } from '../04-pipeline-http/00-director-http.js'
import { ESTADOS_PEDIDO, type CrearCanal, type EditarCanal, type EstadoPedido, type EtiquetaEstado } from './02-ajustes-ventas.schema.js'
import * as repo from './04-ajustes-ventas.repository.js'

/** Contrato del canal (L13). El admin lo traduce a `Channel`. */
export interface CanalDto {
  id: number
  nombre: string
  insignia: string
  icono: string
  color: string
  descripcion: string
  activo: boolean
  /** Pedidos que lo usan, incluidos los eliminados lógicamente (por eso no se puede eliminar). */
  totalPedidos: number
}

export interface EtiquetaEstadoDto {
  estado: EstadoPedido
  nombre: string
  descripcion: string
}

type CanalFila = Awaited<ReturnType<typeof repo.listarCanales>>[number]

const aCanal = (c: CanalFila): CanalDto => ({
  id: c.id,
  nombre: c.nombre,
  insignia: c.insignia,
  icono: c.icono,
  color: c.color,
  descripcion: c.descripcion,
  activo: c.activo,
  totalPedidos: c._count.pedidos,
})

const noExiste = () => new ErrorApp('NOT_FOUND', 404, 'El canal no existe.')

async function exigirNombreLibre(nombre: string, exceptoId?: number): Promise<void> {
  if (await repo.canalConNombre(nombre, exceptoId)) throw new ErrorApp('CONFLICT', 409, 'Ya existe un canal con ese nombre.')
}

/* ---------- Canales ---------- */

export const listarCanales = async (): Promise<CanalDto[]> => (await repo.listarCanales()).map(aCanal)

export async function crearCanal(datos: CrearCanal): Promise<CanalDto> {
  await exigirNombreLibre(datos.nombre)
  return aCanal(await repo.crearCanal(datos))
}

/** Renombrar no toca los pedidos: muestran el nombre actual por la FK y guardan el original como snapshot. */
export async function editarCanal(id: number, cambios: EditarCanal): Promise<CanalDto> {
  if (!(await repo.buscarCanal(id))) throw noExiste()
  if (cambios.nombre !== undefined) await exigirNombreLibre(cambios.nombre, id)
  return aCanal(await repo.actualizarCanal(id, cambios))
}

/** Un canal con pedidos (aun eliminados) no se elimina: se desactiva. La FK Restrict es la red de seguridad. */
export async function eliminarCanal(id: number): Promise<void> {
  const canal = await repo.buscarCanal(id)
  if (!canal) throw noExiste()
  const total = canal._count.pedidos
  if (total > 0) {
    throw new ErrorApp('CONFLICT', 409, `Tiene ${total} pedido(s). Desactívalo para que no se use en pedidos nuevos.`)
  }
  await repo.eliminarCanal(id)
}

/* ---------- Etiquetas de estado ---------- */

/** En el orden del flujo (cancelado al final). */
export async function listarEtiquetas(): Promise<EtiquetaEstadoDto[]> {
  const filas = await repo.listarEtiquetas()
  return ESTADOS_PEDIDO.flatMap((estado) => filas.filter((f) => f.estado === estado))
}

export async function guardarEtiqueta(estado: EstadoPedido, datos: EtiquetaEstado): Promise<EtiquetaEstadoDto> {
  if (await repo.etiquetaConNombre(datos.nombre, estado)) throw new ErrorApp('CONFLICT', 409, 'Otro estado ya usa ese nombre.')
  const fila = await repo.guardarEtiqueta(estado, datos.nombre, datos.descripcion)
  return { estado: fila.estado, nombre: fila.nombre, descripcion: fila.descripcion }
}
