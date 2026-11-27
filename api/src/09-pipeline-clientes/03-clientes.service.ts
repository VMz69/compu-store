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

/** 409 si otro cliente (activo o no) ya tiene ese teléfono; el índice único es la red de seguridad. */
async function exigirTelefonoLibre(telefonoNormalizado: string, propioId?: number): Promise<void> {
  const otro = await repo.buscarPorTelefono(telefonoNormalizado)
  if (otro && otro.id !== propioId) throw new ErrorApp('CONFLICT', 409, 'Ya hay un cliente con este teléfono.')
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
  return aCliente(await repo.crear({ ...datos, telefonoNormalizado }))
}

export async function editarCliente(id: number, cambios: EditarCliente): Promise<ClienteDto> {
  const actual = await repo.buscarPorId(id)
  if (!actual) throw noExiste()
  validarDocumento(cambios.tipo ?? actual.tipo, cambios.documento === undefined ? actual.documento : cambios.documento)
  const telefonoNormalizado = cambios.telefono === undefined ? undefined : normalizarTelefono(cambios.telefono)
  if (telefonoNormalizado !== undefined) await exigirTelefonoLibre(telefonoNormalizado, id)
  return aCliente(await repo.actualizar(id, { ...cambios, telefonoNormalizado }))
}

/** Borrado real: aún no hay pedidos en la BD. En L13, un cliente con pedidos pasa a eliminación lógica. */
export async function eliminarCliente(id: number): Promise<void> {
  if (!(await repo.buscarPorId(id))) throw noExiste()
  await repo.eliminar(id)
}
