import { formatCurrency } from '@/shared/lib/currency'
import { isolate } from '@/shared/lib/events'
import { Switch } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { ProductActions } from '../../hooks/useProductActions'
import type { Product } from '../../types'
import { StockBadge } from '../StockBadge'
import { ReservedBadge } from '../ReservedBadge'
import { StockStepper } from '../StockStepper'

const t = tracer('CardBody', 'src/features/catalog/components/grid/CardBody.tsx')

interface CardBodyProps {
  product: Product
  actions: ProductActions
}

/** Información comercial + controles rápidos (stock y visibilidad web). */
export function CardBody({ product: p, actions }: CardBodyProps) {
  return (
    <div className="p-3.5 flex-1 flex flex-col justify-between">
      <div>
        <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono mb-1">
          <span>{p.brand}</span>
          <span>{p.sku}</span>
        </div>
        <h3
          className="text-xs font-bold text-slate-800 dark:text-slate-100 line-clamp-2 leading-tight"
          title={p.name}
        >
          {p.name}
        </h3>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-sm font-black text-brand">{formatCurrency(p.price)}</span>
            {p.originalPrice && (
              <span className="text-[10px] text-slate-400 line-through ml-1">
                {formatCurrency(p.originalPrice)}
              </span>
            )}
          </div>
          <div className="flex flex-col items-end gap-1">
            <StockBadge stock={p.stock} active={p.active} reorderPoint={p.reorderPoint} />
            <ReservedBadge productId={p.id} stock={p.stock} />
          </div>
        </div>

        <div
          className="flex items-center justify-between bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg text-xs"
          {...isolate}
          {...t(`catalog.card.controls.${p.id}`)}
        >
          <StockStepper
            productId={p.id}
            stock={p.stock}
            editable={actions.permissions.canUpdateStock && !p.lotControl}
            lotControlled={p.lotControl}
            onAdjust={actions.adjustStock}
          />
          {actions.permissions.canToggle && (
            <Switch
              checked={p.active}
              label="Activar/Desactivar visibilidad web"
              onChange={() => actions.toggleVisibility(p.id)}
              {...t(`catalog.card.visibility.${p.id}`)}
            />
          )}
        </div>
      </div>
    </div>
  )
}
