import { Link, useParams } from 'react-router-dom'
import { ProductBuyBox } from '@/components/product/ProductBuyBox'
import { ProductDetailHeader } from '@/components/product/ProductDetailHeader'
import { ProductGallery } from '@/components/product/ProductGallery'
import { ProductTabs } from '@/components/product/ProductTabs'
import { RelatedList } from '@/components/product/RelatedList'
import { EmptyState } from '@/components/ui/EmptyState'
import { useProductDetail } from '@/hooks/useProductDetail'
import { useProductTabs } from '@/hooks/useProductTabs'
import { uiMeta } from '@/ui-traceability'

const SOURCE = 'src/pages/ProductDetail.tsx'

export const ProductDetail = () => {
  const { id } = useParams()
  const detail = useProductDetail(id)
  const tabs = useProductTabs()

  if (!detail.product) {
    return (
      <EmptyState
        icon="fa-solid fa-box-open"
        title="Producto no encontrado"
        description="El producto que buscas no existe o ya no está disponible."
        traceId="producto.empty"
        action={
          <Link
            to="/"
            className="bg-brand hover:bg-brand-hover text-white font-bold text-xs py-2 px-4 rounded-full"
            {...uiMeta({ id: 'producto.empty.cta', component: 'ProductDetail', source: SOURCE })}
          >
            Volver al catálogo
          </Link>
        }
      />
    )
  }

  const product = detail.product

  return (
    <div className="space-y-8">
      <ProductDetailHeader
        productName={product.name}
        categoryLabel={detail.categoryLabel}
        categorySlug={detail.categorySlug}
      />

      <div
        className="bg-white dark:bg-slate-900 rounded-3xl p-6 sm:p-8 lg:p-10 border border-slate-200/90 dark:border-slate-800 shadow-soft-card dark:shadow-none"
        {...uiMeta({ id: 'producto.hero-card', component: 'ProductDetail', source: SOURCE })}
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <ProductGallery
            product={product}
            discount={detail.discount}
            isFavorite={detail.isFavorite}
            onToggleFavorite={detail.toggleFavorite}
          />
          <ProductBuyBox
            product={product}
            availableStock={detail.availableStock}
            quantity={detail.quantity}
            reviewsCount={detail.reviewsCount}
            whatsappUrl={detail.whatsappUrl}
            onIncrement={detail.increment}
            onDecrement={detail.decrement}
            onAddToCart={detail.addToCart}
            onShowReviews={() => tabs.selectTab('reviews')}
          />
        </div>
      </div>

      <ProductTabs
        product={product}
        availableStock={detail.availableStock}
        reviewsCount={detail.reviewsCount}
        activeTab={tabs.activeTab}
        onSelectTab={tabs.selectTab}
      />

      <RelatedList
        products={detail.relatedProducts}
        categoryLabel={detail.categoryLabel}
        categorySlug={detail.categorySlug}
      />
    </div>
  )
}
