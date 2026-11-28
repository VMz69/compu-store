import { Prisma } from '../../generated/prisma/client.js'
import { meta, type MetaPaginacion, type Paginacion } from '../04-pipeline-http/00-director-http.js'
import { ESTADOS_VENDIDOS, estadisticasPorCliente, totalesPorEstado } from '../11-pipeline-pedidos/00-director-pedidos.js'

/** Pedidos en curso: registrados, confirmados o facturados sin entregar (`ACTIVE_STATUSES` del admin). */
const ESTADOS_ACTIVOS = ['registrado', 'confirmado', 'facturado']

export interface TableroDto {
  pedidos: {
    total: number
    registrados: number
    confirmados: number
    facturados: number
    entregados: number
    cancelados: number
    activos: number
    /** Venta efectiva (facturados + entregados), string decimal (D-05). */
    ventas: string
  }
}

export interface EstadisticaClienteDto {
  clienteId: number
  pedidos: number
  /** Total de los pedidos facturados o entregados, string decimal (D-05). */
  totalComprado: string
  /** Fecha del último pedido (ISO UTC) o null. */
  ultimoPedido: string | null
}

/** Métricas comerciales del tablero (28). */
export async function tablero(): Promise<TableroDto> {
  const filas = await totalesPorEstado()
  const contar = (estados: string[]) => filas.filter((f) => estados.includes(f.estado)).reduce((acc, f) => acc + f.pedidos, 0)
  const ventas = filas
    .filter((f) => ESTADOS_VENDIDOS.includes(f.estado))
    .reduce((acc, f) => acc.add(f.importe), new Prisma.Decimal(0))
  return {
    pedidos: {
      total: contar(filas.map((f) => f.estado)),
      registrados: contar(['registrado']),
      confirmados: contar(['confirmado']),
      facturados: contar(['facturado']),
      entregados: contar(['entregado']),
      cancelados: contar(['cancelado']),
      activos: contar(ESTADOS_ACTIVOS),
      ventas: ventas.toFixed(2),
    },
  }
}

/** Historial y estadísticas de compra de los clientes del directorio (17). */
export async function estadisticasClientes(paginacion: Paginacion): Promise<{ data: EstadisticaClienteDto[]; meta: MetaPaginacion }> {
  const [filas, total] = await estadisticasPorCliente(paginacion)
  return {
    data: filas.map((f) => ({
      clienteId: f.clienteId,
      pedidos: f.pedidos,
      totalComprado: f.totalComprado.toFixed(2),
      ultimoPedido: f.ultimoPedido ? f.ultimoPedido.toISOString() : null,
    })),
    meta: meta(paginacion, total),
  }
}
