import { formatCurrency } from '@/82-pipeline-calculo-importes/02-currency'
import { Badge, IconButton } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { CustomerRowData, CustomersApi } from './02-useCustomers'

const t = tracer('CustomerRow', 'src/features/customers/components/CustomerRow.tsx')

interface CustomerRowProps {
  row: CustomerRowData
  actions: Pick<CustomersApi, 'canManage' | 'canDelete' | 'openEdit' | 'promptDelete'>
}

export function CustomerRow({ row, actions }: CustomerRowProps) {
  const { customer: c, stats, whatsappLink } = row
  const isCompany = c.type === 'empresa'

  return (
    <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors" {...t(`customers.row.${c.id}`)}>
      <td className="py-3 px-4">
        <div className="flex items-center gap-3 min-w-0">
          <span className={isCompany ? 'w-8 h-8 rounded-lg bg-purple-50 dark:bg-purple-950/40 text-purple-600 dark:text-purple-300 flex items-center justify-center shrink-0' : 'w-8 h-8 rounded-lg bg-brand/10 text-brand flex items-center justify-center shrink-0'} aria-hidden="true">
            <i className={isCompany ? 'fa-solid fa-building text-xs' : 'fa-solid fa-user text-xs'} />
          </span>
          <div className="min-w-0">
            <p className="font-bold text-slate-800 dark:text-slate-100 truncate">{c.name}</p>
            <span className="text-[10px] text-slate-400 font-mono">
              {c.id}
              {c.documentId && ` · ${isCompany ? 'NIT' : 'DUI'} ${c.documentId}`}
            </span>
          </div>
        </div>
      </td>
      <td className="py-3 px-3">
        <a href={whatsappLink} target="_blank" rel="noreferrer" className="font-semibold text-slate-700 dark:text-slate-200 hover:text-whatsapp inline-flex items-center gap-1.5" title="Escribir por WhatsApp" {...t(`customers.whatsapp.${c.id}`)}>
          <i className="fa-brands fa-whatsapp text-whatsapp" aria-hidden="true" /> {c.phone}
        </a>
        {c.email && (
          <a href={`mailto:${c.email}`} className="block text-[11px] text-slate-500 dark:text-slate-400 hover:text-brand truncate max-w-[220px]" {...t(`customers.email.${c.id}`)}>
            {c.email}
          </a>
        )}
      </td>
      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">{c.city || '—'}</td>
      <td className="py-3 px-3 text-right tabular-nums">
        <p className="font-black text-slate-800 dark:text-slate-100">{formatCurrency(stats.totalSpent)}</p>
        <p className="text-[10px] text-slate-400">
          {stats.orderCount} pedido{stats.orderCount === 1 ? '' : 's'}
          {stats.lastOrderDate && ` · último ${stats.lastOrderDate.slice(0, 10)}`}
        </p>
      </td>
      <td className="py-3 px-3">
        <Badge tone={c.active ? 'success' : 'neutral'}>{c.active ? 'Activo' : 'Inactivo'}</Badge>
      </td>
      {(actions.canManage || actions.canDelete) && (
        <td className="py-3 px-4">
          <div className="flex items-center justify-end gap-1.5">
            {actions.canManage && (
              <IconButton icon="fa-solid fa-pen" label="Editar cliente" tone="brand" onClick={() => actions.openEdit(c)} {...t(`customers.edit.${c.id}`)} />
            )}
            {actions.canDelete && (
              <IconButton icon="fa-solid fa-trash" label="Eliminar cliente" tone="danger" onClick={() => actions.promptDelete(c)} {...t(`customers.delete.${c.id}`)} />
            )}
          </div>
        </td>
      )}
    </tr>
  )
}
