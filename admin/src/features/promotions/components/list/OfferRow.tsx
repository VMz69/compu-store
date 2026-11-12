import { formatCurrency } from '@/82-pipeline-calculo-importes/02-currency'
import { formatDate } from '@/71-pipeline-seleccion-fechas/05-date'
import { Badge, IconButton } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { OffersApi } from '../../hooks/useOffers'
import { OFFER_STATUS_META } from '../../lib/offerPricing'

const t = tracer('OfferRow', 'src/features/promotions/components/list/OfferRow.tsx')

type Row = OffersApi['rows'][number]

const day = (iso: string) => formatDate(`${iso}T00:00:00`)

/** Fila de oferta: alcance, descuento, vigencia, salud del margen, estado y acciones. */
export function OfferRow({ row, api }: { row: Row; api: OffersApi }) {
  const { offer: o, status, productNames, minMargin, belowCost } = row
  const meta = OFFER_STATUS_META[status]

  return (
    <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40 transition-colors" {...t(`promotions.row.${o.id}`)}>
      <td className="py-3 px-4">
        <p className="font-bold text-slate-800 dark:text-slate-100">{o.title}</p>
        <p className="text-[10px] text-slate-400"><span className="font-mono">{o.id}</span> · {o.badge}</p>
      </td>
      <td className="py-3 px-3 max-w-xs">
        <p className="font-semibold text-slate-700 dark:text-slate-200">{productNames.length} producto(s)</p>
        <p className="text-[10px] text-slate-400 truncate" title={productNames.join(', ')}>{productNames.join(', ') || '—'}</p>
      </td>
      <td className="py-3 px-3 font-black text-brand whitespace-nowrap">
        {o.discountType === 'percent' ? `−${o.discountValue}%` : `−${formatCurrency(o.discountValue)}`}
      </td>
      <td className="py-3 px-3 whitespace-nowrap text-[11px] text-slate-600 dark:text-slate-300">
        {day(o.startDate)} → {day(o.endDate)}
      </td>
      <td className="py-3 px-3 text-right whitespace-nowrap">
        {belowCost ? (
          <span className="text-[11px] font-bold text-red-600 dark:text-red-400" title="Algún producto quedó bajo su costo (¿cambió el costo o el precio?)">
            <i className="fa-solid fa-triangle-exclamation mr-1" aria-hidden="true" />Bajo costo
          </span>
        ) : (
          <span className="text-[11px] font-bold tabular-nums text-slate-700 dark:text-slate-200">{minMargin === null ? '—' : `${minMargin.toFixed(1)}%`}</span>
        )}
      </td>
      <td className="py-3 px-3"><Badge tone={meta.tone}>{meta.label}</Badge></td>
      <td className="py-3 px-4">
        {api.canManage && (
          <div className="flex items-center justify-end gap-0.5">
            {status !== 'vencida' && (
              <IconButton
                icon={o.paused ? 'fa-solid fa-play' : 'fa-solid fa-pause'}
                label={o.paused ? 'Reanudar oferta' : 'Pausar oferta'}
                tone="plain"
                sizeClass="w-7 h-7"
                onClick={() => api.togglePause(o)}
                {...t(`promotions.row.pause.${o.id}`)}
              />
            )}
            <IconButton
              icon={status === 'vencida' ? 'fa-solid fa-eye' : 'fa-solid fa-pen'}
              label={status === 'vencida' ? 'Ver oferta' : 'Editar oferta'}
              tone="plain"
              sizeClass="w-7 h-7"
              onClick={() => api.edit(o)}
              {...t(`promotions.row.edit.${o.id}`)}
            />
            <IconButton
              icon="fa-solid fa-trash-can"
              label={status === 'vigente' ? 'Pausa la oferta para poder eliminarla' : 'Eliminar oferta'}
              tone="plain"
              sizeClass="w-7 h-7"
              className={status === 'vigente' ? 'opacity-40' : 'hover:text-red-500! hover:bg-red-50! dark:hover:bg-red-950/40!'}
              aria-disabled={status === 'vigente'}
              onClick={() => api.remove(o)}
              {...t(`promotions.row.delete.${o.id}`)}
            />
          </div>
        )}
      </td>
    </tr>
  )
}
