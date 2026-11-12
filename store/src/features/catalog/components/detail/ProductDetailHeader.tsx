import { Link } from 'react-router-dom'
import { Breadcrumbs } from '@/04-pipeline-presentacion-secciones/00-director-presentacion-secciones'
import { uiMeta } from '@/04-trazabilidad-ui'

const SOURCE = 'src/features/catalog/components/detail/ProductDetailHeader.tsx'

interface ProductDetailHeaderProps {
  productName: string
  categoryLabel: string
  categorySlug: string
}

export const ProductDetailHeader = ({
  productName,
  categoryLabel,
  categorySlug,
}: ProductDetailHeaderProps) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <Breadcrumbs
      items={[
        { label: 'Inicio', to: '/' },
        { label: categoryLabel, to: `/category/${categorySlug}` },
        { label: productName },
      ]}
      traceId="producto.breadcrumbs"
    />
    <Link
      to={`/category/${categorySlug}`}
      className="text-xs font-bold text-slate-600 dark:text-slate-300 hover:text-brand hidden sm:flex items-center gap-1.5 transition-colors"
      {...uiMeta({
        id: 'producto.volver',
        component: 'ProductDetailHeader',
        source: SOURCE,
      })}
    >
      <i className="fa-solid fa-arrow-left text-[10px]" />
      <span>Volver a {categoryLabel}</span>
    </Link>
  </div>
)
