import { ACCESS_MODALS, ResetPasswordModal, UserFormModal } from '@/features/access'
import { BILLING_MODALS, InvoiceEmitModal, InvoicePreviewModal } from '@/features/billing'
import { CATALOG_MODALS, CategoryFormModal, ProductDetailModal, ProductFormModal } from '@/features/catalog'
import { CustomerFormModal, CUSTOMERS_MODALS } from '@/features/customers'
import { OfferFormModal, PROMOTIONS_MODALS } from '@/features/promotions'
import { QuotePreviewModal, QUOTES_MODALS } from '@/features/quotes'
import {
  ChannelFormModal,
  OrderDetailModal,
  OrderFormModal,
  SALES_MODALS,
  StatusDetailModal,
} from '@/features/sales'
import { useModalStore } from '@/shared/store/modal.store'

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
    case SALES_MODALS.orderForm:
      return <OrderFormModal />
    case SALES_MODALS.orderDetail:
      return <OrderDetailModal />
    case SALES_MODALS.channelForm:
      return <ChannelFormModal />
    case SALES_MODALS.statusDetail:
      return <StatusDetailModal />
    case ACCESS_MODALS.userForm:
      return <UserFormModal />
    case ACCESS_MODALS.resetPassword:
      return <ResetPasswordModal />
    case CUSTOMERS_MODALS.customerForm:
      return <CustomerFormModal />
    case PROMOTIONS_MODALS.offerForm:
      return <OfferFormModal />
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
