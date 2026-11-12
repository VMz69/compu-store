import { cn } from '@/83-pipeline-recursos-publicos/02-cn'
import { formatCurrency } from '@/82-pipeline-calculo-importes/02-currency'
import { clickable, isolate } from '@/83-pipeline-recursos-publicos/03-events'
import { IconButton, SafeImage } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { ProductActions } from '../../hooks/useProductActions'
import { getStockSeverity } from '../../lib/catalog.service'
import type { Product, StockSeverity } from '../../types'
import { StockBadge } from '../StockBadge'
import { ReservedBadge } from '../ReservedBadge'

const t = tracer('ProductTableRow', 'src/features/catalog/components/table/ProductTableRow.tsx')

const STOCK_TEXT: Record<StockSeverity, string> = {
  out: 'text-red-500',
  low: 'text-amber-500',
  ok: 'text-slate-700 dark:text-slate-200',
}

interface ProductTableRowProps {
  product: Product
  actions: ProductActions
}

export function ProductTableRow({ product: p, actions }: ProductTableRowProps) {
  return (
    <tr
      {...clickable(() => actions.openDetail(p.id))}
      className="hover:bg-brand-50/40 dark:hover:bg-brand-950/20 transition-colors group"
      {...t(`catalog.table.row.${p.id}`)}
    >
      <td className="py-2.5 px-4">
        <div className="flex items-center gap-3">
          <SafeImage
            src={p.imageUrl}
            alt={p.name}
            className={cn(
              'w-9 h-9 rounded-lg object-cover border border-slate-200 dark:border-slate-700 shrink-0',
              !p.active && 'grayscale opacity-60',
            )}
          />
          <div>
            <p className="font-bold text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-brand transition-colors">
              {p.name}
            </p>
            <span className="text-[10px] text-slate-400 font-mono">{p.sku}</span>
          </div>
        </div>
      </td>
      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300 capitalize">{p.category}</td>
      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">{p.brand}</td>
      <td className="py-2.5 px-3 text-right font-black text-brand">{formatCurrency(p.price)}</td>
      <td className="py-2.5 px-3 text-center">
        <span className={cn('font-bold', STOCK_TEXT[getStockSeverity(p.stock, p.reorderPoint)])}>{p.stock}</span>
      </td>
      <td className="py-2.5 px-3">
        <div className="flex flex-col items-start gap-1">
          <StockBadge stock={p.stock} active={p.active} reorderPoint={p.reorderPoint} />
          <ReservedBadge productId={p.id} stock={p.stock} />
        </div>
      </td>
      <td className="py-2.5 px-4 text-right space-x-2" {...isolate}>
        {actions.permissions.canEdit && (
          <IconButton
            icon="fa-solid fa-pen"
            label="Editar Producto"
            tone="brand"
            onClick={() => actions.openEdit(p)}
            {...t(`catalog.table.edit.${p.id}`)}
          />
        )}
        {actions.permissions.canDelete && (
          <IconButton
            icon="fa-solid fa-trash"
            label="Eliminar Producto"
            tone="danger"
            onClick={() => actions.promptDelete(p)}
            {...t(`catalog.table.delete.${p.id}`)}
          />
        )}
      </td>
    </tr>
  )
}
