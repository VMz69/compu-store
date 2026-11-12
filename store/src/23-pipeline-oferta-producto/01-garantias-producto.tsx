import { uiMeta } from '@/04-trazabilidad-ui'

const SOURCE = 'src/features/catalog/components/detail/ProductTrustChips.tsx'

const CHIPS = [
  {
    icon: 'fa-solid fa-truck-fast text-brand',
    label: 'Envíos a todo El Salvador',
  },
  {
    icon: 'fa-solid fa-shield-halved text-emerald-600',
    label: 'Garantía por Escrito',
  },
  {
    icon: 'fa-solid fa-store text-sky-600',
    label: 'Retiro en Cojutepeque',
  },
]

export const ProductTrustChips = () => (
  <div
    className="space-y-2"
    {...uiMeta({
      id: 'producto.detalle.trust',
      component: 'ProductTrustChips',
      source: SOURCE,
    })}
  >
    {CHIPS.map((chip, index) => (
      <div
        key={chip.label}
        className="flex items-center gap-2.5"
        {...uiMeta({
          id: `producto.detalle.trust.${index}`,
          component: 'ProductTrustChips',
          source: SOURCE,
        })}
      >
        <span className="w-7 h-7 shrink-0 rounded-lg bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex items-center justify-center">
          <i className={`${chip.icon} text-xs`} />
        </span>
        <span className="text-xs font-semibold text-slate-600 dark:text-slate-300 leading-tight">
          {chip.label}
        </span>
      </div>
    ))}
  </div>
)
