import type { SelectOption } from '@/shared/ui'
import { tracer } from '@/ui-traceability'

const t = tracer('OrderStatusSelect', 'src/features/sales/components/OrderStatusSelect.tsx')

interface OrderStatusSelectProps {
  orderId: string
  value: string
  options: SelectOption[]
  onChange: (orderId: string, status: string) => void
  /** Motivo de bloqueo (ej. pedido facturado). Si existe, el selector se deshabilita. */
  lockedReason?: string
}

/** Selector de transición operativa de un pedido. */
export function OrderStatusSelect({ orderId, value, options, onChange, lockedReason }: OrderStatusSelectProps) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(orderId, event.target.value)}
      aria-label={`Estado del pedido ${orderId}`}
      disabled={Boolean(lockedReason)}
      title={lockedReason}
      className="text-[11px] font-bold py-1 px-2 border border-slate-200 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 focus:border-brand outline-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
      {...t(`sales.table.status.${orderId}`)}
    >
      {options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}
