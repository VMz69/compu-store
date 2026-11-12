import { Link, useParams } from 'react-router-dom'
import { ProductBuyBox } from '../components/detail/ProductBuyBox'
import { ProductDetailHeader } from '../components/detail/ProductDetailHeader'
import { ProductGallery } from '../components/detail/ProductGallery'
import { ProductInfo } from '../components/detail/ProductInfo'
import { ProductMobileBar } from '../components/detail/ProductMobileBar'
import { ProductTabs } from '../components/detail/ProductTabs'
import { RelatedList } from '../components/detail/RelatedList'
import { EmptyState } from '@/shared/ui/EmptyState'
import { useProductDetail } from '../hooks/useProductDetail'
import { useProductTabs } from '../hooks/useProductTabs'
import { useShareProduct } from '../hooks/useShareProduct'
import { uiMeta } from '@/04-trazabilidad-ui'

const SOURCE = 'src/features/catalog/pages/ProductDetail.tsx'

export const ProductDetail = () => {
  const { id } = useParams()
  const detail = useProductDetail(id)
  const tabs = useProductTabs(id)
  const { shareProduct } = useShareProduct()

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
    <div className="space-y-4 sm:space-y-6">
      <ProductDetailHeader productName={product.name} categoryLabel={detail.categoryLabel} categorySlug={detail.categorySlug} />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6 items-start xl:items-stretch">
        <section
          className="lg:col-span-8 xl:col-span-9 xl:flex xl:flex-col bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 border border-slate-200/90 dark:border-slate-800 shadow-soft-card dark:shadow-none"
          {...uiMeta({ id: 'producto.hero-card', component: 'ProductDetail', source: SOURCE })}
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] gap-5 sm:gap-6 xl:gap-10 items-start xl:flex-1 xl:items-stretch">
            <ProductGallery key={product.id} productName={product.name} images={detail.images} discount={detail.discount} />
            <ProductInfo
              product={product}
              categoryLabel={detail.categoryLabel}
              reviewsCount={detail.reviewsCount}
              isFavorite={detail.isFavorite}
              onToggleFavorite={detail.toggleFavorite}
              onShare={shareProduct}
              onShowReviews={() => tabs.selectTab('reviews')}
            />
          </div>
        </section>

        <ProductBuyBox
          product={product} discount={detail.discount}
          availableStock={detail.availableStock}
          quantity={detail.quantity}
          whatsappUrl={detail.whatsappUrl}
          onIncrement={detail.increment}
          onDecrement={detail.decrement}
          onAddToCart={detail.addToCart}
        />
      </div>

      <ProductTabs
        product={product}
        availableStock={detail.availableStock}
        reviewsCount={detail.reviewsCount}
        activeTab={tabs.activeTab}
        onSelectTab={tabs.selectTab}
      />

      <RelatedList products={detail.relatedProducts} categoryLabel={detail.categoryLabel} categorySlug={detail.categorySlug} />

      <ProductMobileBar
        productId={product.id}
        isOutOfStock={product.stock <= 0}
        canAddToCart={detail.availableStock > 0}
        quantity={detail.quantity}
        subtotal={detail.subtotal}
        whatsappUrl={detail.whatsappUrl}
        onAddToCart={detail.addToCart}
      />
    </div>
  )
}
