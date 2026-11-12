import { Button, Modal, ModalFooter, ModalHeader } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import { useProductDetail } from '../../hooks/useProductDetail'
import { DetailMetrics } from './DetailMetrics'
import { DetailSpecs } from './DetailSpecs'
import { DetailSummary } from './DetailSummary'

const t = tracer('ProductDetailModal', 'src/features/catalog/components/detail/ProductDetailModal.tsx')

export function ProductDetailModal() {
  const detail = useProductDetail()
  if (!detail) return null
  const { product, pricing, severity, gallery, canEdit, canDelete, onEdit, onDelete, onClose } = detail

  return (
    <Modal
      onClose={onClose}
      widthClass="w-[min(94vw,660px)]"
      className="max-h-[92vh]"
      {...t(`catalog.product-detail.${product.id}`)}
    >
      <ModalHeader onClose={onClose} closeMeta={t('catalog.product-detail.close')}>
        <div className="flex items-center gap-2.5">
          <span className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider bg-brand text-white shadow-2xs">
            {product.category}
          </span>
          <span className="text-xs font-mono font-bold text-slate-400 dark:text-slate-500">
            SKU: {product.sku}
          </span>
        </div>
      </ModalHeader>

      <div className="p-5 sm:p-6 overflow-y-auto custom-scrollbar space-y-5 text-xs">
        <DetailSummary product={product} pricing={pricing} gallery={gallery} />
        <DetailMetrics product={product} pricing={pricing} severity={severity} />
        <DetailSpecs product={product} />
      </div>

      <ModalFooter>
        <div>
          {canDelete && (
            <Button
              variant="danger-soft"
              size="md"
              shape="xl"
              icon="fa-solid fa-trash"
              onClick={onDelete}
              {...t('catalog.product-detail.delete')}
            >
              Eliminar
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="md" shape="xl" onClick={onClose} {...t('catalog.product-detail.dismiss')}>
            Cerrar
          </Button>
          {canEdit && (
            <Button size="md" shape="xl" icon="fa-solid fa-pen" onClick={onEdit} {...t('catalog.product-detail.edit')}>
              Editar Producto
            </Button>
          )}
        </div>
      </ModalFooter>
    </Modal>
  )
}
