import { Button, ListToolbar, LiveSearch, SegmentedTabs } from '@/00-director-interfaz'
import { tracer } from '@/00-trazabilidad'
import type { TaxonomyPageApi, TaxonomyTab } from '../../hooks/taxonomy/useTaxonomyPage'

const t = tracer('TaxonomyToolbar', 'src/features/catalog/components/taxonomy/TaxonomyToolbar.tsx')

/** Barra estándar de listados: áreas (categorías / marcas) · buscador ··· alta contextual. */
export function TaxonomyToolbar({ page }: { page: TaxonomyPageApi }) {
  const isBrands = page.tab === 'marcas'

  return (
    <ListToolbar
      traceId="catalog.taxonomy.toolbar"
      context={['Categorías y marcas', page.areaLabel]}
      tabs={
        <SegmentedTabs<TaxonomyTab>
          items={[
            { id: 'categorias', label: 'Categorías', icon: 'fa-solid fa-layer-group', count: page.counts.categorias },
            { id: 'marcas', label: 'Marcas', icon: 'fa-solid fa-copyright', count: page.counts.marcas },
          ]}
          value={page.tab}
          onChange={page.selectTab}
          aria-label="Taxonomía del catálogo"
          traceId="catalog.taxonomy.tab"
        />
      }
      search={
        <LiveSearch
          key={page.tab}
          value={page.search}
          onChange={page.onSearch}
          onClear={page.clearSearch}
          resultCount={page.resultCount}
          placeholder={isBrands ? 'Buscar marca o sitio web…' : 'Buscar categoría…'}
          aria-label={isBrands ? 'Buscar marcas' : 'Buscar categorías'}
          {...t('catalog.taxonomy.search')}
        />
      }
      action={
        page.canCreate && (
          <Button icon={isBrands ? 'fa-solid fa-plus' : 'fa-solid fa-folder-plus'} onClick={page.create} {...t(`catalog.taxonomy.create.${page.tab}`)}>
            {page.createLabel}
          </Button>
        )
      }
    />
  )
}
