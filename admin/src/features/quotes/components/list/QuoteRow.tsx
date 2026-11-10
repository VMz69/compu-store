import { formatCurrency } from '@/shared/lib/currency'
import { formatDate } from '@/shared/lib/date'
import { IconButton } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import type { QuoteRowData, QuotesApi } from '../../hooks/useQuotes'
import { isConvertible } from '../../lib/quote.service'
import { QuoteStatusBadge } from '../QuoteStatusBadge'

const t = tracer('QuoteRow', 'src/features/quotes/components/list/QuoteRow.tsx')

interface QuoteRowProps {
  row: QuoteRowData
  actions: Pick<QuotesApi, 'canManage' | 'canConvert' | 'openPreview' | 'accept' | 'reject' | 'promptDelete' | 'convert' | 'openOrder'>
}

/**
 * Fila de cotización. Aceptar/Rechazar solo mientras está "Emitida".
 * Convertir en pedido solo si está vigente (emitida o aceptada) y sin pedido activo.
 */
export function QuoteRow({ row, actions }: QuoteRowProps) {
  const { quote: q, status, totals, validUntil, orderId } = row
  const isOpen = status === 'emitida'

  return (
    <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors" {...t(`quotes.row.${q.id}`)}>
      <td className="py-3 px-4">
        <button
          type="button"
          className="font-mono font-bold text-brand hover:underline flex items-center gap-1.5"
          onClick={() => actions.openPreview(q)}
          {...t(`quotes.open.${q.id}`)}
        >
          <i className="fa-solid fa-file-pdf text-[11px]" aria-hidden="true" /> {q.id}
        </button>
        <span className="text-[10px] text-slate-400">{formatDate(q.createdAt)}</span>
      </td>
      <td className="py-3 px-3">
        <p className="font-bold text-slate-800 dark:text-slate-100">{q.customer.name}</p>
        <p className="text-[10px] text-slate-400">
          {q.customer.phone || 'Sin teléfono'}
          {!q.customer.customerId && ' · Cliente ocasional'}
        </p>
      </td>
      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 text-[11px]">
        {q.items.length} producto{q.items.length === 1 ? '' : 's'} · {totals.units} unid.
        {(q.charges?.length ?? 0) > 0 && ` · ${q.charges.length} cargo${q.charges.length === 1 ? '' : 's'} extra`}
      </td>
      <td className="py-3 px-3 text-right font-black text-slate-800 dark:text-slate-100 tabular-nums">{formatCurrency(totals.total)}</td>
      <td className="py-3 px-3">
        <QuoteStatusBadge status={status} />
        {orderId ? (
          <button type="button" className="block text-[10px] font-bold text-brand hover:underline mt-0.5" onClick={() => actions.openOrder(orderId)} {...t(`quotes.order.${q.id}`)}>
            Pedido {orderId} <i className="fa-solid fa-arrow-up-right-from-square text-[8px]" aria-hidden="true" />
          </button>
        ) : (
          <p className="text-[10px] text-slate-400 mt-0.5">Vence {formatDate(validUntil)}</p>
        )}
      </td>
      <td className="py-3 px-3 text-[11px] text-slate-500 dark:text-slate-400">{q.createdBy}</td>
      <td className="py-3 px-4">
        <div className="flex items-center justify-end gap-1.5">
          <IconButton icon="fa-solid fa-eye" label="Ver PDF" tone="brand" onClick={() => actions.openPreview(q)} {...t(`quotes.preview.${q.id}`)} />
          {actions.canConvert && isConvertible(status) && (
            <IconButton icon="fa-solid fa-cart-arrow-down" label="Convertir en pedido" tone="brand" onClick={() => actions.convert(q)} {...t(`quotes.convert.${q.id}`)} />
          )}
          {actions.canManage && isOpen && (
            <>
              <IconButton icon="fa-solid fa-check" label="Marcar como aceptada" tone="neutral" onClick={() => actions.accept(q)} {...t(`quotes.accept.${q.id}`)} />
              <IconButton icon="fa-solid fa-xmark" label="Marcar como rechazada" tone="neutral" onClick={() => actions.reject(q)} {...t(`quotes.reject.${q.id}`)} />
            </>
          )}
          {actions.canManage && !orderId && (
            <IconButton icon="fa-solid fa-trash" label="Eliminar cotización" tone="danger" onClick={() => actions.promptDelete(q)} {...t(`quotes.delete.${q.id}`)} />
          )}
        </div>
      </td>
    </tr>
  )
}
