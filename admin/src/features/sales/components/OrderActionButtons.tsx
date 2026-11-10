import { Button } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { OrderActionButton } from '../hooks/useOrderActions'
import type { OrderAction } from '../lib/orderFlow'

const t = tracer('OrderActionButtons', 'src/features/sales/components/OrderActionButtons.tsx')

interface OrderActionButtonsProps {
  buttons: OrderActionButton[]
  onRun: (action: OrderAction) => void
  /** Prefijo de trazabilidad (ej. "sales.table.actions.ORD-2026-001"). */
  traceId: string
  size?: 'xs' | 'md'
  emptyLabel?: string
}

/** Acciones del flujo disponibles para el estado actual del pedido. */
export function OrderActionButtons({ buttons, onRun, traceId, size = 'xs', emptyLabel = 'Sin acciones' }: OrderActionButtonsProps) {
  if (buttons.length === 0) return <span className="text-[11px] text-slate-400">{emptyLabel}</span>

  return (
    <div className="flex items-center justify-end gap-1.5" {...t(traceId)}>
      {buttons.map((b) => (
        <Button
          key={b.action}
          size={size}
          shape={size === 'md' ? 'xl' : undefined}
          variant={b.tone === 'danger' ? 'danger-soft' : size === 'md' ? 'primary' : 'tint'}
          icon={b.icon}
          onClick={() => onRun(b.action)}
          {...t(`${traceId}.${b.action}`)}
        >
          {b.label}
        </Button>
      ))}
    </div>
  )
}
