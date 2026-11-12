import { tracer } from '@/00-trazabilidad'

const t = tracer('BranchBanner', 'src/features/dashboard/components/BranchBanner.tsx')

interface BranchBannerProps {
  title: string
  address: string
  schedule: string
  canCreateProduct: boolean
  canRegisterOrder: boolean
  onCreateProduct: () => void
  onRegisterOrder: () => void
}

/** Banner de sucursal con acciones rápidas primarias según permisos. */
export function BranchBanner(props: BranchBannerProps) {
  const { title, address, schedule, canCreateProduct, canRegisterOrder, onCreateProduct, onRegisterOrder } = props

  return (
    <div
      className="bg-linear-to-r from-brand-navy to-brand p-4 sm:p-5 rounded-2xl text-white shadow-soft-card flex flex-col md:flex-row md:items-center justify-between gap-4"
      {...t('dashboard.banner')}
    >
      <div className="flex items-center gap-3.5">
        <div className="w-11 h-11 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
          <i className="fa-solid fa-store text-xl text-white" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-sm sm:text-base font-black tracking-wide">{title}</h3>
          <p className="text-xs text-white/80">
            {address} · Horario: {schedule}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {canCreateProduct && (
          <button
            type="button"
            className="h-8 px-3.5 rounded-lg bg-white text-brand hover:bg-brand-50 text-xs font-extrabold shadow-sm transition-colors flex items-center gap-1.5"
            onClick={onCreateProduct}
            {...t('dashboard.banner.create-product')}
          >
            <i className="fa-solid fa-plus text-[10px]" aria-hidden="true" /> Añadir Producto
          </button>
        )}
        {canRegisterOrder && (
          <button
            type="button"
            className="h-8 px-3.5 rounded-lg bg-white/20 hover:bg-white/30 text-white text-xs font-bold transition-colors flex items-center gap-1.5 border border-white/20"
            onClick={onRegisterOrder}
            {...t('dashboard.banner.register-order')}
          >
            <i className="fa-solid fa-cart-plus text-[10px]" aria-hidden="true" /> Registrar Pedido
          </button>
        )}
      </div>
    </div>
  )
}
