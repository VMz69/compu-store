import { ACCESS_MODALS, ResetPasswordModal, UserFormModal } from '@/00-director-acceso'
import { BILLING_MODALS, InvoiceEmitModal, InvoicePreviewModal } from '@/00-director-facturacion'
import { BrandFormModal, CATALOG_MODALS, CategoryFormModal, ProductDetailModal, ProductFormModal } from '@/00-director-catalogo'
import { CustomerFormModal, CUSTOMERS_MODALS } from '@/00-director-clientes'
import { QuotePreviewModal, QUOTES_MODALS } from '@/00-director-cotizaciones'
import {
  ChannelFormModal,
  OrderDetailModal,
  ReserveOrderModal,
  SALES_MODALS,
  StatusLabelModal,
} from '@/00-director-ventas'
import { useModalStore } from '@/73-pipeline-modales-globales/03-modal.store'

/** Resuelve el modal activo del store global (14 modales del sistema). */
export function ModalHost() {
  const type = useModalStore((s) => s.type)

  switch (type) {
    case CATALOG_MODALS.productForm:
      return <ProductFormModal />
    case CATALOG_MODALS.productDetail:
      return <ProductDetailModal />
    case CATALOG_MODALS.categoryForm:
      return <CategoryFormModal />
    case CATALOG_MODALS.brandForm:
      return <BrandFormModal />
    case SALES_MODALS.orderDetail:
      return <OrderDetailModal />
    case SALES_MODALS.channelForm:
      return <ChannelFormModal />
    case SALES_MODALS.reserveOrder:
      return <ReserveOrderModal />
    case SALES_MODALS.statusLabel:
      return <StatusLabelModal />
    case ACCESS_MODALS.userForm:
      return <UserFormModal />
    case ACCESS_MODALS.resetPassword:
      return <ResetPasswordModal />
    case CUSTOMERS_MODALS.customerForm:
      return <CustomerFormModal />
    case QUOTES_MODALS.preview:
      return <QuotePreviewModal />
    case BILLING_MODALS.emit:
      return <InvoiceEmitModal />
    case BILLING_MODALS.preview:
      return <InvoicePreviewModal />
    default:
      return null
  }
}
