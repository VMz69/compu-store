import { ErrorApp, meta, type MetaPaginacion, type Paginacion } from '../04-pipeline-http/00-director-http.js'
import { PATRON_DUI, PATRON_NIT, type CrearCliente, type EditarCliente, type TipoCliente } from './02-clientes.schema.js'
import * as repo from './04-clientes.repository.js'
import type { ClienteFila, FiltroClientes } from './04-clientes.repository.js'

/** Contrato del cliente (L11). El admin lo traduce a `Customer` (id `CLI-###`). */
export interface ClienteDto {
  id: number
  tipo: TipoCliente
  nombre: string
  documento: string | null
  telefono: string
  correo: string | null
  ciudad: string
  direccion: string
  notas: string
  activo: boolean
  creadoEn: string
}

const aCliente = (c: ClienteFila): ClienteDto => ({
  id: c.id,
  tipo: c.tipo,
  nombre: c.nombre,
  documento: c.documento,
  telefono: c.telefono,
  correo: c.correo,
  ciudad: c.ciudad,
  direccion: c.direccion,
  notas: c.notas,
  activo: c.activo,
  creadoEn: c.creadoEn.toISOString(),
})

/** Solo dígitos: "7488-9922" y "74889922" son el mismo teléfono (`normalizePhone` del admin). */
export const normalizarTelefono = (telefono: string): string => telefono.replace(/\D/g, '')

const noExiste = () => new ErrorApp('NOT_FOUND', 404, 'El cliente no existe.')

/** DUI para personas y NIT para empresas; se valida con el tipo resultante (también al editar). */
function validarDocumento(tipo: TipoCliente, documento: string | null): void {
  if (!documento) return
  const valido = tipo === 'empresa' ? PATRON_NIT.test(documento) : PATRON_DUI.test(documento)
  if (valido) return
  const mensaje = tipo === 'empresa' ? 'Formato NIT: 0614-250318-102-3' : 'Formato DUI: 01234567-8'
  throw new ErrorApp('VALIDATION_ERROR', 400, 'Datos inválidos.', [{ campo: 'documento', mensaje }])
}

/** 409 si otro cliente (activo, inactivo o eliminado) ya tiene ese teléfono; el índice único es la red de seguridad. */
async function exigirTelefonoLibre(telefonoNormalizado: string, propioId?: number): Promise<void> {
  const otro = await repo.buscarPorTelefono(telefonoNormalizado)
  if (!otro || otro.id === propioId) return
  throw new ErrorApp(
    'CONFLICT',
    409,
    otro.eliminadoEn ? 'Este teléfono pertenece a un cliente eliminado.' : 'Ya hay un cliente con este teléfono.',
  )
}

/** 409 si otro cliente (activo o no) ya tiene ese DUI o NIT; el índice único es la red de seguridad. */
async function exigirDocumentoLibre(tipo: TipoCliente, documento: string | null, propioId?: number): Promise<void> {
  if (!documento) return
  const otro = await repo.buscarPorDocumento(documento)
  if (!otro || otro.id === propioId) return
  const clase = tipo === 'empresa' ? 'NIT' : 'DUI'
  throw new ErrorApp(
    'CONFLICT',
    409,
    otro.eliminadoEn ? `Este ${clase} pertenece a un cliente eliminado.` : `Ya hay un cliente con este ${clase}.`,
  )
}

export async function listarClientes(
  filtro: FiltroClientes,
  paginacion: Paginacion,
): Promise<{ data: ClienteDto[]; meta: MetaPaginacion }> {
  const [filas, total] = await repo.listar(filtro, paginacion)
  return { data: filas.map(aCliente), meta: meta(paginacion, total) }
}

export async function obtenerCliente(id: number): Promise<ClienteDto> {
  const cliente = await repo.buscarPorId(id)
  if (!cliente) throw noExiste()
  return aCliente(cliente)
}

export async function crearCliente(datos: CrearCliente): Promise<ClienteDto> {
  validarDocumento(datos.tipo, datos.documento)
  const telefonoNormalizado = normalizarTelefono(datos.telefono)
  await exigirTelefonoLibre(telefonoNormalizado)
  await exigirDocumentoLibre(datos.tipo, datos.documento)
  return aCliente(await repo.crear({ ...datos, telefonoNormalizado }))
}

export async function editarCliente(id: number, cambios: EditarCliente): Promise<ClienteDto> {
  const actual = await repo.buscarPorId(id)
  if (!actual) throw noExiste()
  const tipo = cambios.tipo ?? actual.tipo
  const documento = cambios.documento === undefined ? actual.documento : cambios.documento
  validarDocumento(tipo, documento)
  const telefonoNormalizado = cambios.telefono === undefined ? undefined : normalizarTelefono(cambios.telefono)
  if (telefonoNormalizado !== undefined) await exigirTelefonoLibre(telefonoNormalizado, id)
  await exigirDocumentoLibre(tipo, documento, id)
  return aCliente(await repo.actualizar(id, { ...cambios, telefonoNormalizado }))
}

/** Con pedidos, eliminación lógica; sin pedidos, borrado real (L13). */
export async function eliminarCliente(id: number): Promise<void> {
  if (!(await repo.buscarPorId(id))) throw noExiste()
  await repo.eliminar(id)
}

/** Datos que necesita un pedido (L13): también de clientes inactivos o eliminados, para que el pedido decida. */
export interface ClienteParaPedido {
  id: number
  nombre: string
  telefono: string
  correo: string | null
  /** L16: la cotización lo copia en su snapshot. */
  documento: string | null
  activo: boolean
  eliminado: boolean
}

export async function obtenerClienteParaPedido(id: number): Promise<ClienteParaPedido | null> {
  const c = await repo.buscarCualquiera(id)
  if (!c) return null
  return {
    id: c.id,
    nombre: c.nombre,
    telefono: c.telefono,
    correo: c.correo,
    documento: c.documento,
    activo: c.activo,
    eliminado: c.eliminadoEn !== null,
  }
}
