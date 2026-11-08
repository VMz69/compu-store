import { Badge, Modal, ModalHeader } from '@/shared/ui'
import { tracer } from '@/ui-traceability'
import { useProductForm } from '../../hooks/useProductForm'
import { ProductFormFooter } from './ProductFormFooter'
import { ProductFormTabs } from './ProductFormTabs'
import { GeneralTab } from './tabs/GeneralTab'
import { LogisticsTab } from './tabs/LogisticsTab'
import { PricingTab } from './tabs/PricingTab'
import { SpecsTab } from './tabs/SpecsTab'

const t = tracer('ProductFormModal', 'src/features/catalog/components/form/ProductFormModal.tsx')

/**
 * Alta/edición de producto en 4 secciones (General · Precios · Especificaciones · Inventario).
 * Alto fijo para que cambiar de sección no haga "saltar" el modal; el cuerpo hace scroll.
 */
export function ProductFormModal() {
  const api = useProductForm()
  const { isEdit, title, subtitle, form, tabs, onSubmit, onClose } = api

  return (
    <Modal
      onClose={onClose}
      widthClass="w-[min(96vw,880px)]"
      className="h-[min(92vh,720px)]"
      aria-labelledby="product-form-title"
      {...t('catalog.product-form')}
    >
      <ModalHeader onClose={onClose} closeMeta={t('catalog.product-form.close')}>
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-9 h-9 rounded-xl bg-brand/10 text-brand flex items-center justify-center shrink-0">
            <i className={isEdit ? 'fa-solid fa-pen-to-square' : 'fa-solid fa-box-open'} aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <h3 id="product-form-title" className="text-sm font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
              {title}
              <Badge tone={form.values.active ? 'success' : 'neutral'} shape="full">
                {form.values.active ? 'Visible en web' : 'Oculto en web'}
              </Badge>
            </h3>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">{subtitle}</p>
          </div>
        </div>
      </ModalHeader>

      <form noValidate onSubmit={onSubmit} className="flex-1 min-h-0 flex flex-col" {...t('catalog.product-form.form')}>
        <ProductFormTabs active={tabs.active} errorCounts={api.errorCounts} onSelect={tabs.select} />

        <div
          key={tabs.active}
          id="product-form-panel"
          role="tabpanel"
          aria-labelledby={`product-form-tab-${tabs.active}`}
          className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-5 sm:p-6 text-xs animate-fade-in"
          {...t(`catalog.product-form.panel.${tabs.active}`)}
        >
          {tabs.active === 'general' && <GeneralTab api={api} />}
          {tabs.active === 'pricing' && <PricingTab api={api} />}
          {tabs.active === 'specs' && <SpecsTab api={api} />}
          {tabs.active === 'logistics' && <LogisticsTab api={api} />}
        </div>

        <ProductFormFooter api={api} />
      </form>
    </Modal>
  )
}
