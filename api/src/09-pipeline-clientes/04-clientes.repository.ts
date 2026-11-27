import type { Prisma } from '../../generated/prisma/client.js'
import { prisma } from '../03-pipeline-conexiones/00-director-conexiones.js'
import { rango, type Paginacion } from '../04-pipeline-http/00-director-http.js'
import type { TipoCliente } from './02-clientes.schema.js'

export type ClienteFila = Prisma.ClienteGetPayload<object>

export interface FiltroClientes {
  q: string
  tipo?: TipoCliente | undefined
  estado?: 'activos' | 'inactivos' | undefined
}

/** `CLI-003` (el id que muestra el admin) → 3. */
const idVisible = (termino: string): number | null => {
  const coincidencia = /^cli-(\d{1,9})$/i.exec(termino)
  return coincidencia ? Number(coincidencia[1]) : null
}

/**
 * Una palabra de la búsqueda, como `matchesQuery` del admin: coincide en nombre, correo, ciudad,
 * documento o teléfono; si son solo dígitos (≥ 3), también en el teléfono sin guiones.
 * La intercalación utf8mb4_unicode_ci ignora mayúsculas y acentos.
 */
function condicionTermino(termino: string): Prisma.ClienteWhereInput {
  // `contains` de Prisma no escapa los comodines de LIKE: `%` y `_` deben buscarse literalmente.
  const literal = termino.replace(/[\\%_]/g, (c) => `\\${c}`)
  const o: Prisma.ClienteWhereInput[] = [
    { nombre: { contains: literal } },
    { correo: { contains: literal } },
    { ciudad: { contains: literal } },
    { documento: { contains: literal } },
    { telefono: { contains: literal } },
  ]
  const digitos = /^[\d\s+-]+$/.test(termino) ? termino.replace(/\D/g, '') : ''
  if (digitos.length >= 3) o.push({ telefonoNormalizado: { contains: digitos } })
  const id = idVisible(termino)
  if (id !== null) o.push({ id })
  return { OR: o }
}

function donde({ q, tipo, estado }: FiltroClientes): Prisma.ClienteWhereInput {
  const terminos = q.split(/\s+/).filter(Boolean)
  return {
    ...(tipo && { tipo }),
    ...(estado && { activo: estado === 'activos' }),
    AND: terminos.map(condicionTermino),
  }
}

/** Página del directorio: los más recientes primero (como el admin). */
export async function listar(filtro: FiltroClientes, paginacion: Paginacion): Promise<[ClienteFila[], number]> {
  const where = donde(filtro)
  return prisma.$transaction([
    prisma.cliente.findMany({ where, orderBy: [{ creadoEn: 'desc' }, { id: 'desc' }], ...rango(paginacion) }),
    prisma.cliente.count({ where }),
  ])
}

export const buscarPorId = (id: number) => prisma.cliente.findUnique({ where: { id } })

export const buscarPorTelefono = (telefonoNormalizado: string) => prisma.cliente.findUnique({ where: { telefonoNormalizado } })

export const buscarPorDocumento = (documento: string) => prisma.cliente.findUnique({ where: { documento } })

export const crear =(data: Prisma.ClienteCreateInput) => prisma.cliente.create({ data })

/** Los campos `undefined` (no enviados) no se tocan. */
export function actualizar(id: number, cambios: Record<string, unknown>) {
  const data: Prisma.ClienteUpdateInput = Object.fromEntries(Object.entries(cambios).filter(([, valor]) => valor !== undefined))
  return prisma.cliente.update({ where: { id }, data })
}

export const eliminar = (id: number) => prisma.cliente.delete({ where: { id } })
