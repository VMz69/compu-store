import { uiMeta } from '@/ui-traceability'

const SOURCE = 'src/components/product/ProductTrustChips.tsx'

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
    className="w-full grid grid-cols-3 gap-2 mt-4 text-center"
    {...uiMeta({
      id: 'producto.detalle.trust',
      component: 'ProductTrustChips',
      source: SOURCE,
    })}
  >
    {CHIPS.map((chip, index) => (
      <div
        key={chip.label}
        className="bg-slate-50 dark:bg-slate-800/60 rounded-xl p-2 border border-slate-100 dark:border-slate-800"
        {...uiMeta({
          id: `producto.detalle.trust.${index}`,
          component: 'ProductTrustChips',
          source: SOURCE,
        })}
      >
        <i className={`${chip.icon} text-sm mb-1 block`} />
        <span className="text-[10px] font-bold text-slate-700 dark:text-slate-300 block leading-tight">
          {chip.label}
        </span>
      </div>
    ))}
  </div>
)
