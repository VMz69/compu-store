import type { EstadoPedido } from './02-ajustes-ventas.schema.js'

/**
 * Máquina de estados del pedido (regla de negocio fija; = `orderFlow.ts` del admin):
 *
 *   Registrado ──► Reservado ──► Facturado ──► Entregado
 *     │  ▲            │   ▲            │
 *     │  └─ vence ────┘   └── anular ──┘
 *     └──► Cancelado ◄────┘
 *
 * `PATCH /pedidos/:id/estado` solo cancela y entrega. Reservar (`POST /pedidos/:id/reserva`, L14) y
 * facturar (L15) tienen sus propias operaciones, porque mueven stock; el vencimiento de la reserva
 * (Reservado → Registrado) lo hace el servidor (`11-reservas.service`).
 */
export const TRANSICIONES: Record<EstadoPedido, EstadoPedido[]> = {
  registrado: ['confirmado', 'cancelado'],
  confirmado: ['facturado', 'cancelado'],
  facturado: ['entregado'],
  entregado: [],
  cancelado: [],
}

/** Destinos que acepta el cambio de estado manual en L13. */
export const DESTINOS_MANUALES = ['cancelado', 'entregado'] as const
export type DestinoManual = (typeof DESTINOS_MANUALES)[number]

export const puedeTransicionar = (desde: EstadoPedido, hacia: EstadoPedido): boolean => TRANSICIONES[desde].includes(hacia)

/** Editable mientras no tenga factura: Registrado o Reservado. */
const EDITABLES: EstadoPedido[] = ['registrado', 'confirmado']

/** Motivo por el que el pedido no se puede editar, o null. `nombre` da el texto visible del estado. */
export function motivoNoEditable(estado: EstadoPedido, nombre: string): string | null {
  if (estado === 'facturado' || estado === 'entregado') {
    return `El pedido ya tiene factura ("${nombre}"). Para corregirlo, anula la factura primero.`
  }
  return EDITABLES.includes(estado) ? null : `Un pedido en estado "${nombre}" ya no se puede editar.`
}

/** Eliminación lógica: solo sin factura (Registrado, Reservado o Cancelado). */
export function motivoNoEliminable(estado: EstadoPedido, nombre: string): string | null {
  return estado === 'facturado' || estado === 'entregado' ? `Un pedido "${nombre}" no se puede eliminar.` : null
}
